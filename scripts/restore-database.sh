#!/bin/bash

# ===========================================
# SCRIPT DE RECUPERACIÓN DE BASE DE DATOS
# PUENTE DE ZARDAIN
# ===========================================

set -e  # Detener script si hay error

# Variables de configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/logs/restore.log"
TEMP_DIR="/tmp/puente_zardain_restore_$$"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message" | tee -a "$LOG_FILE"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" | tee -a "$LOG_FILE"
            ;;
        "DEBUG")
            if [ "${RESTORE_DEBUG:-false}" = "true" ]; then
                echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message" | tee -a "$LOG_FILE"
            fi
            ;;
    esac
}

# Mostrar ayuda
show_help() {
    cat << EOF
USO: $0 [OPCIONES] <ARCHIVO_BACKUP>

OPCIONES:
    -h, --help          Muestra esta ayuda
    -f, --force        Fuerza la restauración sin confirmación
    -d, --download      Descarga backup desde S3 si no existe localmente
    -l, --list         Lista backups disponibles
    -v, --verbose      Modo verbose

EJEMPLOS:
    $0 --list                              # Lista backups disponibles
    $0 backup_20240115_020000.sql          # Restaura backup local
    $0 --download backup_20240115_020000.sql # Descarga y restaura desde S3
    $0 --force backup_20240115_020000.sql   # Fuerza restauración

EOF
}

# Verificar dependencias
check_dependencies() {
    log "INFO" "Verificando dependencias..."
    
    local missing_deps=()
    
    if ! command -v psql &> /dev/null; then
        missing_deps+=("postgresql-client")
    fi
    
    if ! command -v gpg &> /dev/null; then
        missing_deps+=("gnupg")
    fi
    
    if ! command -v aws &> /dev/null; then
        missing_deps+=("aws-cli")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log "ERROR" "Dependencias faltantes: ${missing_deps[*]}"
        log "ERROR" "Instalar con: sudo apt-get install ${missing_deps[*]}"
        exit 1
    fi
    
    log "INFO" "✅ Todas las dependencias están instaladas"
}

# Listar backups disponibles
list_backups() {
    log "INFO" "📋 Listando backups disponibles..."
    
    echo -e "\n${BLUE}=== BACKUPS LOCALES ===${NC}"
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.sql*" -type f -exec ls -lh {} \; | \
        awk '{printf "%-30s %8s %s %s\n", $9, $5, $6, $7, $8}'
    else
        log "WARNING" "Directorio de backups no encontrado: $BACKUP_DIR"
    fi
    
    # Listar backups de S3 si está configurado
    if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
        echo -e "\n${BLUE}=== BACKUPS EN S3 ===${NC}"
        
        aws s3 ls "s3://${AWS_S3_BUCKET}/backups/database/" --recursive --human-readable | \
        awk '{printf "%-50s %8s %s %s\n", $4, $3, $1, $2}'
    fi
    
    echo -e "\n${YELLOW}NOTA: Los archivos .enc están encriptados${NC}"
}

# Descargar backup desde S3
download_from_s3() {
    local backup_name=$1
    local s3_path="backups/database/$(date +%Y)/$(date +%m)/$backup_name"
    
    log "INFO" "☁️  Descargando backup desde S3: $backup_name"
    
    if aws s3 cp "s3://${AWS_S3_BUCKET}/${s3_path}" "${BACKUP_DIR}/${backup_name}" \
        --progress 2>&1 | tee -a "$LOG_FILE"; then
        
        log "INFO" "✅ Backup descargado exitosamente"
        return 0
    else
        log "ERROR" "❌ Fallo al descargar backup desde S3"
        return 1
    fi
}

# Desencriptar backup
decrypt_backup() {
    local encrypted_file=$1
    local decrypted_file="${encrypted_file%.enc}"
    
    log "INFO" "🔐 Desencriptando backup..."
    
    if echo "$BACKUP_ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 \
        --decrypt --output "${TEMP_DIR}/${decrypted_file}" \
        "${BACKUP_DIR}/${encrypted_file}" 2>&1 | tee -a "$LOG_FILE"; then
        
        log "INFO" "✅ Backup desencriptado exitosamente"
        echo "${decrypted_file}"
        return 0
    else
        log "ERROR" "❌ Fallo al desencriptar backup"
        return 1
    fi
}

# Validar backup
validate_backup() {
    local backup_file=$1
    
    log "INFO" "🔍 Validando backup: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR" "❌ Archivo de backup no encontrado: $backup_file"
        return 1
    fi
    
    # Verificar tamaño mínimo
    local min_size=1024  # 1KB mínimo
    local actual_size=$(stat -c%s "$backup_file")
    
    if [ "$actual_size" -lt "$min_size" ]; then
        log "ERROR" "❌ Backup demasiado pequeño: ${actual_size} bytes"
        return 1
    fi
    
    # Si está encriptado, verificar formato GPG
    if [[ "$backup_file" == *.enc ]]; then
        if ! gpg --list-packets "$backup_file" >/dev/null 2>&1; then
            log "ERROR" "❌ Backup encriptado corrupto"
            return 1
        fi
    fi
    
    # Si es SQL, verificar estructura básica
    if [[ "$backup_file" == *.sql ]]; then
        if ! head -n 10 "$backup_file" | grep -q "PostgreSQL database dump"; then
            log "ERROR" "❌ Formato de backup inválido"
            return 1
        fi
    fi
    
    log "INFO" "✅ Backup validado exitosamente"
    return 0
}

# Crear backup antes de restaurar
pre_restore_backup() {
    log "INFO" "📦 Creando backup de seguridad antes de restaurar..."
    
    local pre_backup_file="pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
    local pre_backup_path="${BACKUP_DIR}/${pre_backup_file}"
    
    # Extraer información de conexión de DATABASE_URL
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    else
        log "ERROR" "Formato de DATABASE_URL inválido"
        exit 1
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --no-password --format=custom --compress=9 \
        --file="$pre_backup_path" 2>&1 | tee -a "$LOG_FILE"; then
        
        log "INFO" "✅ Backup de seguridad creado: $pre_backup_file"
        unset PGPASSWORD
        return 0
    else
        log "ERROR" "❌ Fallo al crear backup de seguridad"
        unset PGPASSWORD
        return 1
    fi
}

# Restaurar base de datos
restore_database() {
    local backup_file=$1
    
    log "INFO" "🗄️  Restaurando base de datos desde: $backup_file"
    
    # Extraer información de conexión de DATABASE_URL
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    else
        log "ERROR" "Formato de DATABASE_URL inválido"
        exit 1
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Eliminar y recrear base de datos
    log "INFO" "🗑️  Eliminando base de datos existente..."
    
    # Desconectar usuarios
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
        2>/dev/null || true
    
    # Eliminar base de datos
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | tee -a "$LOG_FILE"
    
    # Crear base de datos
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "CREATE DATABASE $DB_NAME;" 2>&1 | tee -a "$LOG_FILE"
    
    # Restaurar backup
    log "INFO" "📥 Restaurando datos..."
    
    if pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
        --no-password --verbose --clean --if-exists \
        --disable-triggers --no-owner --no-privileges \
        -d "$DB_NAME" "$backup_file" 2>&1 | tee -a "$LOG_FILE"; then
        
        log "INFO" "✅ Base de datos restaurada exitosamente"
        unset PGPASSWORD
        return 0
    else
        log "ERROR" "❌ Fallo al restaurar base de datos"
        unset PGPASSWORD
        return 1
    fi
}

# Post-restauración
post_restore_checks() {
    log "INFO" "🔍 Ejecutando verificaciones post-restauración..."
    
    # Verificar conexión a la base de datos
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Verificar tablas principales
    local tables_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ "$tables_count" -gt 0 ]; then
        log "INFO" "✅ Base de datos contiene $tables_count tablas"
    else
        log "ERROR" "❌ Base de datos no contiene tablas"
        unset PGPASSWORD
        return 1
    fi
    
    # Verificar usuarios
    local users_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    
    if [ "$users_count" -gt 0 ]; then
        log "INFO" "✅ Base de datos contiene $users_count usuarios"
    else
        log "WARNING" "⚠️  Base de datos no contiene usuarios"
    fi
    
    unset PGPASSWORD
    log "INFO" "✅ Verificaciones post-restauración completadas"
    return 0
}

# Enviar notificación
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$WEBHOOK_URL" ]; then
        local color="good"
        if [ "$status" = "error" ]; then
            color="danger"
        elif [ "$status" = "warning" ]; then
            color="warning"
        fi
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Restore Database - $status\",
                    \"text\": \"$message\",
                    \"fields\": [{
                        \"title\": \"Fecha\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }, {
                        \"title\": \"Operador\",
                        \"value\": \"$(whoami)\",
                        \"short\": true
                    }],
                    \"footer\": \"Puente de Zardain Restore System\",
                    \"ts\": $(date +%s)
                }]
            }" 2>/dev/null || log "WARNING" "No se pudo enviar notificación"
    fi
}

# Función principal
main() {
    # Parsear argumentos
    FORCE_RESTORE=false
    DOWNLOAD_FROM_S3=false
    VERBOSE=false
    LIST_BACKUPS=false
    BACKUP_FILE=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -f|--force)
                FORCE_RESTORE=true
                shift
                ;;
            -d|--download)
                DOWNLOAD_FROM_S3=true
                shift
                ;;
            -l|--list)
                LIST_BACKUPS=true
                shift
                ;;
            -v|--verbose)
                export RESTORE_DEBUG=true
                shift
                ;;
            -*)
                log "ERROR" "Opción desconocida: $1"
                show_help
                exit 1
                ;;
            *)
                BACKUP_FILE="$1"
                shift
                ;;
        esac
    done
    
    # Crear directorios necesarios
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$TEMP_DIR"
    
    # Listar backups si se solicita
    if [ "$LIST_BACKUPS" = true ]; then
        check_dependencies
        list_backups
        exit 0
    fi
    
    # Verificar que se proporcionó archivo de backup
    if [ -z "$BACKUP_FILE" ]; then
        log "ERROR" "❌ Debe especificar un archivo de backup"
        show_help
        exit 1
    fi
    
    log "INFO" "🚀 Iniciando proceso de restauración"
    log "INFO" "Backup: $BACKUP_FILE"
    log "INFO" "Force: $FORCE_RESTORE"
    
    # Verificar dependencias
    check_dependencies
    
    # Determinar ruta completa del backup
    local full_backup_path="${BACKUP_DIR}/${BACKUP_FILE}"
    
    # Descargar desde S3 si no existe localmente y se solicita
    if [ ! -f "$full_backup_path" ] && [ "$DOWNLOAD_FROM_S3" = true ]; then
        if ! download_from_s3 "$BACKUP_FILE"; then
            exit 1
        fi
    fi
    
    # Validar backup
    if ! validate_backup "$full_backup_path"; then
        exit 1
    fi
    
    # Confirmación de restauración
    if [ "$FORCE_RESTORE" = false ]; then
        echo -e "\n${YELLOW}⚠️  ADVERTENCIA: Esta acción sobreescribirá la base de datos actual${NC}"
        echo -e "${YELLOW}¿Está seguro que desea continuar? (s/N):${NC}"
        read -r confirmation
        
        if [[ ! "$confirmation" =~ ^[Ss]$ ]]; then
            log "INFO" "❌ Restauración cancelada por el usuario"
            exit 0
        fi
    fi
    
    # Preparar archivo para restauración
    local restore_file="$full_backup_path"
    
    if [[ "$BACKUP_FILE" == *.enc ]]; then
        restore_file=$(decrypt_backup "$BACKUP_FILE")
        if [ $? -ne 0 ]; then
            exit 1
        fi
        restore_file="${TEMP_DIR}/${restore_file}"
    fi
    
    # Ejecutar restauración
    if pre_restore_backup && restore_database "$restore_file"; then
        if post_restore_checks; then
            log "INFO" "🎉 Proceso de restauración completado exitosamente"
            send_notification "success" "Base de datos restaurada exitosamente desde: $BACKUP_FILE"
            
            # Limpiar directorio temporal
            rm -rf "$TEMP_DIR"
            
            exit 0
        else
            log "ERROR" "❌ Verificaciones post-restauración fallaron"
            send_notification "error" "Verificaciones post-restauración fallaron"
            exit 1
        fi
    else
        log "ERROR" "❌ Proceso de restauración falló"
        send_notification "error" "Proceso de restauración falló"
        exit 1
    fi
}

# Manejo de errores
trap 'log "ERROR" "❌ Script interrumpido inesperadamente"; send_notification "error" "Script de restauración interrumpido"; exit 2' ERR
trap 'log "WARNING" "⚠️  Script detenido por señal"; exit 130' INT TERM

# Ejecutar función principal
main "$@"

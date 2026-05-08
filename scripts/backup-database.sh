#!/bin/bash

# ===========================================
# SCRIPT DE BACKUP AUTOMÁTICO
# PUENTE DE ZARDAIN
# ===========================================

set -e  # Detener script si hay error

# Variables de configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/logs/backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="puente_zardain_backup_${TIMESTAMP}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

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
            if [ "${BACKUP_DEBUG:-false}" = "true" ]; then
                echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message" | tee -a "$LOG_FILE"
            fi
            ;;
    esac
}

# Verificar dependencias
check_dependencies() {
    log "INFO" "Verificando dependencias..."
    
    local missing_deps=()
    
    if ! command -v pg_dump &> /dev/null; then
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

# Crear directorios necesarios
setup_directories() {
    log "INFO" "Creando directorios necesarios..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Asegurar permisos correctos
    chmod 755 "$BACKUP_DIR"
    chmod 644 "$LOG_FILE" 2>/dev/null || true
    
    log "INFO" "✅ Directorios creados correctamente"
}

# Validar variables de entorno
validate_environment() {
    log "INFO" "Validando variables de entorno..."
    
    if [ -z "$DATABASE_URL" ]; then
        log "ERROR" "DATABASE_URL no está configurada"
        exit 1
    fi
    
    if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
        log "WARNING" "BACKUP_ENCRYPTION_KEY no está configurada. Los backups no estarán encriptados."
        ENCRYPT_BACKUP=false
    else
        ENCRYPT_BACKUP=true
    fi
    
    # Configuración de retención por defecto
    BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
    
    log "INFO" "✅ Variables de entorno validadas"
}

# Crear backup de la base de datos
create_backup() {
    log "INFO" "📦 Creando backup de la base de datos..."
    
    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"
    
    # Extraer información de conexión de DATABASE_URL
    # Formato: postgresql://user:password@host:port/database
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
    
    # Setear variable de contraseña para pg_dump
    export PGPASSWORD="$DB_PASSWORD"
    
    # Crear backup
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --no-password \
        --verbose \
        --format=custom \
        --compress=9 \
        --exclude-table-data='sessions' \
        --exclude-table-data='notifications' \
        --file="$backup_path" 2>&1 | tee -a "$LOG_FILE"; then
        
        log "INFO" "✅ Backup creado exitosamente: $backup_path"
        
        # Verificar tamaño del backup
        local backup_size=$(du -h "$backup_path" | cut -f1)
        log "INFO" "📊 Tamaño del backup: $backup_size"
        
    else
        log "ERROR" "❌ Fallo al crear backup"
        exit 1
    fi
    
    # Limpiar variable de contraseña
    unset PGPASSWORD
}

# Encriptar backup si está configurado
encrypt_backup() {
    if [ "$ENCRYPT_BACKUP" = true ]; then
        log "INFO" "🔐 Encriptando backup..."
        
        local encrypted_path="${BACKUP_DIR}/${ENCRYPTED_FILE}"
        
        if echo "$BACKUP_ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 \
            --symmetric --cipher-algo AES256 \
            --output "$encrypted_path" "${BACKUP_DIR}/${BACKUP_FILE}" 2>&1 | tee -a "$LOG_FILE"; then
            
            # Eliminar archivo sin encriptar
            rm "${BACKUP_DIR}/${BACKUP_FILE}"
            
            log "INFO" "✅ Backup encriptado exitosamente"
            BACKUP_FILE="$ENCRYPTED_FILE"
            
        else
            log "ERROR" "❌ Fallo al encriptar backup"
            exit 1
        fi
    else
        log "WARNING" "⚠️  Backup sin encriptar (BACKUP_ENCRYPTION_KEY no configurada)"
    fi
}

# Subir backup a almacenamiento en la nube
upload_to_cloud() {
    if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
        log "INFO" "☁️  Subiendo backup a AWS S3..."
        
        local s3_key="backups/database/$(date +%Y)/$(date +%m)/$BACKUP_FILE"
        
        if aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/${s3_key}" \
            --storage-class STANDARD_IA \
            --metadata "backup-date=$(date -Iseconds),environment=production" 2>&1 | tee -a "$LOG_FILE"; then
            
            log "INFO" "✅ Backup subido a S3: s3://${AWS_S3_BUCKET}/${s3_key}"
            
            # Verificar integridad
            local local_size=$(stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}")
            local s3_size=$(aws s3 ls "s3://${AWS_S3_BUCKET}/${s3_key}" --summarize --human-readable | grep "Total Size" | awk '{print $3}')
            
            if [ "$local_size" -gt 0 ]; then
                log "INFO" "✅ Verificación de integridad S3 exitosa"
            else
                log "WARNING" "⚠️  No se pudo verificar integridad del backup en S3"
            fi
            
        else
            log "ERROR" "❌ Fallo al subir backup a S3"
            exit 1
        fi
    else
        log "INFO" "ℹ️  AWS S3 no configurado. Backup mantenido localmente."
    fi
}

# Limpiar backups antiguos
cleanup_old_backups() {
    log "INFO" "🧹 Limpiando backups antiguos..."
    
    local deleted_count=0
    
    # Limpiar backups locales
    find "$BACKUP_DIR" -name "*.sql*" -mtime +$BACKUP_RETENTION_DAYS -type f | while read -r file; do
        log "INFO" "Eliminando backup antiguo: $(basename "$file")"
        rm "$file"
        ((deleted_count++))
    done
    
    # Limpiar backups de S3
    if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" -Iseconds)
        
        aws s3 ls "s3://${AWS_S3_BUCKET}/backups/database/" --recursive | while read -r line; do
            local file_date=$(echo "$line" | awk '{print $1" "$2}')
            local file_path=$(echo "$line" | awk '{print $4}')
            
            if [[ "$file_date" < "$cutoff_date" ]]; then
                log "INFO" "Eliminando backup antiguo de S3: $file_path"
                aws s3 rm "s3://${AWS_S3_BUCKET}/${file_path}"
                ((deleted_count++))
            fi
        done
    fi
    
    log "INFO" "✅ Limpieza completada. $deleted_count archivos eliminados."
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
                    \"title\": \"Backup Database - $status\",
                    \"text\": \"$message\",
                    \"fields\": [{
                        \"title\": \"Fecha\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }, {
                        \"title\": \"Archivo\",
                        \"value\": \"$BACKUP_FILE\",
                        \"short\": true
                    }],
                    \"footer\": \"Puente de Zardain Backup System\",
                    \"ts\": $(date +%s)
                }]
            }" 2>/dev/null || log "WARNING" "No se pudo enviar notificación"
    fi
}

# Verificar integridad del backup
verify_backup() {
    log "INFO" "🔍 Verificando integridad del backup..."
    
    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"
    
    if [ ! -f "$backup_path" ]; then
        log "ERROR" "❌ Archivo de backup no encontrado: $backup_path"
        return 1
    fi
    
    # Verificar tamaño mínimo
    local min_size=1024  # 1KB mínimo
    local actual_size=$(stat -c%s "$backup_path")
    
    if [ "$actual_size" -lt "$min_size" ]; then
        log "ERROR" "❌ Backup demasiado pequeño: ${actual_size} bytes"
        return 1
    fi
    
    # Si está encriptado, verificar formato GPG
    if [[ "$BACKUP_FILE" == *.enc ]]; then
        if ! gpg --list-packets "$backup_path" >/dev/null 2>&1; then
            log "ERROR" "❌ Backup encriptado corrupto"
            return 1
        fi
    fi
    
    log "INFO" "✅ Integridad del backup verificada"
    return 0
}

# Función principal
main() {
    log "INFO" "🚀 Iniciando proceso de backup automático"
    log "INFO" "Entorno: ${NODE_ENV:-development}"
    log "INFO" "Directorio de backups: $BACKUP_DIR"
    
    # Ejecutar pasos del backup
    check_dependencies
    setup_directories
    validate_environment
    create_backup
    
    if verify_backup; then
        encrypt_backup
        upload_to_cloud
        cleanup_old_backups
        
        log "INFO" "🎉 Proceso de backup completado exitosamente"
        send_notification "success" "Backup completado exitosamente. Archivo: $BACKUP_FILE"
        
        exit 0
    else
        log "ERROR" "❌ Verificación de backup falló"
        send_notification "error" "Verificación de backup falló. Revisar logs."
        
        exit 1
    fi
}

# Manejo de errores
trap 'log "ERROR" "❌ Script interrumpido inesperadamente"; send_notification "error" "Script de backup interrumpido"; exit 2' ERR
trap 'log "WARNING" "⚠️  Script detenido por señal"; exit 130' INT TERM

# Ejecutar función principal
main "$@"

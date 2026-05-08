#!/bin/bash

# ===========================================
# SCRIPT DE DESPLIEGUE PRODUCCIÓN
# PUENTE DE ZARDAIN
# ===========================================

set -e  # Detener script si hay error

echo "🚀 Iniciando despliegue a producción..."

# Variables de entorno
ENVIRONMENT="production"
BACKUP_DIR="/backups/puente-zardain"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "No se encuentra package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# 1. Backup de la base de datos
log_info "📦 Creando backup de la base de datos..."
mkdir -p $BACKUP_DIR

if command -v pg_dump &> /dev/null; then
    pg_dump $DATABASE_URL > "${BACKUP_DIR}/${BACKUP_FILE}"
    log_info "✅ Backup guardado en: ${BACKUP_DIR}/${BACKUP_FILE}"
else
    log_warning "⚠️  pg_dump no encontrado. Saltando backup de base de datos."
fi

# 2. Verificar variables de entorno críticas
log_info "🔍 Verificando variables de entorno críticas..."
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "STRIPE_SECRET_KEY" "FRONTEND_URL" "BACKEND_URL")

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "❌ Variable de entorno requerida no configurada: $var"
        exit 1
    fi
done

log_info "✅ Todas las variables de entorno críticas están configuradas"

# 3. Instalar dependencias
log_info "📥 Instalando dependencias de producción..."
npm ci --production

# 4. Ejecutar tests
log_info "🧪 Ejecutando tests de producción..."
npm run test:e2e || {
    log_error "❌ Los tests E2E fallaron. Abortando despliegue."
    exit 1
}

# 5. Build del frontend
log_info "🏗️  Build del frontend..."
cd frontend
npm ci --production
npm run build
log_info "✅ Frontend build completado"

# 6. Build del backend
log_info "🏗️  Build del backend..."
cd ../backend
npm ci --production
npm run build
log_info "✅ Backend build completado"

# 7. Migraciones de base de datos
log_info "🗄️  Ejecutando migraciones de base de datos..."
npm run prisma:migrate:deploy

# 8. Reiniciar servicios
log_info "🔄 Reiniciando servicios..."

# Usando systemd (ajustar según tu sistema)
sudo systemctl restart nginx
sudo systemctl restart puente-zardain-backend
sudo systemctl restart puente-zardain-frontend

# Verificar que los servicios están corriendo
sleep 10

if systemctl is-active --quiet puente-zardain-backend; then
    log_info "✅ Backend está corriendo correctamente"
else
    log_error "❌ Backend no está corriendo"
    exit 1
fi

if systemctl is-active --quiet nginx; then
    log_info "✅ Nginx está corriendo correctamente"
else
    log_error "❌ Nginx no está corriendo"
    exit 1
fi

# 9. Verificación de salud
log_info "🏥 Verificando salud del sistema..."
HEALTH_CHECK_URL="${BACKEND_URL}/health"

if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
    log_info "✅ Health check passed"
else
    log_error "❌ Health check failed"
    exit 1
fi

# 10. Limpieza de backups antiguos
log_info "🧹 Limpiando backups antiguos..."
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
log_info "✅ Limpieza de backups completada"

# 11. Notificación de despliegue
log_info "📧 Enviando notificación de despliegue..."
curl -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{
        \"text\": \"🚀 Despliegue a producción completado exitosamente\\nTimestamp: $(date)\\nBackup: ${BACKUP_FILE}\"
    }" || log_warning "⚠️  No se pudo enviar notificación"

log_info "🎉 Despliegue a producción completado exitosamente!"
log_info "📊 Dashboard: $FRONTEND_URL"
log_info "🔗 API: $BACKEND_URL"

# 12. Post-deployment checks
log_info "🔍 Ejecutando verificaciones post-despliegue..."

# Verificar que el frontend sirve correctamente
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    log_info "✅ Frontend accesible"
else
    log_error "❌ Frontend no accesible"
    exit 1
fi

# Verificar endpoints críticos
CRITICAL_ENDPOINTS=(
    "/auth/login"
    "/products"
    "/orders"
    "/payments/create-intent"
)

for endpoint in "${CRITICAL_ENDPOINTS[@]}"; do
    if curl -f -s "${BACKEND_URL}${endpoint}" > /dev/null; then
        log_info "✅ Endpoint $endpoint responde"
    else
        log_warning "⚠️  Endpoint $endpoint no responde (puede requerir autenticación)"
    fi
done

log_info "🎯 Despliegue finalizado. Sistema listo para producción."

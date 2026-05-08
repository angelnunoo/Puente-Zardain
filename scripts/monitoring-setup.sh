#!/bin/bash

# ===========================================
# SCRIPT DE CONFIGURACIÓN DE MONITORIZACIÓN
# PUENTE DE ZARDAIN
# ===========================================

set -e  # Detener script si hay error

# Variables de configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/monitoring-setup.log"

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
            if [ "${MONITORING_DEBUG:-false}" = "true" ]; then
                echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message" | tee -a "$LOG_FILE"
            fi
            ;;
    esac
}

# Verificar dependencias
check_dependencies() {
    log "INFO" "Verificando dependencias de monitorización..."
    
    local missing_deps=()
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if ! command -v pm2 &> /dev/null; then
        missing_deps+=("pm2")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log "ERROR" "Dependencias faltantes: ${missing_deps[*]}"
        log "ERROR" "Instalar con: sudo apt-get install ${missing_deps[*]}"
        exit 1
    fi
    
    log "INFO" "✅ Todas las dependencias están instaladas"
}

# Configurar PM2 para monitorización
setup_pm2() {
    log "INFO" "🔧 Configurando PM2 para monitorización..."
    
    # Crear archivo de configuración PM2
    cat > "${PROJECT_ROOT}/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'puente-zardain-backend',
      script: './dist/main.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'puente-zardain-frontend',
      script: 'npm start',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      watch: false,
      restart_delay: 4000
    }
  ],
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:username/puente-zardain.git',
      path: '/var/www/puente-zardain',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
EOF

    log "INFO" "✅ Configuración PM2 creada"
}

# Configurar logs centralizados
setup_logging() {
    log "INFO" "📝 Configurando logs centralizados..."
    
    # Crear directorios de logs
    mkdir -p "${PROJECT_ROOT}/logs"
    mkdir -p "${PROJECT_ROOT}/logs/archived"
    mkdir -p "${PROJECT_ROOT}/logs/errors"
    mkdir -p "${PROJECT_ROOT}/logs/performance"
    
    # Configurar rotación de logs con logrotate
    sudo tee /etc/logrotate.d/puente-zardain > /dev/null << 'EOF'
${PROJECT_ROOT}/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

    # Crear script de monitorización de logs
    cat > "${PROJECT_ROOT}/scripts/monitor-logs.sh" << 'EOF'
#!/bin/bash

LOG_DIR="${PROJECT_ROOT}/logs"
ALERT_THRESHOLD=100  # Número de errores por hora
ERROR_LOG="${LOG_DIR}/errors/error.log"

# Contar errores en la última hora
error_count() {
    local one_hour_ago=$(date -d '1 hour ago' --iso-8601)
    if [ -f "$ERROR_LOG" ]; then
        grep -c "\[ERROR\]" "$ERROR_LOG" | while read count; do
            echo "$count"
        done
    else
        echo "0"
    fi
}

# Monitorizar tamaño de logs
log_size() {
    du -sh "$LOG_DIR" | cut -f1
}

# Enviar alerta si hay muchos errores
if [ "\$(error_count)" -gt "$ALERT_THRESHOLD" ]; then
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"🚨 ALTA TASA DE ERRORES\\nErrores en la última hora: \$(error_count)\\nUmbral: $ALERT_THRESHOLD\"
        }"
fi
EOF

    chmod +x "${PROJECT_ROOT}/scripts/monitor-logs.sh"
    log "INFO" "✅ Sistema de logs configurado"
}

# Configurar monitorización de salud
setup_health_monitoring() {
    log "INFO" "🏥 Configurando monitorización de salud..."
    
    # Crear script de health check
    cat > "${PROJECT_ROOT}/scripts/health-check.sh" << 'EOF'
#!/bin/bash

HEALTH_URL="${BACKEND_URL:-http://localhost:3001}/health"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
WEBHOOK_URL="$WEBHOOK_URL"
LOG_FILE="${PROJECT_ROOT}/logs/health-check.log"

check_service() {
    local url=\$1
    local service_name=\$2
    
    if curl -f -s --max-time 10 "\$url" > /dev/null; then
        echo "\$(date '+%Y-%m-%d %H:%M:%S') [INFO] \$service_name: OK" >> "\$LOG_FILE"
        return 0
    else
        echo "\$(date '+%Y-%m-%d %H:%M:%S') [ERROR] \$service_name: FAILED" >> "\$LOG_FILE"
        
        # Enviar alerta
        if [ -n "\$WEBHOOK_URL" ]; then
            curl -X POST "\$WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d "{
                    \"text\": \"🚨 SERVICIO CAÍDO\\nServicio: \$service_name\\nURL: \$url\\nHora: \$(date)\"
                }"
        fi
        return 1
    fi
}

# Verificar backend
check_service "\$HEALTH_URL" "Backend API"

# Verificar frontend
check_service "\$FRONTEND_URL" "Frontend"

# Verificar base de datos
if [[ \$DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    DB_HOST="\${BASH_REMATCH[3]}"
    DB_PORT="\${BASH_REMATCH[4]}"
    
    if nc -z -w3 "\$DB_HOST" "\$DB_PORT"; then
        echo "\$(date '+%Y-%m-%d %H:%M:%S') [INFO] Database: OK" >> "\$LOG_FILE"
    else
        echo "\$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Database: FAILED" >> "\$LOG_FILE"
        
        if [ -n "\$WEBHOOK_URL" ]; then
            curl -X POST "\$WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d "{
                    \"text\": \"🚨 BASE DE DATOS CAÍDA\\nHost: \$DB_HOST:\$DB_PORT\\nHora: \$(date)\"
                }"
        fi
    fi
fi
EOF

    chmod +x "${PROJECT_ROOT}/scripts/health-check.sh"
    log "INFO" "✅ Health check configurado"
}

# Configurar monitorización de rendimiento
setup_performance_monitoring() {
    log "INFO" "📊 Configurando monitorización de rendimiento..."
    
    # Crear script de monitorización de rendimiento
    cat > "${PROJECT_ROOT}/scripts/performance-monitor.sh" << 'EOF'
#!/bin/bash

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
METRICS_URL="\${BACKEND_URL}/health/metrics"
LOG_FILE="${PROJECT_ROOT}/logs/performance.log"

# Obtener métricas
get_metrics() {
    local response=\$(curl -s "\$METRICS_URL" 2>/dev/null)
    
    if [ \$? -eq 0 ]; then
        echo "\$(date '+%Y-%m-%d %H:%M:%S') [METRICS] \$response" >> "\$LOG_FILE"
        
        # Analizar métricas críticas
        local memory_usage=\$(echo "\$response" | jq -r '.memory.heapUsed' 2>/dev/null)
        local cpu_usage=\$(echo "\$response" | jq -r '.cpu.user' 2>/dev/null)
        local active_connections=\$(echo "\$response" | jq -r '.activeConnections' 2>/dev/null)
        
        # Alertas de rendimiento
        if [ "\$memory_usage" -gt 800 ]; then
            send_alert "ALTO USO DE MEMORIA" "Uso de memoria: \$memory_usage MB"
        fi
        
        if [ "\$active_connections" -gt 100 ]; then
            send_alert "MUCHAS CONEXIONES ACTIVAS" "Conexiones activas: \$active_connections"
        fi
        
    else
        echo "\$(date '+%Y-%m-%d %H:%M:%S') [ERROR] No se pudieron obtener métricas" >> "\$LOG_FILE"
    fi
}

# Enviar alerta
send_alert() {
    local title=\$1
    local message=\$2
    
    if [ -n "\$WEBHOOK_URL" ]; then
        curl -X POST "\$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"⚠️ ALERTA DE RENDIMIENTO\\n\$title\\n\$message\\nHora: \$(date)\"
            }"
    fi
}

get_metrics
EOF

    chmod +x "${PROJECT_ROOT}/scripts/performance-monitor.sh"
    log "INFO" "✅ Monitorización de rendimiento configurada"
}

# Configurar cron jobs
setup_cron_jobs() {
    log "INFO" "⏰ Configurando cron jobs de monitorización..."
    
    # Crear archivo temporal de cron
    local temp_cron="/tmp/puente-zardain-monitoring.cron"
    
    cat > "$temp_cron" << EOF
# Monitorización de Puente de Zardain
# Health check cada 5 minutos
*/5 * * * * cd $PROJECT_ROOT && ./scripts/health-check.sh

# Monitorización de logs cada 10 minutos
*/10 * * * * cd $PROJECT_ROOT && ./scripts/monitor-logs.sh

# Monitorización de rendimiento cada 15 minutos
*/15 * * * * cd $PROJECT_ROOT && ./scripts/performance-monitor.sh

# Backup diario a las 2 AM
0 2 * * * cd $PROJECT_ROOT && ./scripts/backup-database.sh

# Limpieza de logs dominical a las 3 AM
0 3 * * 0 cd $PROJECT_ROOT && find logs/ -name "*.log" -mtime +7 -exec gzip {} \;

# Verificación de espacio en disco cada hora
0 * * * * df -h | grep -E "(/$|/var)" | awk '{print \$5}' | sed 's/%//' | while read usage; do
    if [ "\$usage" -gt 80 ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"⚠️ ESPACIO EN DISCO BAJO\\nUso: \$usage%\\nHora: \$(date)\"
            }"
    fi
done
EOF

    # Instalar cron jobs
    crontab "$temp_cron" 2>/dev/null || {
        log "ERROR" "No se pudieron instalar los cron jobs"
        rm "$temp_cron"
        exit 1
    }
    
    rm "$temp_cron"
    log "INFO" "✅ Cron jobs configurados"
}

# Configurar alertas por email
setup_email_alerts() {
    log "INFO" "📧 Configurando alertas por email..."
    
    if [ -n "$ALERT_EMAIL" ]; then
        # Crear script de envío de alertas
        cat > "${PROJECT_ROOT}/scripts/send-alert.sh" << 'EOF'
#!/bin/bash

ALERT_EMAIL="$ALERT_EMAIL"
SMTP_SERVER="$SMTP_SERVER"
SMTP_PORT="$SMTP_PORT"
SMTP_USER="$SMTP_USER"
SMTP_PASS="$SMTP_PASS"

send_email() {
    local subject=\$1
    local body=\$2
    
    echo -e "Subject: \$subject\n\n\$body" | \
        curl -s --mail-rcpt "\$ALERT_EMAIL" \
        --mail-from "noreply@puente-zardain.es" \
        --url "smtp://\$SMTP_SERVER:\$SMTP_PORT" \
        --user "\$SMTP_USER:\$SMTP_PASS" \
        --mail-rcpt "\$ALERT_EMAIL" \
        -T -
}

# Uso: send-alert.sh "Asunto" "Cuerpo del mensaje"
send_email "\$1" "\$2"
EOF

        chmod +x "${PROJECT_ROOT}/scripts/send-alert.sh"
        log "INFO" "✅ Alertas por email configuradas"
    else
        log "WARNING" "ALERT_EMAIL no configurada. Saltando configuración de email."
    fi
}

# Configurar dashboard de monitorización
setup_monitoring_dashboard() {
    log "INFO" "📊 Configurando dashboard de monitorización..."
    
    # Crear página simple de dashboard
    cat > "${PROJECT_ROOT}/monitoring-dashboard.html" << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard de Monitorización - Puente de Zardain</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-title { font-size: 14px; color: #666; margin-bottom: 10px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-status { font-size: 12px; margin-top: 5px; }
        .status-ok { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-error { color: #e74c3c; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Dashboard de Monitorización</h1>
            <p>Estado del sistema Puente de Zardain - Última actualización: <span id="lastUpdate"></span></p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Estado del Backend</div>
                <div class="metric-value" id="backendStatus">Cargando...</div>
                <div class="metric-status" id="backendStatusDetail"></div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Estado del Frontend</div>
                <div class="metric-value" id="frontendStatus">Cargando...</div>
                <div class="metric-status" id="frontendStatusDetail"></div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Uso de Memoria</div>
                <div class="metric-value" id="memoryUsage">Cargando...</div>
                <div class="metric-status" id="memoryStatus"></div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Conexiones Activas</div>
                <div class="metric-value" id="activeConnections">Cargando...</div>
                <div class="metric-status" id="connectionsStatus"></div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>📈 Rendimiento (Última hora)</h3>
            <canvas id="performanceChart" width="400" height="200"></canvas>
        </div>
    </div>

    <script>
        async function updateMetrics() {
            try {
                const response = await fetch('${BACKEND_URL}/health/metrics');
                const data = await response.json();
                
                // Actualizar métricas
                updateStatus('backend', data.services.database.status === 'ok');
                updateStatus('frontend', true); // Asumir que el frontend está OK si podemos cargar esta página
                
                document.getElementById('memoryUsage').textContent = data.memory.heapUsed;
                document.getElementById('activeConnections').textContent = data.activeConnections;
                
                // Actualizar timestamp
                document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
                
                // Actualizar gráfico
                updateChart(data);
                
            } catch (error) {
                console.error('Error al obtener métricas:', error);
                updateStatus('backend', false);
            }
        }
        
        function updateStatus(service, isOk) {
            const statusElement = document.getElementById(service + 'Status');
            const detailElement = document.getElementById(service + 'StatusDetail');
            
            if (isOk) {
                statusElement.textContent = '✅ OK';
                statusElement.className = 'metric-status status-ok';
                detailElement.textContent = 'Funcionando correctamente';
            } else {
                statusElement.textContent = '❌ ERROR';
                statusElement.className = 'metric-status status-error';
                detailElement.textContent = 'Servicio no disponible';
            }
        }
        
        function updateChart(data) {
            // Implementar gráfico de rendimiento
            const ctx = document.getElementById('performanceChart').getContext('2d');
            // ... implementación del gráfico
        }
        
        // Actualizar cada 30 segundos
        updateMetrics();
        setInterval(updateMetrics, 30000);
    </script>
</body>
</html>
EOF

        log "INFO" "✅ Dashboard de monitorización creado en: ${PROJECT_ROOT}/monitoring-dashboard.html"
    fi
}

# Función principal
main() {
    log "INFO" "🚀 Iniciando configuración de monitorización..."
    
    # Crear directorios necesarios
    mkdir -p "${PROJECT_ROOT}/logs"
    mkdir -p "${PROJECT_ROOT}/scripts"
    
    # Ejecutar configuraciones
    check_dependencies
    setup_pm2
    setup_logging
    setup_health_monitoring
    setup_performance_monitoring
    setup_cron_jobs
    setup_email_alerts
    setup_monitoring_dashboard
    
    log "INFO" "🎉 Configuración de monitorización completada"
    log "INFO" "📊 Dashboard disponible en: ${PROJECT_ROOT}/monitoring-dashboard.html"
    log "INFO" "📝 Logs en: ${PROJECT_ROOT}/logs/"
    log "INFO" "⏰ Cron jobs configurados y activos"
}

# Manejo de errores
trap 'log "ERROR" "❌ Script interrumpido inesperadamente"; exit 2' ERR
trap 'log "WARNING" "⚠️  Script detenido por señal"; exit 130' INT TERM

# Ejecutar función principal
main "$@"

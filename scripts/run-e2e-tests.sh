#!/bin/bash

# ===========================================
# SCRIPT DE EJECUCIÓN DE TESTS E2E
# PUENTE DE ZARDAIN
# ===========================================

set -e  # Detener script si hay error

# Variables de configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_RESULTS_DIR="${PROJECT_ROOT}/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="${TEST_RESULTS_DIR}/e2e-report-${TIMESTAMP}"

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
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
        "DEBUG")
            if [ "${E2E_DEBUG:-false}" = "true" ]; then
                echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message"
            fi
            ;;
    esac
}

# Verificar dependencias
check_dependencies() {
    log "INFO" "Verificando dependencias de E2E..."
    
    local missing_deps=()
    
    # Verificar Node.js y npm
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # Verificar Playwright
    if ! npm list playwright &> /dev/null; then
        missing_deps+=("playwright")
    fi
    
    # Verificar variables de entorno
    if [ -z "$PROD_URL" ]; then
        log "WARNING" "PROD_URL no configurada, usando valor por defecto"
        export PROD_URL="https://puente-zardain.es"
    fi
    
    if [ -z "$API_URL" ]; then
        log "WARNING" "API_URL no configurada, usando valor por defecto"
        export API_URL="https://api.puente-zardain.es"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log "ERROR" "Dependencias faltantes: ${missing_deps[*]}"
        log "ERROR" "Instalar con: npm install ${missing_deps[*]}"
        exit 1
    fi
    
    log "INFO" "✅ Todas las dependencias están instaladas"
}

# Instalar dependencias de testing
install_test_dependencies() {
    log "INFO" "📥 Instalando dependencias de testing..."
    
    cd "$PROJECT_ROOT"
    
    # Instalar Playwright browsers
    npx playwright install chromium
    
    # Verificar instalación
    if ! npx playwright --version &> /dev/null; then
        log "ERROR" "❌ Fallo al instalar Playwright"
        exit 1
    fi
    
    log "INFO" "✅ Dependencias de testing instaladas"
}

# Preparar entorno de testing
setup_test_environment() {
    log "INFO" "🔧 Preparando entorno de testing..."
    
    # Crear directorios necesarios
    mkdir -p "$TEST_RESULTS_DIR"
    mkdir -p "$REPORT_DIR"
    mkdir -p "$TEST_RESULTS_DIR/screenshots"
    mkdir -p "$TEST_RESULTS_DIR/videos"
    mkdir -p "$TEST_RESULTS_DIR/traces"
    
    # Limpiar resultados anteriores
    find "$TEST_RESULTS_DIR" -name "e2e-report-*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
    
    # Setear variables de entorno para testing
    export NODE_ENV="test"
    export CI="true"
    export E2E_TEST_RESULTS_DIR="$REPORT_DIR"
    
    log "INFO" "✅ Entorno de testing preparado"
}

# Ejecutar tests E2E
run_e2e_tests() {
    log "INFO" "🧪 Ejecutando tests E2E contra producción..."
    
    cd "$PROJECT_ROOT"
    
    # Ejecutar tests de Playwright
    local test_command="npx playwright test tests/e2e/production.e2e.test.ts \
        --config=playwright.config.ts \
        --reporter=html,html,allure \
        --reporter-output=$REPORT_DIR \
        --output-dir=$REPORT_DIR \
        --screenshot=only-on-failure \
        --video=retain-on-failure \
        --trace=retain-on-failure \
        --timeout=30000 \
        --retries=2 \
        --workers=1"
    
    if [ "$E2E_DEBUG" = "true" ]; then
        test_command="$test_command --debug"
    fi
    
    log "INFO" "Ejecutando: $test_command"
    
    # Ejecutar tests y capturar resultado
    if eval "$test_command"; then
        log "INFO" "✅ Tests E2E completados exitosamente"
        local test_result="SUCCESS"
    else
        log "ERROR" "❌ Tests E2E fallaron"
        local test_result="FAILED"
        
        # Capturar logs de error
        log "ERROR" "Revisando logs de error..."
        find "$REPORT_DIR" -name "*.log" -exec tail -20 {} \; 2>/dev/null || true
    fi
    
    echo "$test_result" > "${TEST_RESULTS_DIR}/e2e-test-result-${TIMESTAMP}.txt"
    return $([ "$test_result" = "SUCCESS" ] && echo 0 || echo 1)
}

# Generar reporte de resultados
generate_test_report() {
    log "INFO" "📊 Generando reporte de resultados..."
    
    local report_file="${REPORT_DIR}/test-summary-${TIMESTAMP}.json"
    
    # Extraer resultados del reporte HTML de Playwright
    if [ -f "${REPORT_DIR}/index.html" ]; then
        # Analizar resultados del reporte
        local total_tests=$(grep -o '"total":[0-9]*' "${REPORT_DIR}/results.json" | cut -d':' -f2 || echo "0")
        local passed_tests=$(grep -o '"passed":[0-9]*' "${REPORT_DIR}/results.json" | cut -d':' -f2 || echo "0")
        local failed_tests=$(grep -o '"failed":[0-9]*' "${REPORT_DIR}/results.json" | cut -d':' -f2 || echo "0")
        local skipped_tests=$(grep -o '"skipped":[0-9]*' "${REPORT_DIR}/results.json" | cut -d':' -f2 || echo "0")
        
        # Crear reporte resumido
        cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "production",
  "testSuite": "E2E Production Tests",
  "results": {
    "total": $total_tests,
    "passed": $passed_tests,
    "failed": $failed_tests,
    "skipped": $skipped_tests,
    "success": $([ $failed_tests -eq 0 ] && echo "true" || echo "false"),
    "passRate": $(echo "scale=2; $passed_tests / $total_tests * 100" | bc 2>/dev/null || echo "0")
  },
  "duration": "$(date +%s)",
  "reportDirectory": "$REPORT_DIR",
  "screenshots": {
    "directory": "$TEST_RESULTS_DIR/screenshots",
    "files": $(find "$TEST_RESULTS_DIR/screenshots" -name "*.png" | wc -l)
  },
  "videos": {
    "directory": "$TEST_RESULTS_DIR/videos",
    "files": $(find "$TEST_RESULTS_DIR/videos" -name "*.webm" | wc -l)
  },
  "traces": {
    "directory": "$TEST_RESULTS_DIR/traces",
    "files": $(find "$TEST_RESULTS_DIR/traces" -name "*.zip" | wc -l)
  }
}
EOF
        
        log "INFO" "✅ Reporte generado: $report_file"
        
        # Mostrar resumen en consola
        echo -e "\n${BLUE}=== RESUMEN DE TESTS E2E ===${NC}"
        echo -e "Total: $total_tests"
        echo -e "Exitosos: ${GREEN}$passed_tests${NC}"
        echo -e "Fallidos: ${RED}$failed_tests${NC}"
        echo -e "Omitidos: $skipped_tests"
        echo -e "Tasa de éxito: $(echo "scale=2; $passed_tests / $total_tests * 100" | bc 2>/dev/null || echo "0")%"
        echo -e "Reporte completo: $REPORT_DIR/index.html"
        
    else
        log "ERROR" "❌ No se encontró reporte de Playwright"
        echo "0" > "${TEST_RESULTS_DIR}/e2e-test-result-${TIMESTAMP}.txt"
        return 1
    fi
}

# Enviar notificación de resultados
send_test_notification() {
    local test_result=$1
    
    if [ -n "$WEBHOOK_URL" ]; then
        local status="success"
        local color="good"
        
        if [ "$test_result" -ne "0" ]; then
            status="failure"
            color="danger"
        fi
        
        local message="Tests E2E $status"
        
        if [ "$test_result" -ne "0" ]; then
            message="$message - Revisar logs en: $REPORT_DIR"
        fi
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"E2E Test Results\",
                    \"text\": \"$message\",
                    \"fields\": [{
                        \"title\": \"Entorno\",
                        \"value\": \"Producción\",
                        \"short\": true
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }, {
                        \"title\": \"Reporte\",
                        \"value\": \"$REPORT_DIR/index.html\",
                        \"short\": false
                    }],
                    \"footer\": \"Puente de Zardain E2E Tests\",
                    \"ts\": $(date +%s)
                }]
            }" 2>/dev/null || log "WARNING" "No se pudo enviar notificación"
    fi
}

# Limpiar resultados antiguos
cleanup_old_results() {
    log "INFO" "🧹 Limpiando resultados antiguos..."
    
    # Mantener solo los últimos 7 días de resultados
    find "$TEST_RESULTS_DIR" -name "e2e-report-*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
    find "$TEST_RESULTS_DIR" -name "e2e-test-result-*.txt" -mtime +7 -delete 2>/dev/null || true
    
    log "INFO" "✅ Limpieza de resultados completada"
}

# Verificar salud del sistema antes de tests
pre_test_health_check() {
    log "INFO" "🏥 Verificando salud del sistema..."
    
    # Verificar que la URL de producción esté accesible
    if ! curl -f -s --max-time 10 "$PROD_URL" > /dev/null; then
        log "ERROR" "❌ Frontend de producción no accesible: $PROD_URL"
        return 1
    fi
    
    # Verificar que la API esté accesible
    if ! curl -f -s --max-time 10 "$API_URL/health" > /dev/null; then
        log "ERROR" "❌ API de producción no accesible: $API_URL"
        return 1
    fi
    
    log "INFO" "✅ Sistema de producción accesible"
    return 0
}

# Función principal
main() {
    log "INFO" "🚀 Iniciando suite de tests E2E de producción"
    log "INFO" "Target: $PROD_URL"
    log "INFO" "API: $API_URL"
    
    # Verificar salud del sistema
    if ! pre_test_health_check; then
        log "ERROR" "❌ Verificación de salud falló. Abortando tests."
        exit 1
    fi
    
    # Ejecutar pasos del testing
    check_dependencies
    install_test_dependencies
    setup_test_environment
    
    # Ejecutar tests
    local test_result
    test_result=$(run_e2e_tests)
    
    # Generar reporte
    generate_test_report
    
    # Enviar notificación
    send_test_notification "$test_result"
    
    # Limpiar resultados antiguos
    cleanup_old_results
    
    # Retornar resultado final
    if [ "$test_result" -eq 0 ]; then
        log "INFO" "🎉 Suite de tests E2E completada exitosamente"
        exit 0
    else
        log "ERROR" "❌ Suite de tests E2E falló"
        exit 1
    fi
}

# Manejo de errores
trap 'log "ERROR" "❌ Script interrumpido inesperadamente"; exit 2' ERR
trap 'log "WARNING" "⚠️  Script detenido por señal"; exit 130' INT TERM

# Ejecutar función principal
main "$@"

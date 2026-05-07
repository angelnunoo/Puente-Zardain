@echo off
REM Script para ejecutar Backend en modo desarrollo

echo.
echo ==========================================
echo   BACKEND DEV SERVER - PUENTE ZARDAIN
echo ==========================================
echo.

cd /d "%~dp0backend"

REM Verificar que Node.js está disponible
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado
    pause
    exit /b 1
)

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Verificando servicios...
echo IMPORTANTE: Asegúrate de que está ejecutándose:
echo   ✓ PostgreSQL en localhost:5432
echo   ✓ Redis en localhost:6379
echo.
pause

echo.
echo Iniciando servidor backend en puerto 3001...
echo Abre http://localhost:3001 en tu navegador
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

call npm run start:dev

if errorlevel 1 (
    echo.
    echo ERROR al iniciar backend
    echo Verifica que PostgreSQL y Redis están corriendo
    echo.
    pause
    exit /b 1
)

@echo off
REM Script para ejecutar Frontend en modo desarrollo

echo.
echo ==========================================
echo   FRONTEND DEV SERVER - PUENTE ZARDAIN
echo ==========================================
echo.

cd /d "%~dp0frontend"

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
echo Verificando Backend...
echo IMPORTANTE: Asegúrate de que el Backend está ejecutándose:
echo   ✓ npm run start:dev en la carpeta backend
echo.
pause

echo.
echo Iniciando servidor frontend en puerto 3000...
echo Abre http://localhost:3000 en tu navegador
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

call npm run dev

if errorlevel 1 (
    echo.
    echo ERROR al iniciar frontend
    echo.
    pause
    exit /b 1
)

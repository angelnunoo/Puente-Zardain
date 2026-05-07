@echo off
REM Script para ejecutar migraciones Prisma

echo.
echo ==========================================
echo   MIGRACIONES PRISMA - PUENTE ZARDAIN
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

echo Verificando conexión a PostgreSQL...
echo.
echo IMPORTANTE: Asegúrate de que:
echo   1. PostgreSQL está ejecutándose
echo   2. La base de datos 'puente_zardain' existe
echo   3. Las credenciales en .env son correctas
echo.
pause

echo Ejecutando migraciones...
call npx prisma migrate dev

if errorlevel 1 (
    echo.
    echo ERROR en las migraciones
    echo Verifica:
    echo   - PostgreSQL está corriendo
    echo   - Base de datos existe
    echo   - Variables de .env son correctas
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ Migraciones completadas exitosamente
echo.
pause

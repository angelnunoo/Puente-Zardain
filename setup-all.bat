@echo off
REM Script de instalación completo para Puente Zardaín
REM Este script instala todas las dependencias y configuración

echo.
echo ==========================================
echo   PUENTE ZARDAIN - INSTALACION COMPLETA
echo ==========================================
echo.

REM Paso 1: Verificar Node.js
echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Descárgalo desde https://nodejs.org/ (v20 LTS recomendado)
    echo.
    pause
    exit /b 1
)
echo ✓ Node.js detectado: %NODE_VERSION%
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm no encontrado
    exit /b 1
)
echo ✓ npm listo

REM Paso 2: Instalar dependencias Backend
echo.
echo [2/6] Instalando dependencias Backend...
cd /d "%~dp0backend"
call npm install
if errorlevel 1 (
    echo ERROR: Falló instalación backend
    exit /b 1
)
echo ✓ Backend listo

REM Paso 3: Instalar dependencias Frontend
echo.
echo [3/6] Instalando dependencias Frontend...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo ERROR: Falló instalación frontend
    exit /b 1
)
echo ✓ Frontend listo

REM Paso 4: Crear archivo .env Backend
echo.
echo [4/6] Configurando variables de entorno...
cd /d "%~dp0backend"

REM Crear .env si no existe
if not exist ".env" (
    (
        echo NODE_ENV=development
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/puente_zardain
        echo REDIS_URL=redis://localhost:6379
        echo JWT_SECRET=your-secret-key-change-this-in-production
        echo JWT_EXPIRATION=7d
        echo PORT=3001
        echo FRONTEND_URL=http://localhost:3000
        echo STRIPE_SECRET_KEY=sk_test_your_key_here
        echo STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
    ) > .env
    echo ✓ Archivo .env creado (EDITA LAS CLAVES ANTES DE PRODUCCION)
) else (
    echo ✓ Archivo .env ya existe
)

REM Paso 5: Ejecutar migraciones Prisma
echo.
echo [5/6] Ejecutando migraciones Prisma...
echo NOTA: Asegúrate de que PostgreSQL está ejecutándose
echo.
pause
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ADVERTENCIA: Migraciones tuvieron error (PostgreSQL puede no estar disponible)
    echo Ejecuta manualmente: npx prisma migrate dev
)
echo ✓ Migraciones completadas

echo.
echo [6/6] Instalación completada
echo.
echo ==========================================
echo   PROXIMOS PASOS
echo ==========================================
echo.
echo 1. Asegúrate de que PostgreSQL y Redis están ejecutándose
echo 2. Edita los archivos .env con tus claves reales
echo 3. Ejecuta: npm run start:dev   (en la carpeta backend)
echo 4. En otra terminal: npm run dev   (en la carpeta frontend)
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:3001
echo.
pause

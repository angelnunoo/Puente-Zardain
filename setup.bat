@echo off
REM Script para setup local en Windows

echo.
echo  Puente de Zardain - Setup Local
echo ==================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  Error: Node.js no encontrado
    echo  Descárgalo desde: https://nodejs.org/
    exit /b 1
)

echo  OK - Node.js encontrado

REM Instalar dependencias root
echo.
echo Instalando dependencias raíz...
call npm install

REM Backend
echo.
echo Setup Backend...
cd backend
call npm install
echo  OK - Backend instalado
cd ..

REM Frontend
echo.
echo Setup Frontend...
cd frontend
call npm install
echo  OK - Frontend instalado
cd ..

REM Prisma
echo.
echo Generando Prisma Client...
cd backend
call npx prisma generate
echo  OK - Prisma generado
cd ..

REM Listo
echo.
echo ==================================
echo  Setup completado!
echo ==================================
echo.
echo Próximos pasos:
echo 1. Copia backend\.env.example a backend\.env
echo 2. Configura DATABASE_URL en backend\.env
echo 3. Ejecuta: npx prisma migrate dev
echo 4. Terminal 1: cd backend ^&^& npm run start:dev
echo 5. Terminal 2: cd frontend ^&^& npm run dev
echo.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo ==================================
pause
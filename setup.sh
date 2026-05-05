#!/bin/bash

# Script para setup local rápido

set -e

echo "🍔 Puente de Zardain - Setup Local"
echo "=================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Funciones
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 no encontrado${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ $1 encontrado${NC}"
    return 0
}

echo ""
echo "Verificando requisitos..."
check_command "node" || exit 1
check_command "npm" || exit 1
check_command "git" || exit 1

echo ""
echo "Instalando dependencias..."
npm install

echo ""
echo "Setup Backend..."
cd backend
npm install
echo "✓ Backend dependencias instaladas"

echo ""
echo "Setup Frontend..."
cd ../frontend
npm install
echo "✓ Frontend dependencias instaladas"

echo ""
echo "Generando Prisma Client..."
cd ../backend
npx prisma generate
echo "✓ Prisma generado"

echo ""
echo -e "${GREEN}=================================="
echo "✓ Setup completado"
echo "=================================="
echo ""
echo "Próximos pasos:"
echo "1. Copia backend/.env.example a backend/.env"
echo "2. Configura DATABASE_URL en backend/.env"
echo "3. Ejecuta: npx prisma migrate dev"
echo "4. Terminal 1: cd backend && npm run start:dev"
echo "5. Terminal 2: cd frontend && npm run dev"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "=================================="
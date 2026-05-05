# Guía de Desarrollo Local

## Setup Inicial

### 1. Clonar o descargar proyecto

```bash
cd c:\Users\NunoAngel\Desktop\TFG
```

### 2. Instalar dependencias

```bash
# Root workspace
npm install

# O individual
cd frontend && npm install
cd ../backend && npm install
```

### 3. Setup de Base de Datos

#### Opción A: PostgreSQL Local

```bash
# Instalar PostgreSQL desde postgresql.org
# En Windows: descargar installer

# Crear base de datos
createdb puente_zardain

# Conectar y verificar
psql -U postgres -d puente_zardain
```

#### Opción B: PostgreSQL en Docker

```bash
docker run --name postgres-zardain \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=puente_zardain \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Configurar variables de entorno

**backend/.env**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/puente_zardain"
JWT_SECRET="development-secret-key-change-in-production"
STRIPE_SECRET_KEY="sk_test_123..."
STRIPE_PUBLIC_KEY="pk_test_123..."
NODE_ENV="development"
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_STRIPE_KEY="pk_test_123..."
```

### 5. Migrar base de datos

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

Esto crea:
- Tablas en PostgreSQL
- Cliente Prisma actualizado

### 6. Seed de datos (opcional)

```bash
npx prisma db seed
```

Crea datos iniciales:
- Productos de ejemplo
- Categorías
- Admin de prueba

## Desarrollo

### Terminal 1: Backend

```bash
cd backend
npm run start:dev
```

Escucha en `http://localhost:3001`

**Logs deberían mostrar:**
```
[Nest] 1234  - 01/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 1234  - 01/01/2024, 10:00:00 AM     LOG [InstanceLoader] PrismaModule dependencies initialized...
[Nest] 1234  - 01/01/2024, 10:00:00 AM     LOG [RoutesResolver] AuthController {/auth}: routes registered...
[Nest] 1234  - 01/01/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Abre `http://localhost:3000`

## Testing

### Backend

```bash
cd backend

# Tests unitarios
npm test

# Coverage
npm run test:cov

# E2E
npm run test:e2e
```

### Frontend

```bash
cd frontend

# Jest tests
npm test

# Tests interactivos
npm test -- --watch
```

## Debugging

### Backend (VSCode)

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

Luego: F5 para debug

### Frontend

Chrome DevTools integrado en VSCode:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "attach",
      "name": "Attach to Chrome",
      "port": 9222
    }
  ]
}
```

## Prisma Studio

Interfaz visual para base de datos:

```bash
cd backend
npx prisma studio
```

Abre `http://localhost:5555`

Permite:
- Ver datos
- Crear/editar registros
- Relaciones visuales
- Queries directas

## Común Workflow

### 1. Crear nueva funcionalidad

```bash
# Generar módulo
cd backend
npx nest g module features/notifications

# Generar servicio
npx nest g service features/notifications

# Generar controlador
npx nest g controller features/notifications
```

### 2. Agregar endpoint

```typescript
// notifications.controller.ts
@Post()
create(@Body() body: CreateNotificationDto) {
  return this.notificationsService.create(body);
}
```

### 3. Test

```bash
npm run start:dev
curl -X POST http://localhost:3001/notifications \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### 4. Commit

```bash
git add .
git commit -m "feat: add notifications feature"
git push
```

## Troubleshooting

### "Port 3001 already in use"

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### "Database connection refused"

```bash
# Verificar PostgreSQL corriendo
psql -U postgres

# Si no está:
# Windows: Services → PostgreSQL → Start
# Docker: docker start postgres-zardain
# Verifica .env DATABASE_URL
```

### "Module not found"

```bash
# Reinstalar node_modules
rm -rf node_modules package-lock.json
npm install

# Regenerar Prisma
npx prisma generate
```

### Prisma schema out of sync

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## Extensiones VSCode Recomendadas

- Prettier (estilos)
- ESLint (linting)
- REST Client (testing APIs)
- Thunder Client (alternativa Postman)
- Prisma (syntax highlighting)
- Docker (si usas containers)

## Comandos Útiles

```bash
# Ver estado de migraciones
npx prisma migrate status

# Revertir migración
npx prisma migrate resolve --rolled-back <migrationName>

# Verificar schema
npx prisma db push

# Generar tipos
npx prisma generate

# Resetear BD (desarrollo solo)
npx prisma db reset
```

## Performance Local

### Si es lento:

1. **Instalar Redis local** para caché
```bash
docker run -p 6379:6379 redis:7
```

2. **Desactivar logs de query**
```typescript
// prisma/prisma.service.ts
super({ log: [] }) // En lugar de ['query']
```

3. **Aumentar pool size PostgreSQL**
```
DATABASE_URL="postgresql://user:password@localhost/db?connection_limit=20"
```

## Siguiente Paso

Ver `PROYECTO.md` para roadmap completo de funcionalidades.
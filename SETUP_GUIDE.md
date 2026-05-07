# GUÍA COMPLETA DE SETUP - Puente Zardaín

## 📋 Requisitos Previos

1. **Node.js v20 LTS** - Descargar desde https://nodejs.org/
2. **PostgreSQL 15+** - Descargar desde https://www.postgresql.org/
3. **Redis** - Descargar o instalar en WSL2
4. **Git** (opcional) - Descargar desde https://git-scm.com/

---

## 🚀 INICIO RÁPIDO (Pasos)

### Paso 1: Instalar Node.js
1. Ve a https://nodejs.org/ y descarga v20 LTS
2. Ejecuta el instalador (acepta todas las opciones)
3. Abre PowerShell/CMD y verifica:
```bash
node --version
npm --version
```

### Paso 2: Instalar PostgreSQL
1. Ve a https://www.postgresql.org/download/windows/
2. Ejecuta el instalador
3. Apunta la contraseña del usuario `postgres`
4. **Importante**: Recuerda el puerto (normalmente 5432)
5. Apunta: **contraseña de postgres y puerto**

Luego crea la base de datos:
```bash
# Abre pgAdmin 4 (instalado junto con PostgreSQL)
# O usa comando:
psql -U postgres
# En psql:
CREATE DATABASE puente_zardain;
\q
```

Ver más detalles: [POSTGRESQL_SETUP.md](./docs/POSTGRESQL_SETUP.md)

### Paso 3: Instalar Redis
Elige UNA opción:

**Opción A: WSL2 (Recomendado en Windows)**
```bash
# En PowerShell
wsl
sudo apt update
sudo apt install redis-server
redis-server
```

**Opción B: Windows direct**
- Descarga desde: https://github.com/microsoftarchive/redis/releases
- Instala `Redis-x64-3.2.100.msi`
- Se inicia automático

**Opción C: Docker**
```bash
docker run --name redis-puente -p 6379:6379 -d redis:7-alpine
```

Ver más detalles: [REDIS_SETUP.md](./docs/REDIS_SETUP.md)

### Paso 4: Ejecutar Setup Automático

**En la carpeta raíz del proyecto (c:\Users\NunoAngel\Desktop\TFG):**

Doble-click en `setup-all.bat`

O en CMD:
```bash
cd c:\Users\NunoAngel\Desktop\TFG
setup-all.bat
```

Este script:
✓ Instala dependencias backend
✓ Instala dependencias frontend
✓ Crea archivos `.env`
✓ Ejecuta migraciones Prisma
✓ Configura todo automáticamente

### Paso 5: Ejecutar los Servidores

**Terminal 1 - Backend (en carpeta raíz):**
```bash
run-backend.bat
```
O manualmente:
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend (en carpeta raíz):**
```bash
run-frontend.bat
```
O manualmente:
```bash
cd frontend
npm run dev
```

---

## 📍 Checklist Pre-Ejecución

Antes de ejecutar, verifica que TODO esté corriendo:

- [ ] Node.js instalado (`node --version` devuelve versión)
- [ ] npm instalado (`npm --version` devuelve versión)
- [ ] PostgreSQL ejecutándose
  - Windows: Services > postgresql-x64-15 (o Similar)
  - WSL: `sudo service postgresql start`
- [ ] Redis ejecutándose
  - WSL: `redis-server`
  - Windows: Redis debería ser servicio automático
  - Docker: `docker ps | grep redis`
- [ ] Base de datos `puente_zardain` creada
- [ ] Carpeta `node_modules` existe en `backend/` y `frontend/`

---

## 🌐 URLs de la Aplicación

Una vez ejecutando ambos servidores:

| Servicio | URL | Usuario | Contraseña |
|----------|-----|---------|-----------|
| **Frontend** | http://localhost:3000 | - | - |
| **Backend API** | http://localhost:3001 | - | - |
| **Swagger API Docs** | http://localhost:3001/api | - | - |
| **PostgreSQL** | localhost:5432 | postgres | (la que pusiste) |
| **Redis** | localhost:6379 | - | - |

---

## 🔧 Troubleshooting

### "node: command not found"
→ Node.js no está en el PATH. Reinstálalo desde nodejs.org

### "npm ERR! code ERESOLVE"
→ Ejecuta: `npm install --legacy-peer-deps`

### "Error: connect ECONNREFUSED 127.0.0.1:5432"
→ PostgreSQL no está ejecutándose. Inicia el servicio.

### "Error: connect ECONNREFUSED 127.0.0.1:6379"
→ Redis no está ejecutándose. Ejecuta `redis-server`

### "port 3001 is already in use"
→ Otro proceso usa el puerto. Ejecuta en otro puerto:
```bash
PORT=3002 npm run start:dev
```

### "Cannot find module '@nestjs/core'"
→ Ejecuta `npm install` en la carpeta backend

---

## 📝 Configuración Personalizada

### Cambiar Puertos
**Backend**: Edita `backend/.env`
```
PORT=3002
```

**Frontend**: Crea `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Cambiar Base de Datos
Edita `backend/.env`
```
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/base_datos
```

### Cambiar Redis
Edita `backend/.env`
```
REDIS_URL=redis://usuario:contraseña@host:puerto
```

---

## 🎯 Scripts Disponibles

| Script | Ubicación | Función |
|--------|-----------|---------|
| `setup-all.bat` | Raíz | Instala TODO |
| `run-backend.bat` | Raíz | Ejecuta backend dev |
| `run-frontend.bat` | Raíz | Ejecuta frontend dev |
| `run-migrations.bat` | Raíz | Ejecuta migraciones Prisma |

---

## 📚 Documentación Adicional

- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Guía de desarrollo
- [API.md](./docs/API.md) - Documentación API
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura del proyecto
- [POSTGRESQL_SETUP.md](./docs/POSTGRESQL_SETUP.md) - Setup PostgreSQL detallado
- [REDIS_SETUP.md](./docs/REDIS_SETUP.md) - Setup Redis detallado
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Desplegar a producción
- [STRIPE.md](./docs/STRIPE.md) - Integración Stripe

---

## ✅ Próximos Pasos Después del Setup

1. **Tests**: `npm test` en backend
2. **Linting**: `npm run lint` en ambas carpetas
3. **Build**: `npm run build` en ambas carpetas
4. **Explorar API**: Ir a http://localhost:3001/api
5. **Crear usuario de prueba**: En frontend, hacer registro
6. **Integrar Stripe**: Seguir [STRIPE.md](./docs/STRIPE.md)

---

## ❓ Preguntas?

Consulta los documentos en `/docs` o revisa el [README.md](./README.md) principal.

¡Felicidades! 🎉 Tu proyecto está listo para desarrollar.

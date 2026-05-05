# Guía de Despliegue (Deployment)

## Entornos

### Desarrollo
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Base de datos: PostgreSQL local

### Producción
- Frontend: `https://puente-zardain.com`
- Backend: `https://api.puente-zardain.com`
- Base de datos: PostgreSQL remota (managed service)
- Cache: Redis remoto

## Requisitos Previos

1. **Cuenta en un proveedor cloud**:
   - Heroku, Railway, Render, Vercel, AWS, Azure, DigitalOcean

2. **Variables de entorno**:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=long-secure-random-string
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLIC_KEY=pk_...
   NODE_ENV=production
   ```

3. **Certificados SSL/TLS** (HTTPS)

## Opción 1: Railway

### Backend

1. Conectar repositorio Git a Railway
2. Crear servicio PostgreSQL
3. Configurar variables de entorno
4. Deploy automático

```yaml
# railway.yaml
services:
  backend:
    root: ./backend
    buildCommand: npm run build
    startCommand: npm run start:prod
```

### Frontend

1. Conectar a Railway
2. Build command: `npm run build`
3. Start command: `npm start`

## Opción 2: Docker + Docker Compose

### Build

```bash
# Backend
docker build -t puente-zardain-backend ./backend

# Frontend
docker build -t puente-zardain-frontend ./frontend
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: puente_zardain
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/puente_zardain
      JWT_SECRET: your-secret
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      NODE_ENV: production
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Ejecutar

```bash
docker-compose up -d
```

## Opción 3: Vercel (Frontend) + Render (Backend)

### Frontend en Vercel

1. Push a GitHub
2. Importar en Vercel
3. Auto deploy en cada push
4. Variables de entorno: `NEXT_PUBLIC_API_URL`

### Backend en Render

1. Conectar repositorio
2. Crear servicio Web
3. Build command: `npm run build`
4. Start command: `npm run start:prod`
5. Conectar base de datos PostgreSQL (Render managed)

## Migrations en Producción

```bash
# Una sola vez al desplegar
npx prisma migrate deploy

# Ver estado
npx prisma migrate status
```

## Monitoreo

### Logs
```bash
# Backend
docker logs -f backend

# Frontend
vercel logs
```

### Health Check
```bash
GET /health
GET /readiness
```

## Escalabilidad

### Horizontal (múltiples instancias)

1. Load balancer (nginx, AWS ALB)
2. Estateless backend (NestJS soporta)
3. Redis para sesiones compartidas

### Vertical (más recursos)

1. Aumentar CPU/RAM
2. Optimizar queries con índices
3. Usar connection pooling en BD

## Backup

```bash
# Base de datos
pg_dump postgresql://user:password@host/db > backup.sql

# Restaurar
psql postgresql://user:password@host/db < backup.sql
```

## SSL/TLS

Automático con Let's Encrypt en la mayoría de proveedores cloud.

Verifica:
```bash
curl -I https://api.puente-zardain.com
```

## Performance

### Frontend
- NextJS auto-optimiza
- Usar `next/image` para imágenes
- Code splitting automático

### Backend
- Índices en BD
- Caché con Redis
- Compresión gzip
- Connection pooling

## Seguridad Producción

- [ ] Cambiar JWT_SECRET
- [ ] Habilitar HTTPS
- [ ] Configurar CORS correctamente
- [ ] Rate limiting
- [ ] WAF (Web Application Firewall)
- [ ] Backup automáticos
- [ ] Logs y auditoría
- [ ] Secretos en variables de entorno

## Rollback

```bash
# Si algo sale mal
git revert HEAD
git push
# Auto deploy triggerea

# O manualmente
docker pull image:anterior
docker-compose up -d
```

## Checklist de Despliegue

- [ ] Base de datos migrada
- [ ] Variables de entorno configuradas
- [ ] SSL/TLS activo
- [ ] Backup configurado
- [ ] Monitoreo activo
- [ ] Logs accesibles
- [ ] Health checks pasando
- [ ] Tests pasando
- [ ] Documentación actualizada
- [ ] SLA comunicado al cliente
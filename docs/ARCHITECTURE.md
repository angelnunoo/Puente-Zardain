# Decisiones de Arquitectura

## Por qué Next.js + NestJS

### Frontend: Next.js
- ✅ SSR y SSG para SEO (importante para restaurante)
- ✅ API routes si se necesita BFF
- ✅ Optimizaciones automáticas
- ✅ Excelente DX (Developer Experience)
- ✅ Deployment simple (Vercel, etc)

### Backend: NestJS
- ✅ Arquitectura modular por defecto
- ✅ TypeScript obligatorio (type safety)
- ✅ Decoradores para código limpio
- ✅ Guards, Pipes, Interceptors (middleware poderoso)
- ✅ Testing integrado
- ✅ WebSockets nativos
- ✅ Escalable a microservicios

## Modularidad

Cada módulo es independiente:
```
Module
├── Service (lógica)
├── Controller (rutas)
└── DTOs (tipos)
```

Ventajas:
- Fácil de testear
- Fácil de reutilizar
- Fácil de escalar
- Fácil de mantener

## Autenticación

### JWT vs Session

**Elegimos JWT porque:**
- Stateless (escala mejor)
- Funciona con WebSockets
- Móvil-friendly
- Más moderno

**Flujo:**
1. Usuario login → JWT token
2. Token en localStorage del cliente
3. Enviado en header Authorization
4. Backend valida con JwtStrategy

## Base de Datos

### Por qué PostgreSQL

- ✅ Relacional (modela bien el negocio)
- ✅ ACID completo
- ✅ JSON support (para customizaciones)
- ✅ Full-text search
- ✅ PostGIS para geocoding (futuro)
- ✅ Open source

### Por qué Prisma

- ✅ Type-safe
- ✅ Migraciones versionadas
- ✅ Studio para debugging
- ✅ Queries optimizadas
- ✅ Relaciones automáticas

## Chat en Tiempo Real

### Socket.IO

- ✅ Fallback automático (polling si no hay WebSocket)
- ✅ Rooms para chat por pedido
- ✅ Eventos typed
- ✅ Persistencia en BD para historial

## Estado de Cocina

### En memoria con broadcast

```typescript
// Opción elegida: simple y rápida
private status = 'open'

// Futuro: guardar en BD/Redis
// Para múltiples cocinas o datos analíticos
```

## Seguridad

### Principios

1. **Nunca confiar en cliente** → validar TODO en backend
2. **Principio de mínimo privilegio** → roles y guards
3. **Defense in depth** → múltiples capas

### Implementación

```typescript
// Guards en controllers
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
updateKitchenStatus() { }

// Validaciones en DTOs
class CreateOrderDto {
  @IsEmail()
  email: string;
  
  @IsIn(['domicilio', 'recogida'])
  type: string;
}
```

## Escalabilidad Futura

### Microservicios
```
Monolito (actual)
    ↓
Modular NestJS (actual)
    ↓
Microservicios (futuro)
  - Auth service
  - Orders service
  - Payments service
  - Notifications service
```

NestJS permite esto sin cambiar código base.

### Multi-tenancy
```typescript
// Adicional: tenant guard
@UseGuards(TenantGuard)
// Para múltiples restaurantes
```

### Sharding
```
Si crece mucho:
- Órdenes por mes
- Usuarios por región
- Chats por tenants
```

## Caching

### Niveles

1. **Frontend**: Next.js cache automático
2. **API**: Redis para productos/liga info
3. **BD**: Índices, query optimization

```typescript
// Futuro
@Cacheable()
getAllProducts() { }
```

## Testing

### Estrategia

```
Unit Tests (60%)
  └─ Services

Integration Tests (30%)
  └─ Modules con BD

E2E Tests (10%)
  └─ Flujos completos
```

## Monitoreo

### Stack futuro

- OpenTelemetry
- Prometheus + Grafana
- ELK (Elasticsearch, Logstash, Kibana)
- Sentry para errores

## CI/CD

### Futuro

```
Git push
  ↓
GitHub Actions
  ├─ npm test
  ├─ npm run build
  └─ docker build & push
    ↓
  Docker Registry
    ↓
  Production deploy
```

## Costes

### Desarrollo
- PostgreSQL local: $0
- Redis local: $0
- Next.js dev: $0

### Producción
- PostgreSQL managed: ~$20-50/mes
- Redis: ~$5-15/mes
- Backend (Render): ~$15-25/mes
- Frontend (Vercel): $0-20/mes
- DNS: ~$1/mes

**Total**: ~$50-100/mes

## Decisiones Reversibles

- [ ] WebSocket → REST + polling
- [ ] PostgreSQL → MongoDB
- [ ] JWT → Session
- [ ] NestJS → Express
- [ ] Tailwind → Bootstrap

**No reversibles** (harían refactor masivo):
- Modularidad → cambiar a monolito
- TypeScript → JavaScript puro
- BD relacional → documento

## Razón por la que Funciona

1. **KISS** (Keep It Simple)
2. **Separación de concerns** (auth, orders, etc.)
3. **Type safety** (TypeScript)
4. **Testing first** (diseño testeable)
5. **Documentación clara**
# Puente de Zardain - Plan de Pruebas

## Pruebas Unitarias

### Backend

```bash
# Auth service
npm test -- auth.service

# Users service
npm test -- users.service

# Products service
npm test -- products.service

# Orders service
npm test -- orders.service

# Kitchen service
npm test -- kitchen.service
```

### Frontend

```bash
# Componentes de login
npm test -- login

# Componentes de menú
npm test -- menu

# Carrito
npm test -- cart
```

## Pruebas de Integración

```bash
# Backend - módulos
npm test -- auth.module
npm test -- orders.module
```

## Pruebas E2E

### Flujo Cliente

1. **Registro**
   - POST `/auth/register` con datos válidos
   - Verificar JWT token retornado
   - Verificar usuario guardado en BD

2. **Login**
   - POST `/auth/login` con credenciales
   - Verificar JWT válido
   - Verificar persistencia en localStorage

3. **Ver Menú**
   - GET `/products`
   - Verificar lista de productos
   - Verificar ingredientes incluidos

4. **Crear Pedido**
   - POST `/orders` con items válidos
   - Verificar validación antifraude
   - Verificar status inicial PENDING
   - Verificar cálculo de total

5. **Seguimiento**
   - GET `/orders` lista pedidos
   - WebSocket escucha cambios de estado
   - Verificar actualización en tiempo real

### Flujo Admin

1. **Login Admin**
   - POST `/auth/login` como admin
   - Verificar acceso a `/admin`

2. **Ver Pedidos**
   - GET `/orders` (todos)
   - Filtrar por estado

3. **Cambiar Estado Cocina**
   - PUT `/kitchen/status` a "closed"
   - Verificar clientes no pueden pedir
   - PUT `/kitchen/status` a "open"

4. **Procesar Pedido**
   - PUT `/orders/:id/status` a PREPARING
   - PUT `/orders/:id/status` a READY
   - Verificar notificación cliente

## Casos de Prueba

### Validaciones

```typescript
// Test: Email duplicado en registro
POST /auth/register
{
  email: "existing@mail.com",
  password: "123456",
  phone: "123",
  name: "User"
}
// Expected: 409 Conflict

// Test: Carrito vacío en checkout
POST /orders
{
  userId: "uuid",
  items: [],
  paymentMethod: "card"
}
// Expected: 400 Bad Request

// Test: Dirección fuera de Arroyomolinos
POST /orders
{
  address: "Madrid, España"
}
// Expected: 400 Invalid address

// Test: Pedido grande sin tarjeta
POST /orders
{
  total: 500,
  paymentMethod: "cash"
}
// Expected: 400 Large orders require card
```

### Performance

```bash
# Cargar 1000 productos
GET /products?limit=1000
# Expected: < 200ms

# Crear 100 pedidos concurrentes
ab -n 100 -c 10 POST /orders
# Expected: todos exitosos, sin timeouts

# Chat 100 mensajes por segundo
# Expected: latencia < 100ms
```

### Seguridad

```typescript
// Test: SQL Injection
GET /products?name='; DROP TABLE products; --
// Expected: sanitizado, no ejecuta

// Test: XSS en reseña
POST /reviews
{
  comment: "<script>alert('XSS')</script>"
}
// Expected: escapado, no ejecuta en frontend

// Test: JWT inválido
GET /orders
Headers: Authorization: Bearer invalid_token
// Expected: 401 Unauthorized

// Test: Rate limiting
for (let i = 0; i < 101; i++) {
  GET /products
}
// Expected: tras 100, error 429 Too Many Requests
```

## Coverage Objetivos

- Backend: 80% código coverage
- Frontend: 60% código coverage
- Crítico (auth, pagos): 100%

## Testing Automation

```bash
# GitHub Actions (CI)
git push
# Automáticamente ejecuta:
npm test
npm run lint
npm run build
```

## Load Testing con Artillery

```yaml
# artillery.yml
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Get Products"
    flow:
      - get:
          url: "/products"
```

```bash
npx artillery run artillery.yml
```

## Monitoreo en Producción

```bash
# Ver logs
docker logs -f backend

# Health check
curl http://localhost:3001/health

# Métricas
curl http://localhost:3001/metrics
```
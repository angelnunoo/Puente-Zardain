# Especificación de API

## Base URL
- Desarrollo: `http://localhost:3001`
- Producción: `https://api.puente-zardain.com`

## Autenticación
Todos los endpoints protegidos requieren:
```
Authorization: Bearer {JWT_TOKEN}
```

## Endpoints

### Autenticación (`/auth`)

#### POST `/auth/register`
Registro de nuevo usuario
```json
{
  "email": "user@example.com",
  "phone": "123456789",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### POST `/auth/login`
Login con email y contraseña
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/auth/profile`
Obtener perfil (requiere JWT)

---

### Productos (`/products`)

#### GET `/products`
Listar todos los productos
```json
[
  {
    "id": "uuid",
    "name": "Hamburguesa",
    "price": 8.50,
    "category": "Hamburguesas",
    "ingredients": [
      { "name": "Pan", "required": true },
      { "name": "Lechuga", "required": false }
    ]
  }
]
```

#### GET `/products/:id`
Obtener producto específico

---

### Pedidos (`/orders`)

#### POST `/orders`
Crear nuevo pedido
```json
{
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "customizations": "{\"lechuga\": false}"
    }
  ],
  "delivery": true,
  "address": "Calle Principal 123, 28938 Arroyomolinos",
  "paymentMethod": "card"
}
```

#### GET `/orders`
Listar pedidos del usuario autenticado

#### PUT `/orders/:id/status`
Actualizar estado del pedido (ADMIN)
```json
{
  "status": "PREPARING"
}
```

Estados: `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`

---

### Cocina (`/kitchen`)

#### GET `/kitchen/status`
Obtener estado actual
```json
{
  "status": "open"
}
```

#### PUT `/kitchen/status`
Cambiar estado (ADMIN)
```json
{
  "status": "closed"
}
```

Estados: `open`, `closed`, `saturated`

---

### Chat (`/chat`) - WebSocket

#### Conexión
```javascript
const socket = io('http://localhost:3001');
socket.emit('joinRoom', { orderId: 'uuid' });
```

#### Enviar mensaje
```javascript
socket.emit('sendMessage', {
  orderId: 'uuid',
  sender: 'userId',
  content: 'Mensaje'
});
```

#### Recibir mensaje
```javascript
socket.on('newMessage', (message) => {
  console.log(message);
});
```

---

### Reseñas (`/reviews`)

#### POST `/reviews`
Crear reseña
```json
{
  "userId": "uuid",
  "rating": 5,
  "comment": "Excelente servicio"
}
```

#### GET `/reviews`
Listar reseñas

---

### Zardas (`/zardas`)

#### GET `/zardas/:userId`
Obtener Zardas del usuario
```json
{
  "zardas": 150,
  "league": "Platino Zarda"
}
```

#### POST `/zardas/:userId/add`
Añadir Zardas (ADMIN)
```json
{
  "amount": 50,
  "reason": "Compra realizada"
}
```

---

## Códigos de Error

| Código | Mensaje | Solución |
|--------|---------|----------|
| 400 | Bad Request | Validar datos enviados |
| 401 | Unauthorized | Verificar JWT token |
| 403 | Forbidden | Usuario no tiene permiso |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Recurso duplicado |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Server Error | Contactar soporte |

---

## Rate Limiting

- 100 requests por minuto por IP
- 10 requests por segundo por usuario autenticado
- Excepto WebSocket (ilimitado)

---

## Versionado

Actual: `v1`
URL: `/api/v1/...`

Próximas versiones mantendrán compatibilidad hacia atrás.
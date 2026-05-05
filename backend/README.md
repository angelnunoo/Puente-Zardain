# Backend - Puente de Zardain

API NestJS para la plataforma de pedidos online.

## Estructura

- `src/auth`: Autenticación JWT
- `src/users`: Gestión de usuarios
- `src/products`: Catálogo de productos
- `src/orders`: Gestión de pedidos
- `src/kitchen`: Control del estado de la cocina
- `src/chat`: Chat en tiempo real con WebSockets
- `src/reviews`: Sistema de reseñas
- `src/zardas`: Sistema de puntos de fidelización
- `prisma/`: Esquema y migraciones de base de datos

## Variables de entorno

```
DATABASE_URL=postgresql://user:password@localhost:5432/puente_zardain
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_...
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run start:dev
```

## Producción

```bash
npm run build
npm run start:prod
```
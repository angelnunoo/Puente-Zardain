# Puente de Zardain - Plataforma de Pedidos y Fidelización

Plataforma web completa para el restaurante Puente de Zardain, permitiendo pedidos online, fidelización con puntos "Zardas", chat en tiempo real, y panel administrativo.

## Stack Tecnológico

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Tiempo Real**: Socket.IO
- **Autenticación**: JWT
- **Pagos**: Stripe
- **Cache**: Redis

## Requisitos Previos

1. **Node.js** (versión 18 o superior): Descárgalo e instálalo desde [nodejs.org](https://nodejs.org/).
2. **PostgreSQL**: Instala PostgreSQL localmente o usa un servicio como Neon o Supabase.
3. **Redis**: Instala Redis localmente o usa un servicio como Upstash.

## Instalación

1. Clona el repositorio (o usa la estructura creada).
2. Instala dependencias:

   ```bash
   cd frontend
   npm install

   cd ../backend
   npm install
   ```

3. Configura la base de datos:
   - Crea una base de datos PostgreSQL.
   - En `backend/prisma/schema.prisma`, configura la conexión.
   - Ejecuta `npx prisma migrate dev` para crear las tablas.

4. Configura variables de entorno:
   - Crea `.env` en `backend/` con JWT_SECRET, DATABASE_URL, STRIPE_SECRET_KEY, etc.

## Ejecución

### Desarrollo

1. Backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### Producción

1. Backend: `npm run build && npm run start:prod`
2. Frontend: `npm run build && npm run start`

## Estructura del Proyecto

- `frontend/`: Aplicación Next.js para clientes y admin.
- `backend/`: API NestJS.
- `shared/`: Tipos y utilidades compartidas.
- `docs/`: Documentación adicional.

## MVP Inicial

- Autenticación de usuarios
- Carta digital
- Carrito de compras
- Proceso de pedido
- Panel admin básico
- Control de estado de la cocina

## Contribución

Este proyecto está diseñado para ser escalable y modular. Sigue las mejores prácticas de desarrollo.

## Licencia

UNLICENSED
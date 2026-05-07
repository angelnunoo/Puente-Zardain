# Puente de Zardain - Plataforma Completa

## Resumen del Proyecto

Este es un proyecto full-stack profesional para el restaurante **Puente de Zardain**, que permite:

✅ **Gestión de Pedidos**: Online (domicilio y recogida)
✅ **Sistema de Fidelización**: Puntos "Zardas" y ligas tipo LoL
✅ **Chat en Tiempo Real**: Comunicación cliente ↔ restaurante
✅ **Panel Admin**: Control total para cocina y gestión
✅ **Seguridad**: JWT, antifraude, validaciones backend
✅ **Arquitectura Modular**: Preparada para escalabilidad

## Estructura del Proyecto

```
puente-zardain/
├── frontend/              # Next.js + React + Tailwind
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx          # Home
│   │       ├── login/            # Autenticación
│   │       ├── register/         # Registro
│   │       ├── menu/             # Carta digital
│   │       ├── cart/             # Carrito
│   │       └── admin/            # Panel admin
│   └── package.json
├── backend/               # NestJS + TypeScript
│   ├── src/
│   │   ├── auth/         # Autenticación JWT
│   │   ├── users/        # Gestión de usuarios
│   │   ├── products/     # Catálogo
│   │   ├── orders/       # Pedidos
│   │   ├── kitchen/      # Estado cocina
│   │   ├── chat/         # WebSockets tiempo real
│   │   ├── reviews/      # Reseñas
│   │   ├── zardas/       # Puntos fidelización
│   │   └── main.ts       # Entry point
│   ├── prisma/
│   │   └── schema.prisma # Base de datos
│   └── package.json
├── shared/               # Tipos y utilidades compartidas
├── docs/                 # Documentación
└── .github/              # Configuración GitHub

```

## Stack Tecnológico

### Frontend
- **Next.js 13**: React framework con SSR
- **React 18**: Componentes UI
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling responsive
- **Socket.IO Client**: Chat en tiempo real

### Backend
- **NestJS 10**: Framework Node.js modular
- **TypeScript**: Lenguaje principal
- **PostgreSQL**: Base de datos relacional
- **Prisma ORM**: Acceso a BD tipado
- **Socket.IO**: WebSockets para chat
- **JWT**: Autenticación segura
- **Passport**: Estrategias de autenticación
- **Bcrypt**: Hash de contraseñas
- **Stripe**: Procesamiento de pagos
- **Redis**: Cache y estado

## MVP - Fase Inicial

✅ **1. Autenticación**
   - Registro + Login
   - JWT tokens
   - Persistencia segura

✅ **2. Carta Digital**
   - Categorías de productos
   - Personalización de ingredientes
   - Precios y descripciones

✅ **3. Carrito**
   - Edición de artículos
   - Cálculo automático de totales
   - Validaciones de carrito

✅ **4. Pedidos**
   - Crear pedidos
   - Seleccionar tipo (domicilio/recogida)
   - Validar dirección (Arroyomolinos)

✅ **5. Panel Admin Básico**
   - Ver pedidos en tiempo real
   - Cambiar estado de pedidos
   - Control de cocina (abierta/cerrada/saturada)

✅ **6. Estado de Cocina**
   - Mostrar estado a clientes
   - Bloquear pedidos si cerrada
   - Mensaje de saturación

## Módulos Backend

### `auth/`
Autenticación y autorización
- JWT strategy
- Guards y decoradores
- Login/Register

### `users/`
Gestión de usuarios
- Crear usuario
- Buscar por email/ID
- Actualizar perfil

### `products/`
Catálogo de productos
- Listar productos
- Categorías
- Ingredientes

### `orders/`
Sistema de pedidos
- Crear pedido
- Cambiar estado
- Validaciones antifraude

### `kitchen/`
Control de cocina
- Estado actual
- Actualizar estado
- Broadcast a clientes

### `chat/`
Chat en tiempo real
- WebSocket gateway
- Guardar mensajes
- Historial

### `reviews/`
Sistema de reseñas
- Crear reseña
- Listar reseñas
- Validar compras

### `zardas/`
Sistema de fidelización
- Sumar/restar puntos
- Gestionar ligas
- Historial

## Páginas Frontend

### Cliente
- **Home** (`/`): Información del restaurante + estado cocina
- **Login** (`/login`): Autenticación
- **Register** (`/register`): Registro de usuarios
- **Menu** (`/menu`): Carta con categorías
- **Cart** (`/cart`): Carrito y checkout
- **Profile** (`/profile`): Perfil, historial, Zardas

### Admin
- **Dashboard** (`/admin`): Panel control
- **Orders** (`/admin/orders`): Gestión de pedidos
- **Kitchen** (`/admin/kitchen`): Control cocina
- **Users** (`/admin/users`): Gestión de usuarios
- **Analytics** (`/admin/analytics`): Estadísticas

## Instalación y Setup

### Requisitos
- Node.js 18+
- PostgreSQL
- Redis (opcional para producción)

### Pasos

1. **Instalar dependencias**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   # backend/.env
   DATABASE_URL=postgresql://user:password@localhost:5432/puente_zardain
   JWT_SECRET=your-secret-key-change-this
   STRIPE_SECRET_KEY=sk_...
   REDIS_URL=redis://localhost:6379
   ```

3. **Setup de base de datos**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed  # Para datos iniciales
   ```

4. **Desarrollo**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run start:dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Acceder**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Documentación: http://localhost:3001/api/docs

## Funcionalidades Avanzadas (Próxima Fase)

- [ ] Sistema de ligas con ranking
- [ ] Recompensas canjeables
- [ ] Estadísticas admin (ventas, clientes, etc.)
- [ ] SMS para verificación
- [ ] Push notifications
- [ ] Multi-idioma completo
- [ ] App móvil (React Native/Flutter)
- [ ] Analytics avanzadas
- [ ] Integración completa Stripe

## Seguridad

- ✅ Autenticación JWT
- ✅ Validaciones en backend (CRÍTICO)
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Validación de direcciones
- ✅ Logs de acciones admin
- ✅ Roles y permisos

## Deployment

### Backend (NestJS)
```bash
npm run build
npm run start:prod
```

### Frontend (Next.js)
```bash
npm run build
npm run start
```

Usar Docker para producción:
```bash
docker build -t puente-zardain-backend ./backend
docker build -t puente-zardain-frontend ./frontend
docker-compose up
```

## Contribución

Este proyecto sigue arquitectura modular de NestJS. Para añadir nuevas funcionalidades:

1. Crear módulo con `nest g module nombreModulo`
2. Crear servicio con `nest g service nombreModulo`
3. Crear controlador con `nest g controller nombreModulo`
4. Agregar al `app.module.ts`

## Testing

```bash
# Backend
npm test
npm run test:cov

# Frontend
npm test
```

## Documentación Adicional

Ver carpeta `docs/` para:
- API documentation
- Database schema
- Architecture decisions
- Deployment guide

## Licencia

UNLICENSED - Proyecto académico + comercial

## Equipo

Desarrollado como Trabajo Fin de Grado (TFG) con estándares profesionales.

---

**Última actualización**: Mayo 2026
**Estado**: MVP en desarrollo
**Versión**: 0.1.0
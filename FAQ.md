# Frequently Asked Questions (FAQ)

## General

### ¿Qué es Puente de Zardain?
Plataforma web completa para pedidos online del restaurante Puente de Zardain, con sistema de fidelización mediante "Zardas" (puntos), chat en tiempo real y panel administrativo.

### ¿Cuándo estará en producción?
MVP público: Julio 2026
Versión completa: Diciembre 2026

### ¿Es gratis?
Para clientes: Sí
Para el restaurante: Costo de hosting (~$60-200/mes)

---

## Usuario

### ¿Cómo creo una cuenta?
1. Ir a `/register`
2. Ingresar email, teléfono, nombre y contraseña
3. ¡Listo! Puede pedir inmediatamente

### ¿Qué son los Zardas?
Puntos que ganas al:
- Realizar pedidos (1 Zarda por euro gastado)
- Dejar reseña (10 Zardas extra)
- Cumpleaños (50 Zardas)
- Racha de compras

Canjeables por:
- Descuentos
- Productos gratis
- Insignias exclusivas

### ¿Cuáles son las Ligas?
Similar a League of Legends:
- Bronce Zarda (0-500 Zardas)
- Plata Zarda (500-2000 Zardas)
- Oro Zarda (2000-5000 Zardas)
- Platino Zarda (5000+ Zardas)

Cada liga:
- Multiplicador de puntos (Platino = 1.5x)
- Recompensas exclusivas
- Insignias visibles en perfil

### ¿Cómo pago?
- Tarjeta de crédito/débito (integración Stripe)
- Efectivo en recogida (si está permitido)

Nota: Pedidos > 50€ requieren tarjeta

### ¿Puedo cambiar mi pedido?
Si está en estado "PENDING", contacta por chat
Si ya está "PREPARING", no se puede cambiar

### ¿Cuál es el costo de envío?
Domicilio en Arroyomolinos:
- 0-5km: 1.50€
- 5-10km: 3€
- >10km: No disponible

Recogida: Gratis

### ¿Cuánto tarda el pedido?
En recogida: 20-40 minutos
En domicilio: 40-60 minutos

Ves tiempo estimado real en seguimiento

### ¿Qué hago si tengo un problema?
1. Chat inmediato con restaurante
2. Email a support@puente-zardain.com
3. Teléfono +34 XXX XXX XXX

---

## Restaurante (Admin)

### ¿Cómo accedo al panel?
1. Login en `/login` con cuenta admin
2. Ir a `/admin`
3. Ver dashboard con pedidos activos

### ¿Cómo cambio el estado de la cocina?
Admin → Kitchen → Estado:
- Abierta: Acepta pedidos
- Cerrada: Rechaza pedidos nuevos
- Saturada: Acepta pero con advertencia

### ¿Cómo procesamos un pedido?
1. Ver en `/admin/orders`
2. Leer detalles y personalizaciones
3. Hacer clic en "Preparando"
4. Cuando esté listo: "Listo"
5. Cuando entregado: "Entregado"

Cliente recibe notificación en cada paso

### ¿Cómo respondo a clientes?
Panel `/admin/chats`:
- Ver todas las conversaciones
- Responder inmediatamente
- Respuestas rápidas preestablecidas
- Historial persistente

### ¿Cómo gestiono Zardas?
Admin → Zardas:
- Sumar/restar manualmente
- Motivo obligatorio (auditoria)
- Historial de todas las transacciones

### ¿Qué reportes tengo?
Dashboard muestra:
- Pedidos hoy/mes
- Ingresos totales
- Productos más vendidos
- Hora pico
- Clientes frecuentes

### ¿Cómo bloqueo un usuario?
Admin → Users → [Usuario] → Bloquear
- No puede hacer pedidos nuevos
- Se guarda razón del bloqueo

---

## Técnico

### Stack del Proyecto
**Frontend**: Next.js 13, React 18, TypeScript, Tailwind CSS
**Backend**: NestJS 10, TypeScript, PostgreSQL, Prisma
**Tiempo Real**: Socket.IO WebSockets
**Auth**: JWT (JSON Web Tokens)
**Pagos**: Stripe API

### ¿Dónde está el código?
GitHub: github.com/usuario/puente-zardain (privado en producción)

### ¿Cómo contribuyo?
Ver `CONTRIBUTING.md` para:
- Normas de código
- Workflow de git
- Testing requerido

### ¿Cómo reporto un bug?
GitHub Issues con:
1. Descripción clara
2. Pasos para reproducir
3. Comportamiento esperado vs actual
4. Screenshots
5. Browser/SO

### ¿Dónde está la API documentation?
Swagger en: `http://localhost:3001/api/docs`
O ver `docs/API.md`

### ¿Soporta multi-idioma?
MVP: Solo español
Preparado para: Inglés (fácil de agregar)

### ¿Soporta app móvil?
MVP: Responsive web (funciona en móvil)
Futura: App nativa (React Native)

---

## Seguridad

### ¿Mis datos están seguros?
- ✅ Contraseñas hasheadas con bcrypt
- ✅ HTTPS en producción
- ✅ JWT con expiración
- ✅ Validaciones backend (nunca confiar cliente)

### ¿Cómo manejo contraseñas?
Nunca se envían en texto plano:
1. Cliente: Hash local → envía hash
2. Backend: Verifica contra hash almacenado
3. JWT: Token + refresh token

### ¿Qué datos recolectan?
- Email, teléfono, nombre, dirección
- Histórico de pedidos y pagos
- Chat (solo por orden)

No recolectamos:
- Ubicación en tiempo real
- Datos de navegación
- Cookies de tracking

### ¿Hay antifraude?
Sí:
- Validación de dirección
- Límites de pedidos por usuario
- Detección de patrones sospechosos
- IP/teléfono duplicados

---

## Troubleshooting

### No puedo iniciar sesión
- Verifica email/contraseña
- ¿Cuenta confirmada?
- ¿Has recibido email de confirmación?
- Contacta support

### El carrito no guarda
- Limpiar cookies/cache
- Intentar otro navegador
- Verificar localStorage habilitado

### El chat no funciona
- Recarga la página
- Verifica conexión internet
- WebSockets habilitados
- Contacta support

### Pedido no llega
- Ver en tiempo real en seguimiento
- Chat con restaurante inmediatamente
- Verificar dirección correcta
- Contacta support si > 30min de retraso

### Error de pago
Posibles causas:
1. Tarjeta rechazada por banco
2. Fondos insuficientes
3. Datos incorrectos
4. Intenta de nuevo o otro método

---

## Legal

### ¿Qué privacidad tengo?
Ver `PRIVACY.md` para:
- Qué datos recolectamos
- Cómo los usamos
- Derechos GDPR (derecho al olvido)

### ¿Qué términos de servicio hay?
Ver `TERMS.md` para:
- Responsabilidades
- Limitaciones
- Política de devoluciones

### ¿Cómo contacto soporte legal?
legal@puente-zardain.com

---

## Marketing

### ¿Cómo invito amigos?
Sistema de referidos (próxima versión):
- Comparte código de referencia
- Ambos obtienen Zardas

### ¿Hay promociones?
Sí, siguiendo en `/promo`:
- Black Friday: -50%
- Cumpleaños: Descuento especial
- Racha: Compra 5 = 1 gratis

### ¿Dónde veo redes sociales?
- Instagram: @puente.zardain
- Facebook: Puente de Zardain
- Twitter: @puentezardain

---

**¿Pregunta no respondida?**
Contacta: support@puente-zardain.com
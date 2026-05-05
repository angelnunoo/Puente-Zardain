# Especificaciones del Proyecto

## Visión
Plataforma web profesional y usable en entorno real para gestión de pedidos online, fidelización de clientes y administración de restaurante.

## Objetivo Principal
Entregar un MVP funcional, escalable y defendible como Trabajo Fin de Grado.

## Métricas de Éxito
- ✅ Código limpio y documentado
- ✅ Arquitectura modular
- ✅ Seguridad en backend
- ✅ MVP funcional para producción
- ✅ Tests automatizados
- ✅ Documentación completa

## Stakeholders
- Cliente: Restaurante Puente de Zardain
- Usuario: Clientes finales + Personal restaurante
- Equipo: 1 desarrollador full-stack (TFG)

## Constraints
- Un solo restaurante (Arroyomolinos)
- Idioma principal: Español
- Sin app móvil nativa (MVP)
- Sin estadísticas avanzadas (MVP)
- Presupuesto: Bajo (hosting básico)

## Assumptions
- PostgreSQL disponible
- Internet estable
- Usuarios con navegador moderno
- Integración Stripe posible

## Dependencias
- Node.js 18+
- PostgreSQL 12+
- Stripe API
- Redis (opcional)

## Riesgos Principales
1. Falta de instalación de Node.js por permisos admin
   - Mitigación: Solicitar permisos especiales
2. Falta de usuarios en MVP
   - Mitigación: Marketing temprano
3. Cambios de requisitos
   - Mitigación: Comunicación constante

## Definiciones

### MVP (Minimum Viable Product)
- Login/Register
- Carta digital
- Carrito
- Checkout
- Seguimiento pedidos
- Chat básico
- Panel admin básico
- Estado de cocina

### Producción Ready
- Tests 80%+
- Monitoreo activo
- Backups automáticos
- Logs centralizados
- Documentación actualizada

### Escalabilidad
- Arquitectura preparada para microservicios
- BD con índices optimization
- Cache Redis implementado
- CDN ready

## Standards de Código
- TypeScript strict
- ESLint configurado
- Prettier configurado
- Testing con Jest
- API REST RESTful
- Versionado semántico

## Performance Targets
- API: <100ms latencia p99
- Frontend: <2s página carga
- DB Query: <50ms p99
- Chat: <100ms p99

## Seguridad Requerida
- HTTPS obligatorio producción
- JWT con expiration
- Rate limiting
- Input validation backend
- SQL injection prevention
- XSS protection
- CSRF tokens
- Logs de acciones admin

## Documentación
- README.md (raíz)
- PROYECTO.md (visión general)
- API.md (endpoints)
- ARCHITECTURE.md (decisiones)
- DEVELOPMENT.md (setup local)
- DEPLOYMENT.md (producción)
- CONTRIBUTING.md (contribución)
- CHECKLIST.md (progreso)
- ROADMAP.md (futuro)
- FAQ.md (preguntas)

## Próximas Fases
1. **Fase 2**: Funcionalidades principales (Q3)
2. **Fase 3**: Polish y producción (Q3-Q4)
3. **Fase 4**: Features avanzadas (2027+)

## Referencias
- NestJS: https://docs.nestjs.com
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Stripe: https://stripe.com/docs
- TypeScript: https://www.typescriptlang.org/docs
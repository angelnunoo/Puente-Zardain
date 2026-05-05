# Contribuyendo al Proyecto

## Normas de Código

### TypeScript
- Strict mode siempre activo
- No usar `any` sin justificación
- Interfaces para tipos complejos

### NestJS Backend
- Un módulo por funcionalidad
- Service: lógica
- Controller: rutas
- DTO: validación

### Next.js Frontend
- Componentes funcionales
- Props tipadas
- Usar hooks
- Serverless functions en `/app/api`

## Git Workflow

```bash
git checkout -b feature/nueva-funcionalidad
git add .
git commit -m "feat: descripción de cambios"
git push origin feature/nueva-funcionalidad
# Crear PR
```

## Commit Messages

```
feat: Nueva característica
fix: Corregir bug
docs: Documentación
style: Cambios de formato
refactor: Refactorizar código
test: Agregar tests
chore: Tareas de mantenimiento
```

## Testing

```bash
# Backend
npm test
npm run test:cov

# Frontend
npm test
```

## Linting

```bash
npm run lint
npm run lint:fix
```

## Pull Request Template

```markdown
## Descripción
Descripción clara de los cambios

## Tipo de Cambio
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change

## Testing
- [ ] Unit tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
```

## Reportar Bugs

En GitHub Issues, incluir:
- Descripción clara
- Pasos para reproducir
- Comportamiento esperado
- Comportamiento actual
- Screenshots si es UI
- Versión del navegador/Node

## Sugerencias de Mejora

Crear Issue con label `enhancement` describiendo:
- Problema que resuelve
- Solución propuesta
- Alternativas consideradas
- Contexto adicional
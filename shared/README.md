# Shared Types

Este directorio contiene tipos y utilidades compartidas entre frontend y backend.

## Estructura

```
shared/
├── types/
│   ├── user.ts
│   ├── order.ts
│   ├── product.ts
│   └── index.ts
├── constants/
│   └── index.ts
└── utils/
    └── index.ts
```

## Uso

### Frontend
```typescript
import { User, Order } from '@puente-zardain/shared';
```

### Backend
```typescript
import { User, Order } from '../../../shared';
```

## Build

```bash
npm run build
```

El output está en `dist/`
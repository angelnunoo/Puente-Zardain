# Redis Setup Guide para Puente Zardaín

## Instalación en Windows

### Opción 1: WSL2 (Windows Subsystem for Linux)
La forma más sencilla en Windows 10/11.

```bash
# En WSL2
sudo apt update
sudo apt install redis-server

# Iniciar Redis
redis-server

# Verificar en otra terminal
redis-cli ping
# Respuesta: PONG
```

### Opción 2: Redis-Windows
1. Descarga desde: https://github.com/microsoftarchive/redis/releases
2. Instala `Redis-x64-3.2.100.msi`
3. Se instalará como servicio automático
4. Verifica: `redis-cli ping`

### Opción 3: Docker
```bash
docker run --name redis-puente ^
  -p 6379:6379 ^
  -d redis:7-alpine

# Verificar
docker exec redis-puente redis-cli ping
```

### Opción 4: Chocolatey
```bash
choco install redis-64 -y
redis-cli ping
```

## Configuración

### Puerto por defecto
- Host: `localhost`
- Puerto: `6379`
- No necesita contraseña por defecto

### Conectar desde Node.js
```javascript
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379
});
```

### Con variables de entorno
En `.env`:
```
REDIS_URL=redis://localhost:6379
```

## Verificar Funcionamiento

```bash
# Conectarse a Redis CLI
redis-cli

# En la consola:
PING
# Respuesta: PONG

SET test "Hello"
GET test
# Respuesta: "Hello"

DEL test
```

## Troubleshooting

### Redis no inicia
```bash
# En WSL2
sudo service redis-server start

# Windows (como admin)
net start Redis
```

### Puerto 6379 ya está en uso
```bash
# Encontrar proceso que lo usa (PowerShell como admin)
netstat -ano | findstr :6379

# Cambiar puerto en redis.conf (si usas Redis-Windows)
```

## Para Desarrollo

Redis es usado para:
- **Sesiones**: Almacenar JWT tokens
- **Cache**: Caché de productos
- **Rate limiting**: Limitar peticiones API
- **WebSockets**: Mensajes en tiempo real

Para desarrollo, la configuración por defecto es suficiente.

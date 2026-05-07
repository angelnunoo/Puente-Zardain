# PostgreSQL Setup Guide para Puente Zardaín

## Instalación en Windows

### Opción 1: Installer oficial (Recomendado)
1. Descarga desde: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador
3. Apunta la contraseña del usuario `postgres`
4. Puerto por defecto: 5432
5. Componentes: Check "pgAdmin 4"

### Opción 2: Windows Subsystem for Linux (WSL2)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

### Opción 3: Docker
```bash
docker run --name postgres-puente ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=puente_zardain ^
  -p 5432:5432 ^
  -d postgres:15-alpine
```

## Crear Base de Datos

### Con psql (línea de comandos)
```bash
# Conectarse a PostgreSQL
psql -U postgres

# En la consola psql:
CREATE DATABASE puente_zardain;
CREATE USER puente_user WITH PASSWORD 'puente_password';
GRANT ALL PRIVILEGES ON DATABASE puente_zardain TO puente_user;
\q
```

### Con pgAdmin (GUI)
1. Abre pgAdmin 4
2. Right-click en "Databases" → Create → Database
3. Nombre: `puente_zardain`
4. Click Save

## Verificar Conexión

```bash
psql -U postgres -d puente_zardain -h localhost
```

Si se conecta, la BD está lista.

## Notas Importantes

- Usuario por defecto: `postgres`
- Contraseña: la que estableciste en instalación
- Host: `localhost`
- Puerto: `5432`
- Database: `puente_zardain`

## Troubleshooting

Si PostgreSQL no inicia en Windows:
```bash
# Como administrador
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

O reinicia el servicio desde Services.msc

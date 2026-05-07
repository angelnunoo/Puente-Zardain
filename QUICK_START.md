## ⚡ SETUP RÁPIDO - Puente Zardaín

### 🎯 5 Pasos para Empezar

1. **Instalar Node.js** → https://nodejs.org/ (v20 LTS)
   ```bash
   node --version  # Verifica
   ```

2. **Instalar PostgreSQL** → https://www.postgresql.org/download/windows/
   ```bash
   # Crea base de datos
   psql -U postgres
   CREATE DATABASE puente_zardain;
   ```

3. **Instalar Redis** → WSL2 o https://github.com/microsoftarchive/redis/releases
   ```bash
   redis-cli ping  # Debe responder PONG
   ```

4. **Ejecutar Setup** (en raíz del proyecto)
   ```bash
   setup-all.bat  # Instala TODO automáticamente
   ```

5. **Ejecutar Servidores** (abrir 2 terminales)
   ```bash
   # Terminal 1
   run-backend.bat
   
   # Terminal 2  
   run-frontend.bat
   ```

### 🌐 Aplicación Lista en:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

### 📂 Scripts Útiles

| Archivo | Función |
|---------|---------|
| `setup-all.bat` | 📦 Instala dependencias + migra BD |
| `run-backend.bat` | 🖥️ Ejecuta servidor backend |
| `run-frontend.bat` | 🎨 Ejecuta servidor frontend |
| `run-migrations.bat` | 🗄️ Ejecuta migraciones Prisma |

---

### ❗ Checklist Antes de Ejecutar

- ✅ Node.js v20+ instalado
- ✅ PostgreSQL ejecutándose (puerto 5432)
- ✅ Redis ejecutándose (puerto 6379)
- ✅ BD `puente_zardain` creada

---

### 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| `node: command not found` | Reinstala Node.js |
| `ERROR: connect ECONNREFUSED 127.0.0.1:5432` | Inicia PostgreSQL |
| `ERROR: connect ECONNREFUSED 127.0.0.1:6379` | Inicia Redis |
| `npm ERR! code ERESOLVE` | `npm install --legacy-peer-deps` |

---

### 📚 Documentación Completa

Ver `SETUP_GUIDE.md` para guía detallada con troubleshooting.

---

¡Listo! Ejecuta `setup-all.bat` para comenzar. 🚀

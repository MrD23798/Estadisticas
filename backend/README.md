# Estadísticas Backend API

Backend API para sistema de estadísticas judiciales con tRPC, MySQL y Google Sheets integration.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
cd estadisticas-backend
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
# Como mínimo necesitas configurar la base de datos MySQL:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=estadisticas
```

### 3. Configurar MySQL

#### Opción A: MySQL Local
1. Instalar MySQL Server
2. Crear base de datos:
```sql
CREATE DATABASE estadisticas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Opción B: Docker (Recomendado para desarrollo)
```bash
# Ejecutar MySQL en Docker
docker run --name estadisticas-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=estadisticas -p 3306:3306 -d mysql:8.0

# Tu .env debería tener:
DB_HOST=localhost
DB_PASSWORD=password
```

### 4. Ejecutar migraciones
```bash
npm run migrate
```

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```

El servidor estará disponible en: http://localhost:3000

## 📋 Endpoints Disponibles

- `GET /health` - Estado del servidor y base de datos
- `GET /info` - Información de la API  
- `GET /trpc` - Endpoint tRPC (en desarrollo)

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo con hot reload
npm run build        # Compilar TypeScript a JavaScript
npm run start        # Ejecutar servidor en producción
npm run migrate      # Ejecutar migraciones de base de datos
npm run migrate:csv  # Migrar datos CSV a base de datos (próximamente)
npm run sync         # Ejecutar sincronización manual (próximamente)
npm run test         # Ejecutar tests
npm run lint         # Verificar código con ESLint
npm run lint:fix     # Corregir problemas de ESLint automáticamente
```

## 📊 Configuración de Base de Datos

### Variables de entorno requeridas:
- `DB_HOST` - Host de MySQL (default: localhost)
- `DB_PORT` - Puerto de MySQL (default: 3306)  
- `DB_USER` - Usuario de MySQL (default: root)
- `DB_PASSWORD` - Contraseña de MySQL
- `DB_NAME` - Nombre de la base de datos (default: estadisticas)

### Migraciones
Las migraciones se ejecutan automáticamente al correr `npm run migrate`:
- `001_create_statistics.sql` - Tabla principal de estadísticas
- `002_create_auxiliary_tables.sql` - Tablas auxiliares y de control

## 🔧 Desarrollo

### Estructura del proyecto:
```
src/
├── server.ts           # Servidor Express principal
├── models/             # Tipos TypeScript
├── routers/            # Routers tRPC
├── services/           # Lógica de negocio  
├── utils/              # Utilidades (DB, cache, etc.)
├── workers/            # Workers para sincronización
└── migrations/         # Scripts SQL de migración
```

### Próximas funcionalidades:
- [ ] Servicios de datos (DatabaseService, GoogleSheetsService)
- [ ] Routers tRPC completos
- [ ] Sincronización con Google Sheets
- [ ] Migración de datos CSV
- [ ] Cache inteligente
- [ ] Tests unitarios

## 🐛 Troubleshooting

### Error de conexión a MySQL:
1. Verificar que MySQL esté ejecutándose
2. Verificar credenciales en `.env`
3. Verificar que la base de datos existe

### Error de dependencias:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de TypeScript:
```bash
npm run build
```

## 📝 Notas

- El servidor incluye hot reload para desarrollo
- Los endpoints tRPC se añadirán en las próximas versiones
- La migración CSV se implementará próximamente
- Google Sheets integration es opcional por ahora
# 🚀 Sistema de Sincronización con Google Sheets - Implementación Completa

## ✅ Lo que se ha implementado

### 1. 🗃️ Nuevas Entidades de Base de Datos

- **`TipoCaso`** (`src/database/entities/TipoCaso.ts`)
  - Catálogo de tipos de casos judiciales
  - Campos: id, name, codigo, descripcion, categoria, activo, orden, metadatos

- **`EstadisticaTipoCaso`** (`src/database/entities/EstadisticaTipoCaso.ts`)
  - Estadísticas detalladas por tipo de caso
  - Campos: recibidosAsignados, reingresados, existentes, total, resueltos, pendientes, porcentajeResolucion

### 2. 🔄 Servicio de Sincronización

- **`SyncService`** (`src/services/sync.service.ts`)
  - Conexión con Google Sheets API
  - Sincronización completa y por dependencia específica
  - Parsing inteligente de datos desde hojas
  - Transacciones de base de datos seguras
  - Manejo de errores robusto

### 3. 🎮 Controlador de Administración

- **`AdminController`** (`src/controllers/admin.controller.ts`)
  - Endpoint de sincronización (`/api/admin/sync`)
  - Verificación de estado (`/api/admin/sync/status`)
  - Información de hojas (`/api/admin/sync/sheets-info`)
  - Autenticación mediante clave secreta

### 4. 🛣️ Rutas de API

- **`admin.routes.ts`** (`src/routes/admin.routes.ts`)
  - Rutas protegidas con documentación Swagger
  - Validación de esquemas
  - Logging de seguridad

### 5. ⚙️ Configuración Actualizada

- **Base de datos** actualizada con nuevas entidades
- **Variables de entorno** para Google Sheets y seguridad
- **Migraciones SQL** para crear las nuevas tablas

### 6. 🧪 Scripts de Prueba

- **`test-sync.ts`** - Script para verificar configuración
- **Comandos npm** para facilitar pruebas

### 7. 📚 Documentación

- **`SYNC_README.md`** - Documentación completa del sistema
- **Ejemplos de uso** con cURL, JavaScript, etc.

## 🔧 Configuración Requerida

### Variables de Entorno (.env)

```bash
# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_AQUI\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=tu_spreadsheet_id

# Seguridad
SYNC_SECRET_KEY=tu_clave_super_secreta
```

### Estructura del Google Spreadsheet

Tu spreadsheet debe tener una hoja "Índice":

| Sheet ID | Nombre Dependencia | Última Actualización |
|----------|-------------------|---------------------|
| Hoja1    | Cámara Federal 1  | 2024-01-15         |
| Hoja2    | Juzgado Federal 3 | 2024-01-14         |

## 🚀 Cómo usar el sistema

### 1. Configurar Google Sheets
1. Crear Service Account en Google Cloud Console
2. Habilitar Google Sheets API
3. Configurar variables de entorno
4. Dar permisos al Service Account en tu spreadsheet

### 2. Ejecutar migraciones
```bash
# Ejecutar migraciones SQL para crear las nuevas tablas
npm run migrate
```

### 3. Probar configuración
```bash
# Verificar que todo esté configurado correctamente
npm run test-sync
```

### 4. Ejecutar sincronización
```bash
# Vía API HTTP
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"secret": "tu_clave_secreta"}'
```

## 📊 Endpoints Disponibles

### `POST /api/admin/sync`
- **Descripción**: Ejecuta sincronización completa o por dependencia
- **Body**: `{ "secret": "clave", "dependencyName": "opcional" }`
- **Respuesta**: Resultado detallado de la sincronización

### `POST /api/admin/sync/status`
- **Descripción**: Verifica estado del servicio
- **Body**: `{ "secret": "clave" }`
- **Respuesta**: Estado de configuración y conectividad

### `POST /api/admin/sync/sheets-info`
- **Descripción**: Lista hojas disponibles en Google Sheets
- **Body**: `{ "secret": "clave" }`
- **Respuesta**: Información de reportes disponibles

## 🔒 Seguridad

- ✅ Autenticación por clave secreta
- ✅ Validación de entrada
- ✅ Logging de operaciones
- ✅ Manejo seguro de credenciales
- ✅ Transacciones de base de datos

## 🎯 Flujo de Sincronización

1. **Autenticación** con Google Sheets usando Service Account
2. **Lectura** del índice de reportes disponibles
3. **Procesamiento** individual de cada hoja
4. **Parsing** inteligente según formato de datos
5. **Guardado** transaccional en base de datos
6. **Reporte** de resultados y errores

## 📈 Beneficios

- 🔄 **Sincronización automática** desde Google Sheets
- 📊 **Datos estructurados** en base de datos relacional
- 🔍 **Trazabilidad completa** de operaciones
- ⚡ **Alto rendimiento** con transacciones optimizadas
- 🛡️ **Seguridad robusta** con autenticación y validación
- 📋 **Facilidad de uso** con endpoints simples

## 🧪 Testing

```bash
# Probar configuración básica
npm run test-sync

# Probar con endpoint API (servidor debe estar corriendo)
npm run test-sync-api

# Verificar estado del servicio
curl -X POST http://localhost:3000/api/admin/sync/status \
  -H "Content-Type: application/json" \
  -d '{"secret": "tu_clave"}'
```

## 📝 Próximos Pasos

1. **Configurar** variables de entorno con tus credenciales
2. **Preparar** tu Google Spreadsheet con la estructura requerida
3. **Ejecutar** las migraciones de base de datos
4. **Probar** la configuración con el script de prueba
5. **Implementar** la sincronización en tu flujo de trabajo

¡El sistema está listo para usar! 🎉
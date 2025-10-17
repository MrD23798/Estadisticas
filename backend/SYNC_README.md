# Sistema de Sincronización con Google Sheets

Este backend incluye un sistema completo de sincronización con Google Sheets que permite importar estadísticas judiciales automáticamente.

## 🔧 Configuración

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```bash
# 🔑 Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=tu_spreadsheet_id_aqui

# 🔐 Clave secreta para sincronización
SYNC_SECRET_KEY=tu_clave_super_secreta_aqui
```

### 2. Configurar Google Sheets API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la Google Sheets API
4. Crea credenciales de "Service Account"
5. Descarga el archivo JSON de credenciales
6. Extrae el `client_email` y `private_key` para las variables de entorno

### 3. Preparar el Google Spreadsheet

Tu spreadsheet debe tener una hoja llamada "Índice" con la siguiente estructura:

| Sheet ID | Nombre Dependencia | Última Actualización |
|----------|-------------------|---------------------|
| Hoja1    | Cámara Federal 1  | 2024-01-15         |
| Hoja2    | Juzgado Federal 3 | 2024-01-14         |

## 🚀 Uso del Sistema

### Endpoints Disponibles

#### 1. Sincronización Completa
```bash
POST /api/admin/sync
Content-Type: application/json

{
  "secret": "tu_clave_super_secreta_aqui"
}
```

#### 2. Sincronización de Dependencia Específica
```bash
POST /api/admin/sync
Content-Type: application/json

{
  "secret": "tu_clave_super_secreta_aqui",
  "dependencyName": "Cámara Federal 1"
}
```

#### 3. Verificar Estado del Servicio
```bash
POST /api/admin/sync/status
Content-Type: application/json

{
  "secret": "tu_clave_super_secreta_aqui"
}
```

#### 4. Información de Hojas Disponibles
```bash
POST /api/admin/sync/sheets-info
Content-Type: application/json

{
  "secret": "tu_clave_super_secreta_aqui"
}
```

### Ejemplo con cURL

```bash
# Sincronización completa
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"secret": "tu_clave_super_secreta_aqui"}'

# Verificar estado
curl -X POST http://localhost:3000/api/admin/sync/status \
  -H "Content-Type: application/json" \
  -d '{"secret": "tu_clave_super_secreta_aqui"}'
```

### Ejemplo con JavaScript/Fetch

```javascript
async function syncData() {
  const response = await fetch('http://localhost:3000/api/admin/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: 'tu_clave_super_secreta_aqui'
    })
  });

  const result = await response.json();
  console.log('Resultado:', result);
}

// Ejecutar sincronización
syncData();
```

## 📊 Estructura de Datos

### Entidades Creadas

1. **Dependencia** - Información de las dependencias judiciales
2. **Estadistica** - Estadísticas principales por período
3. **TipoCaso** - Tipos de casos (catálogos)
4. **EstadisticaTipoCaso** - Estadísticas detalladas por tipo de caso

### Flujo de Sincronización

1. **Conectar** a Google Sheets usando Service Account
2. **Leer** el índice de reportes disponibles
3. **Procesar** cada hoja individualmente
4. **Parsear** los datos según el formato esperado
5. **Guardar** en la base de datos de forma transaccional
6. **Reportar** resultados y errores

## 🔒 Seguridad

- Todas las operaciones requieren una clave secreta
- Los endpoints están protegidos contra acceso no autorizado
- Las credenciales de Google se manejan de forma segura
- Logging completo de todas las operaciones

## 🐛 Troubleshooting

### Error: "Variables de entorno no configuradas"
- Verifica que todas las variables requeridas estén en tu archivo `.env`
- Asegúrate de que la `GOOGLE_PRIVATE_KEY` tenga los saltos de línea correctos

### Error: "No se pudo obtener el índice de reportes"
- Verifica que tu Service Account tenga permisos de lectura en el spreadsheet
- Confirma que existe una hoja llamada "Índice" con la estructura correcta

### Error: "Error de conexión con la base de datos"
- Verifica la conexión a MySQL
- Asegúrate de que las entidades estén sincronizadas con `npm run migrate`

## 📝 Logs

El sistema genera logs detallados:

```
🚀 Iniciando sincronización desde Google Sheets...
📋 Encontrados 5 reportes para procesar
📊 Procesando reporte para: Cámara Federal 1
✅ Datos guardados para Cámara Federal 1 - 202401
```

## 🔄 Automatización

Para automatizar la sincronización, puedes:

1. **Cron job** en el servidor
2. **GitHub Actions** o CI/CD
3. **Webhook** desde Google Sheets
4. **Scheduler** en la nube

Ejemplo de cron job:
```bash
# Sincronizar cada día a las 2 AM
0 2 * * * curl -X POST http://localhost:3000/api/admin/sync -H "Content-Type: application/json" -d '{"secret": "tu_clave"}'
```
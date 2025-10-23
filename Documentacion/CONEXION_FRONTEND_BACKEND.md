# 🔌 Guía de Conexión Frontend ↔ Backend

## 📋 Resumen

El frontend **NO** se conecta directamente a MySQL. En su lugar, consume la API REST del backend.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Frontend   │   HTTP  │   Backend   │  MySQL  │   Database  │
│  (React)    │ ──────> │  (Fastify)  │ ──────> │   (MySQL)   │
│  Port 5173  │         │  Port 3000  │         │  Port 3306  │
└─────────────┘         └─────────────┘         └─────────────┘
```

## ✅ Configuración Completada

### 1. Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_DEBUG_MODE=true
```

### 2. Backend (`.env`)
```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=dante7991.,
DB_DATABASE=estadisticas

# Servidor
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Google Sheets
GOOGLE_SHEETS_API_KEY=AIzaSyDIcLqhhKYOAMytTAN5TNDI096gdOwv8Eg
GOOGLE_SHEETS_SPREADSHEET_ID=1K3K_w16qqQ_TiEux1XY0VXkZAVE-fJf9XlgWflTvBGA

# Sync
SYNC_ENABLED=false  # Deshabilitado para evitar re-descarga automática
```

## 🚀 Cómo Iniciar Todo

### Paso 1: Iniciar el Backend
```powershell
cd backend
npm run dev
```

Deberías ver:
```
✅ Database connection successful
🚀 Server listening at http://localhost:3000
```

### Paso 2: Iniciar el Frontend
```powershell
cd frontend
npm run dev
```

Deberías ver:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Paso 3: Abrir en el Navegador
Abre: http://localhost:5173

## 📡 Endpoints Disponibles

El frontend ya tiene configurado `apiClient` que se conecta a estos endpoints:

### Consultas Básicas
- `GET /api/estadisticas/dependencia/:nombre` - Estadísticas por dependencia
- `GET /api/estadisticas/periodos` - Lista de períodos disponibles
- `GET /api/estadisticas/dependencias` - Lista de dependencias disponibles
- `GET /api/estadisticas/objetos-juicio` - Lista de tipos de caso disponibles

### Consultas Avanzadas
- `POST /api/estadisticas/comparar` - Comparar múltiples dependencias
- `POST /api/estadisticas/evolucion` - Evolución temporal
- `GET /api/estadisticas/categorias/:dependencia/:periodo` - Categorías detalladas

### Endpoints Específicos para Frontend
- `GET /api/estadisticas/evolucion?dependenciaId=1` - Evolución de una dependencia
- `GET /api/estadisticas/comparativa?dependenciaIds=1,2,3&anio=2024&mes=2` - Comparativa
- `GET /api/estadisticas/individual?dependenciaId=1&anio=2024&mes=2` - Reporte individual completo

## 🔧 Servicios Frontend Ya Configurados

El frontend ya tiene estos servicios listos para usar:

### `apiClient.ts`
Cliente HTTP centralizado con interceptores para:
- ✅ Manejo automático de errores
- ✅ Timeout de 60 segundos
- ✅ Logs de debug en consola
- ✅ Headers automáticos

### `apiService.ts`
Funciones de alto nivel para:
- ✅ `fetchDependencies()` - Obtener lista de dependencias
- ✅ `fetchAvailablePeriods()` - Obtener períodos disponibles
- ✅ `fetchDependencyStats()` - Obtener estadísticas de una dependencia
- ✅ `fetchComparisonStats()` - Comparar dependencias
- ✅ `fetchEvolutionStats()` - Evolución temporal
- ✅ `fetchObjectTypes()` - Tipos de caso disponibles
- ✅ `checkAPIAvailability()` - Verificar si el backend está activo

## 💡 Ejemplo de Uso en Componentes

```typescript
import { apiClient } from '@/api/apiClient';
import { fetchDependencies, fetchDependencyStats } from '@/services/apiService';

// En un componente React
const MiComponente = () => {
  const [dependencias, setDependencias] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);

  useEffect(() => {
    // Cargar dependencias disponibles
    const cargarDependencias = async () => {
      const deps = await fetchDependencies();
      setDependencias(deps);
    };
    
    cargarDependencias();
  }, []);

  const cargarEstadisticas = async (dep: string, mes: string, anio: string) => {
    const stats = await fetchDependencyStats(dep, mes, anio);
    setEstadisticas(stats);
  };

  return (
    <div>
      {/* Tu UI aquí */}
    </div>
  );
};
```

## 🔍 Verificación de Conexión

### Opción 1: Desde el navegador
Abre: http://localhost:3000/health

Deberías ver:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "connected": true,
    "info": {
      "type": "mysql",
      "database": "estadisticas"
    }
  },
  "features": {
    "googleSheets": true,
    "sync": false,
    "cache": false
  }
}
```

### Opción 2: Desde el frontend (consola del navegador)
```javascript
import { checkAPIAvailability } from '@/services/apiService';

const verificar = async () => {
  const disponible = await checkAPIAvailability();
  console.log('API disponible:', disponible);
};

verificar();
```

## 🎯 Flujo de Datos

```mermaid
graph LR
    A[Usuario en Frontend] --> B[Componente React]
    B --> C[apiService.ts]
    C --> D[apiClient.ts]
    D --> E[Backend API]
    E --> F[Service Layer]
    F --> G[TypeORM Repository]
    G --> H[MySQL Database]
    H --> G
    G --> F
    F --> E
    E --> D
    D --> C
    C --> B
    B --> A
```

## ⚠️ Solución de Problemas

### Frontend no se conecta al backend

**Síntoma:** Error "ERR_CONNECTION_REFUSED" en consola del navegador

**Solución:**
1. Verificar que el backend esté corriendo: `cd backend && npm run dev`
2. Verificar puerto en `.env` del frontend: `VITE_API_BASE_URL=http://localhost:3000`
3. Verificar CORS en backend `.env`: `CORS_ORIGIN=http://localhost:5173`

### Backend no se conecta a MySQL

**Síntoma:** Error "ER_ACCESS_DENIED_ERROR" en logs del backend

**Solución:**
1. Verificar credenciales en `backend/.env`
2. Verificar que MySQL esté corriendo
3. Verificar que la base de datos `estadisticas` exista

### No hay datos en las consultas

**Síntoma:** Respuestas vacías `[]` o `{ categorias: [] }`

**Solución:**
1. Verificar que hay datos en la base de datos: Abrir Navicat y consultar tabla `estadisticas`
2. Si no hay datos, ejecutar el import de CSV: `cd backend && npm run import-csv`
3. O habilitar sync en `.env`: `SYNC_ENABLED=true` (si tienes Google Sheets configurado)

## 📊 Estado Actual de Datos

Según el último import:

- ✅ **2 estadísticas** importadas desde CSV
- ✅ **12 tipos de caso** creados en tabla `tipos_caso`
- ✅ **20 relaciones** creadas en tabla `estadisticas_tipo_caso`
- ✅ **Dependencias:** J1-SEC, J2-SEC
- ✅ **Período:** 202402 (Febrero 2024)

## 🔐 Seguridad

**IMPORTANTE:** El frontend **NUNCA** accede directamente a la base de datos.

Razones:
- 🔒 No exponer credenciales de MySQL en el navegador
- 🔒 Validación centralizada en el backend
- 🔒 Control de acceso y autenticación en un solo punto
- 🔒 Prevenir ataques de SQL Injection
- 🔒 Permitir caché y optimizaciones en el backend

## 📚 Próximos Pasos

1. ✅ Backend configurado
2. ✅ Frontend configurado
3. ✅ Datos de prueba importados
4. ⏭️ **Siguiente:** Usar la aplicación y verificar que los datos se muestren correctamente
5. ⏭️ **Opcional:** Importar más archivos CSV para tener más datos de prueba

---

💡 **Tip:** Abre las DevTools del navegador (F12) y revisa la pestaña "Network" para ver las peticiones HTTP que el frontend hace al backend.

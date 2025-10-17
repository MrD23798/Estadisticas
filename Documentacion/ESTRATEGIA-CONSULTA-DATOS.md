# Estrategia de Consulta de Datos: Base de Datos vs Google Sheets

## Resumen

Este documento describe la estrategia implementada para consultar datos en el sistema. La lógica sigue un orden de prioridad específico:

1. **Primero consultar la base de datos local**
2. **Solo si no hay datos, intentar obtenerlos de Google Sheets**
3. **Si no se encuentran datos en ninguna fuente, retornar un resultado vacío**

## Lógica de Implementación

### Backend (API)

El backend implementa un parámetro `buscarEnGoogleSheets` que controla si se debe buscar en Google Sheets cuando no se encuentran datos en la base de datos.

#### Flujo de decisión:

```
┌─────────────────┐
│  Recibir        │
│  solicitud      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Buscar en      │
│  base de datos  │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ ¿Datos │    Sí    ┌─────────────┐
    │ encon- ├────────► │ Devolver    │
    │ trados?│          │ resultados  │
    └────┬───┘          └─────────────┘
         │ No
         ▼
┌─────────────────────┐
│ ¿buscarEnGoogleSheets│  No  ┌─────────────┐
│ es true?           ├─────► │ Devolver    │
└─────────┬───────────┘      │ 404 Not Found│
          │ Sí               └─────────────┘
          ▼
┌─────────────────────┐
│ Buscar en           │
│ Google Sheets       │
└─────────┬───────────┘
          │
          ▼
     ┌────────┐
     │ ¿Datos │   Sí    ┌─────────────────┐
     │ encon- ├────────►│ Guardar en BD y │
     │ trados?│         │ devolver datos  │
     └────┬───┘         └─────────────────┘
          │ No
          ▼
┌─────────────────────┐
│ Devolver array      │
│ vacío               │
└─────────────────────┘
```

### Frontend (Cliente)

El frontend inicialmente hace la consulta sin forzar Google Sheets (`forceGoogleSheets: false`). Si no se encuentran datos en la base de datos, el servicio `apiService.ts` automáticamente realiza una segunda consulta con `buscarEnGoogleSheets: true`.

## Endpoints Afectados

Todos los endpoints de consulta de datos incluyen el parámetro opcional `buscarEnGoogleSheets` que puede ser `true` o `false` (por defecto es `false`).

## Beneficios de esta Estrategia

1. **Rendimiento Mejorado**: Las consultas a la base de datos son significativamente más rápidas que las consultas a Google Sheets API.

2. **Reducción de Cuota**: Minimiza las llamadas a la API de Google Sheets, evitando alcanzar los límites de cuota.

3. **Mayor Robustez**: Si Google Sheets no está disponible, el sistema puede seguir funcionando con los datos en la base de datos.

4. **Sincronización Automática**: Al encontrar datos en Google Sheets que no existen en la base de datos, los guarda automáticamente para futuras consultas.

## Consideraciones

- Los datos en Google Sheets pueden ser más actualizados que los de la base de datos.
- Se puede forzar la búsqueda en Google Sheets usando el parámetro `buscarEnGoogleSheets=true`.
- El proceso de búsqueda en Google Sheets y la posterior escritura en la base de datos puede ser lento.

## Ejemplo de Uso

```typescript
// Frontend
// Solo buscar en base de datos
const data = await apiClient.getCategorias(dependencia, periodo);

// Buscar en base de datos y luego en Google Sheets si no hay resultados
const data = await apiClient.getCategorias(dependencia, periodo, { buscarEnGoogleSheets: true });
```

```http
# HTTP Request
# Solo buscar en base de datos
GET /api/estadisticas/categorias/JUZGADO_FEDERAL/202310

# Buscar en base de datos y luego en Google Sheets si no hay resultados
GET /api/estadisticas/categorias/JUZGADO_FEDERAL/202310?buscarEnGoogleSheets=true
```
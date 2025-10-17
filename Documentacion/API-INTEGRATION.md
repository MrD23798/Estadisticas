# Integración Frontend-Backend API

## Resumen del Cambio

Este documento describe la migración del frontend desde el uso de archivos CSV locales a consumir datos directamente desde la API del backend. Esta migración permite tener datos actualizados en tiempo real y elimina la necesidad de actualizar manualmente los archivos CSV.

## Arquitectura

La arquitectura de integración sigue el patrón de capa de servicio:

```
Frontend
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Hooks    │────▶│  Servicios │────▶│API Cliente │────▶ Backend API
│ (React)    │     │ (lógica)   │     │(axios)     │
└────────────┘     └────────────┘     └────────────┘
```

## Componentes Principales

### 1. API Client (`apiClient.ts`)

Clase singleton que encapsula toda la comunicación HTTP con el backend:

- Métodos HTTP genéricos (GET, POST, PUT, DELETE)
- Endpoints específicos para cada operación
- Interceptores para logging y manejo de errores
- Health check y diagnóstico

### 2. API Service (`apiService.ts`)

Servicio que implementa la lógica de negocio:

- Mantiene la misma interfaz que el antiguo CSV Service
- Traduce entre el formato de datos del frontend y el backend
- Maneja los errores de forma específica para cada operación
- Realiza transformaciones de datos necesarias

### 3. React Hooks (`useStatistics.ts`)

Hook que gestiona el estado de la aplicación:

- Obtiene datos de los servicios
- Maneja el estado de carga y errores
- Proporciona métodos para generar estadísticas
- Mantiene compatibilidad con el código existente

### 4. Componente ApiStatus

Nuevo componente que muestra el estado de conexión con el API:

- Indicador visual (verde/rojo/amarillo) 
- Mensajes informativos
- Detalles expandibles sobre estado del backend
- Actualización periódica

## Endpoints API Utilizados

| Función | Endpoint | Método | Descripción |
|---------|----------|--------|-------------|
| Health Check | `/health` | GET | Verifica disponibilidad del API |
| Períodos | `/api/estadisticas/periodos` | GET | Lista períodos disponibles |
| Dependencias | `/api/estadisticas/dependencias` | GET | Lista dependencias disponibles |
| Categorías | `/api/estadisticas/categorias/:dependencia/:periodo` | GET | Estadísticas por dependencia |
| Comparación | `/api/estadisticas/comparar` | POST | Comparación entre dependencias |
| Evolución | `/api/estadisticas/evolucion` | POST | Evolución temporal de métricas |

## Flujo de Datos

1. Al iniciar, el frontend verifica la disponibilidad de la API mediante health check
2. Se cargan los períodos disponibles desde el endpoint `/api/estadisticas/periodos`
3. Se cargan las dependencias disponibles desde `/api/estadisticas/dependencias`
4. Al generar estadísticas, se llama al endpoint correspondiente con los filtros seleccionados
5. Los datos recibidos se transforman al formato esperado por los componentes de visualización

## Manejo de Errores

- Verificación de disponibilidad de API al inicio
- Indicador visual de estado de conexión
- Mensajes de error específicos por operación
- Fallback a datos por defecto cuando la API no está disponible
- Mensajes informativos en consola para depuración

## Mejoras Futuras

- Implementar caché local para reducir llamadas al API
- Añadir soporte para modo offline usando IndexedDB
- Implementar paginación para grandes conjuntos de datos
- Añadir sistema de notificaciones para errores críticos
- Autenticación y autorización

## Referencias

- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
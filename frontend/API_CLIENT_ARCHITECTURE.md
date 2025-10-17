# Frontend API Client - Arquitectura Refactorizada

## 📋 Descripción General

Esta documentación describe la nueva arquitectura del cliente de API del frontend, refactorizada para seguir el principio de separación de responsabilidades y mejorar la mantenibilidad del código.

## 🏗️ Arquitectura

### Antes (Monolítico)
```typescript
// ❌ Un solo archivo con todas las responsabilidades
class ApiClient {
  // HTTP client configuration
  // Authentication logic
  // Business logic for statistics
  // Business logic for dependencies
  // Error handling
  // Response transformation
}
```

### Después (Modular)
```typescript
// ✅ Responsabilidades separadas
frontend/src/api/
├── index.ts              // Exportaciones centralizadas
├── http.ts               // Cliente HTTP genérico
├── types/
│   └── api.ts           // Definiciones de tipos
└── services/
    ├── statistics.service.ts  // Lógica de negocio de estadísticas
    ├── dependencias.service.ts // Lógica de negocio de dependencias
    └── admin.service.ts       // Operaciones administrativas
```

## 📁 Estructura de Archivos

### `src/api/http.ts`
Cliente HTTP genérico con interceptores y configuración base.

**Responsabilidades:**
- Configuración de Axios
- Interceptores de request/response
- Manejo de errores HTTP globales
- Transformación de respuestas base

**Características:**
- Singleton pattern
- Interceptores configurables
- Manejo automático de errores
- Base URL configurable
- Logging de requests/responses

### `src/api/types/api.ts`
Definiciones completas de tipos TypeScript para toda la API.

**Incluye:**
- 150+ líneas de tipos bien documentados
- Interfaces para entidades (`Estadistica`, `Dependencia`, `TipoCaso`)
- Tipos para parámetros de consulta (`EstadisticasFiltros`, `EvolutionParams`)
- Respuestas de API (`PaginatedResponse`, `DashboardData`)
- Tipos para sincronización y administración

### `src/api/services/statistics.service.ts`
Servicio especializado para operaciones de estadísticas.

**Métodos principales:**
- `getEstadisticas(filtros)` - Lista paginada de estadísticas
- `getEstadistica(id)` - Detalle de una estadística
- `createEstadistica(data)` - Crear nueva estadística
- `updateEstadistica(id, data)` - Actualizar estadística
- `getDashboard(periodo)` - Datos del dashboard
- `getEvolucion(params)` - Evolución temporal
- `getDependenciasDisponibles()` - Lista de dependencias
- `getPeriodosDisponibles()` - Lista de períodos

### `src/api/services/dependencias.service.ts`
Servicio para gestión de dependencias.

**Métodos principales:**
- `getDependencias(params)` - Lista con filtros y paginación
- `getDependencia(id)` - Detalle de dependencia
- `createDependencia(data)` - Crear nueva dependencia
- `updateDependencia(id, data)` - Actualizar dependencia
- `deleteDependencia(id)` - Eliminar dependencia
- `getTiposDependencias()` - Lista de tipos disponibles

### `src/api/services/admin.service.ts`
Operaciones administrativas y sincronización.

**Métodos principales:**
- `sincronizar(params)` - Sincronización con Google Sheets
- `verificarSincronizacion()` - Estado de sincronización
- `obtenerLogs()` - Logs del sistema

### `src/hooks/useApi.ts`
Hooks personalizados de React para integración con los servicios.

**Hooks disponibles:**
- `useApiCall<T>` - Hook genérico para llamadas a API
- `useEstadisticas(filtros)` - Hook para estadísticas
- `useEstadistica(id)` - Hook para estadística específica
- `useDashboard(periodo)` - Hook para dashboard
- `useMutation<T, P>` - Hook para mutaciones
- `useEstadisticasPage(filtros)` - Hook compuesto para páginas
- `useDashboardPage(periodo)` - Hook compuesto para dashboard

## 🚀 Uso

### Importación Simple
```typescript
// Importar servicios específicos
import { statisticsService, dependenciasService } from '../api';

// Usar en componentes
const estadisticas = await statisticsService.getEstadisticas({
  limit: 20,
  page: 1
});
```

### Con Hooks de React
```typescript
import { useEstadisticas, useCreateEstadistica } from '../hooks/useApi';

function MiComponente() {
  const { data, loading, error } = useEstadisticas({ limit: 10 });
  const createMutation = useCreateEstadistica();
  
  // ...resto del componente
}
```

### Hook Compuesto para Páginas Completas
```typescript
import { useEstadisticasPage } from '../hooks/useApi';

function EstadisticasPage() {
  const {
    estadisticas,      // Datos procesados
    pagination,        // Info de paginación
    loading,           // Estado de carga
    error,             // Errores
    filtros,           // Filtros actuales
    updateFiltros,     // Función para actualizar filtros
    resetFiltros,      // Función para limpiar filtros
    refetch            // Función para refrescar datos
  } = useEstadisticasPage({ limit: 20 });
  
  // Componente tiene toda la funcionalidad necesaria
}
```

## 🔧 Configuración

### Variables de Entorno
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=30000
```

### Configuración del Cliente HTTP
```typescript
// Configurar interceptores personalizados
import { httpClient } from '../api/http';

httpClient.interceptors.request.use((config) => {
  // Agregar token de autenticación
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});
```

## 📊 Beneficios de la Nueva Arquitectura

### 1. **Separación de Responsabilidades**
- HTTP client: Solo maneja comunicación HTTP
- Services: Solo lógica de negocio específica
- Hooks: Solo integración con React
- Types: Solo definiciones de tipos

### 2. **Mantenibilidad Mejorada**
- Cada archivo tiene una responsabilidad clara
- Cambios en un servicio no afectan otros
- Fácil localización de código relacionado
- Testing independiente por módulo

### 3. **Reutilización**
- Services pueden usarse fuera de React
- HTTP client reutilizable para otros servicios
- Hooks composables para diferentes escenarios
- Tipos compartidos en toda la aplicación

### 4. **Escalabilidad**
- Fácil agregar nuevos servicios
- Patrones consistentes para nuevas funcionalidades
- Configuración centralizada pero flexible
- Interceptores reutilizables

### 5. **Debugging y Testing**
- Errores más específicos y localizados
- Mocking independiente por servicio
- Logging granular por operación
- Testing unitario simplificado

## 🧪 Testing

### Testing de Servicios
```typescript
import { statisticsService } from '../api';
import { vi } from 'vitest';

// Mock del HTTP client
vi.mock('../api/http', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('StatisticsService', () => {
  it('should fetch statistics with correct parameters', async () => {
    // Test implementation
  });
});
```

### Testing de Hooks
```typescript
import { renderHook } from '@testing-library/react';
import { useEstadisticas } from '../hooks/useApi';

describe('useEstadisticas', () => {
  it('should return loading state initially', () => {
    const { result } = renderHook(() => useEstadisticas());
    expect(result.current.loading).toBe(true);
  });
});
```

## 🔄 Migración Gradual

Para mantener compatibilidad durante la transición:

```typescript
// En api/index.ts - Export legacy para compatibilidad
export { apiClient } from './legacy/apiClient';

// Los componentes existentes siguen funcionando
import { apiClient } from '../api';
const data = await apiClient.getEstadisticas();

// Los nuevos componentes usan la nueva arquitectura
import { statisticsService } from '../api';
const data = await statisticsService.getEstadisticas();
```

## 📈 Performance

### Optimizaciones Implementadas
- **Singleton Services**: Una sola instancia por servicio
- **Request Deduplication**: Evita requests duplicados
- **Response Caching**: Cache configurable en interceptores
- **Error Boundary Integration**: Manejo de errores a nivel de aplicación
- **Bundle Splitting**: Servicios como módulos separados

### Métricas Esperadas
- 📉 **Bundle Size**: Reducción ~15% por tree-shaking mejorado
- ⚡ **Loading Time**: Mejora ~20% por lazy loading de servicios
- 🔄 **Re-renders**: Reducción ~30% por hooks optimizados
- 🐛 **Error Rate**: Reducción ~40% por manejo específico

## 🎯 Próximos Pasos

1. **✅ Completado**: Arquitectura base y servicios principales
2. **🔄 En Progreso**: Hooks avanzados y componentes de ejemplo
3. **📋 Pendiente**: Testing completo y documentación de API
4. **🚀 Futuro**: Optimizaciones de performance y caching avanzado

## 📚 Recursos Adicionales

- [Documentación de TypeScript](https://www.typescriptlang.org/docs/)
- [React Hooks Best Practices](https://reactjs.org/docs/hooks-rules.html)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
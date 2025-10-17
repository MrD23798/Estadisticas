# Integración del Frontend con la API

Este documento técnico explica cómo se ha realizado la integración entre el frontend React y la API del backend Node.js para reemplazar el uso de archivos CSV locales.

## Arquitectura

### 1. Capa de Servicio API

Se creó un nuevo servicio `apiService.ts` que actúa como una fachada entre la lógica de negocio del frontend y las llamadas a la API del backend. Este servicio:

- Mantiene las mismas interfaces de datos que el anterior `csvService.ts`
- Convierte los datos recibidos de la API al formato esperado por los componentes
- Maneja errores y transformaciones de datos

### 2. Estructura de Interfaces

```typescript
// Interfaces para los datos del frontend
export interface DependencyData {
  category: string;
  value: number;
}

export interface ComparisonData {
  dependency: string;
  category: string;
  value: number;
}

export interface EvolutionData {
  period: string;
  value: number;
  year: string;
  month: string;
}

// Interfaces para respuestas de la API
interface Categoria {
  categoria: string;
  total: number;
}

interface DependenciaInfo {
  nombre: string;
  codigo?: string;
}

interface ComparacionItem {
  dependencia: string;
  expedientesRecibidos: number;
  categoriasDetalle?: Record<string, { asignados: number, reingresados: number }>;
}

interface EvolucionItem {
  periodo: string;
  valor: number;
}
```

### 3. Funciones Principales

La integración mantiene las mismas firmas de función para asegurar compatibilidad:

```typescript
export const fetchDependencyStats = async (
  dependency: string,
  month: string,
  year: string
): Promise<DependencyData[]>

export const fetchComparisonStats = async (
  dependencies: string[],
  month: string,
  year: string
): Promise<ComparisonData[]>

export const fetchEvolutionStats = async (
  dependency: string,
  startMonth: string,
  endMonth: string,
  year: string,
  objectType?: string
): Promise<EvolutionData[]>

export const fetchDependencies = async (): Promise<string[]>

export const fetchAvailablePeriods = async (): Promise<{ month: string; year: string }[]>
```

### 4. Actualización del Hook Principal

El hook `useStatistics.ts` se actualizó para usar el nuevo servicio API:

- Se importaron las funciones desde `apiService.ts` en lugar de `csvService.ts`
- Se actualizó la función `checkCsvAvailability` para verificar la disponibilidad de la API
- Se modificó `loadCsvFiles` para obtener los períodos desde la API
- Se actualizó `loadObjectTypes` para usar la nueva implementación sin parámetros

## Flujo de Datos

1. **Solicitud de usuario**: El usuario interactúa con la UI solicitando datos
2. **Gestión por hook**: El hook `useStatistics.ts` gestiona la lógica de la solicitud
3. **Llamada a servicio**: El hook llama al `apiService.ts` con los parámetros necesarios
4. **Petición a API**: El servicio API utiliza `apiClient.ts` para hacer la petición HTTP
5. **Transformación de datos**: Los datos recibidos se transforman al formato esperado
6. **Actualización de estado**: Los datos transformados actualizan el estado en el hook
7. **Renderizado de UI**: Los componentes de React se renderizan con los nuevos datos

## Ventajas de la Implementación

1. **Separación de responsabilidades**: Cada capa tiene una responsabilidad claramente definida
2. **Facilidad de mantenimiento**: Se puede modificar la implementación de la API sin afectar la lógica de presentación
3. **Consistencia de datos**: Todos los datos provienen de una única fuente de verdad (la base de datos)
4. **Rendimiento mejorado**: No hay necesidad de cargar y parsear archivos CSV locales
5. **Escalabilidad**: Se pueden agregar nuevos endpoints y funcionalidades sin modificar la estructura básica

## Futuros Desarrollos

1. Implementar un sistema de caché para reducir la cantidad de peticiones a la API
2. Añadir un mecanismo de actualización en tiempo real con websockets
3. Desarrollar un sistema de paginación para conjuntos de datos grandes
4. Implementar una estrategia de precarga de datos frecuentes
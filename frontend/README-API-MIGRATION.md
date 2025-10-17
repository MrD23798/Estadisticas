# Migración de Datos CSV a API

Este documento describe los cambios realizados para migrar el frontend de la aplicación de estadísticas de usar archivos CSV locales a consumir datos desde la API del backend.

## Cambios Principales

1. **Nuevo Servicio API**
   - Creado `apiService.ts` que reemplaza a `csvService.ts`
   - Implementa las mismas funciones pero usando el cliente API en lugar de archivos CSV locales
   - Mantiene la misma estructura de interfaces (DependencyData, ComparisonData, EvolutionData)

2. **Actualización de Hook de Estadísticas**
   - Modificado `useStatistics.ts` para usar el nuevo servicio API
   - Reemplazada verificación de disponibilidad de CSV por verificación de API
   - Actualizada carga de períodos para obtenerlos desde la API

3. **Actualización de Referencias**
   - Actualizadas las importaciones en componentes de gráficos y definiciones de tipos
   - Mantenida la misma estructura de datos para asegurar compatibilidad con los componentes existentes

## Ventajas de la Migración

- **Datos en tiempo real**: Los datos ahora se obtienen directamente del backend en lugar de archivos estáticos
- **Menor tamaño de aplicación**: Ya no es necesario incluir archivos CSV en el directorio público
- **Mayor consistencia**: Los datos mostrados en el frontend son los mismos que están almacenados en la base de datos
- **Mejor rendimiento**: Reducción en el tamaño de la aplicación y en el procesamiento del cliente

## Funcionamiento

1. El frontend ahora obtiene los datos mediante llamadas API al backend
2. Las funciones del hook `useStatistics` mantienen la misma firma para asegurar compatibilidad
3. La estructura de datos (interfaces) se mantiene igual para que los componentes existentes funcionen sin cambios
4. Las URL de API se configuran mediante variables de entorno en el archivo `.env`

## Próximos Pasos

1. Eliminar archivos CSV del directorio `public/data` una vez que se confirme que la migración funciona correctamente
2. Implementar manejo de errores más robusto para casos de fallo de API
3. Agregar cacheo de datos para mejorar rendimiento y funcionamiento offline
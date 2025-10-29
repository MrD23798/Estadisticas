import { trpc } from '../../trpc/client';

// 🧠 Hook para estadísticas de comparación usando React Query
export const useComparisonStatistics = () => {
  // Query para obtener dependencias disponibles (compartido)
  const {
    data: dependenciasResp,
    isLoading: loadingDependencias,
    error: errorDependencias,
  } = trpc.estadisticas.getDependencias.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const dependencias = dependenciasResp?.dependencias ?? [];

  // Query para obtener períodos disponibles (compartido)
  const {
    data: periodosResp,
    isLoading: loadingPeriodos,
    error: errorPeriodos,
  } = trpc.estadisticas.getPeriodos.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const periodos = periodosResp?.periodos ?? [];

  // Función para comparar dependencias
  const useComparacion = (
    dependencias: string[],
    periodo: string,
    metricas: string[]
  ) => {
    return trpc.estadisticas.compararDependencias.useQuery(
      { dependencias, periodo, metricas, buscarEnGoogleSheets: true },
      {
        enabled: dependencias.length > 0 && !!periodo && metricas.length > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      }
    );
  };

  // Función para obtener top dependencias
  const useTopDependencias = (
    periodo: string,
    metrica: string,
    limite = 10,
    orden: 'asc' | 'desc' = 'desc'
  ) => {
    return trpc.estadisticas.getTopDependencias.useQuery(
      { periodo, metrica: metrica as 'existentes' | 'recibidos' | 'reingresados', limite, orden },
      {
        enabled: !!periodo && !!metrica,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      }
    );
  };

  return {
    // Datos base
    dependencias,
    periodos,
    loadingDependencias,
    loadingPeriodos,
    errorDependencias,
    errorPeriodos,
    
    // Hooks para consultas específicas
    useComparacion,
    useTopDependencias,
  };
};
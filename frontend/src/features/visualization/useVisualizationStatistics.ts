import { useQuery } from '@tanstack/react-query';
import { trpc } from '../../trpc/client';

// 🧠 Hook para estadísticas de visualización usando React Query
export const useVisualizationStatistics = () => {
  // Query para obtener dependencias disponibles
  const {
    data: dependenciasResp,
    isLoading: loadingDependencias,
    error: errorDependencias,
  } = trpc.estadisticas.getDependencias.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const dependencias = dependenciasResp?.dependencias ?? [];

  // Query para obtener períodos disponibles
  const {
    data: periodosResp,
    isLoading: loadingPeriodos,
    error: errorPeriodos,
  } = trpc.estadisticas.getPeriodos.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const periodos = periodosResp?.periodos ?? [];

  // Función para obtener estadísticas por dependencia
  const useEstadisticasByDependencia = (
    dependencia: string,
    options?: {
      periodo?: string;
      incluirHistorial?: boolean;
    }
  ) => {
    return trpc.estadisticas.getEstadisticas.useQuery(
      { dependencia, periodo: options?.periodo, incluirHistorial: options?.incluirHistorial ?? false },
      {
        enabled: !!dependencia,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      }
    );
  };

  // Función para obtener categorías
  const useCategorias = (dependencia: string, periodo: string, topCategorias?: number) => {
    return trpc.estadisticas.getCategorias?.useQuery
      ? trpc.estadisticas.getCategorias.useQuery(
          { dependencia, periodo, topCategorias, buscarEnGoogleSheets: true },
          {
            enabled: !!dependencia && !!periodo,
            staleTime: 2 * 60 * 1000,
            gcTime: 5 * 60 * 1000,
          }
        )
      : ({ data: undefined, isLoading: false, error: undefined } as any);
  };

  // Función para obtener dashboard
  const useDashboard = (periodo: string, compararConAnterior = true) => {
    return trpc.estadisticas.getDashboard.useQuery(
      { periodo, compararConAnterior },
      {
        enabled: !!periodo,
        staleTime: 1 * 60 * 1000,
        gcTime: 3 * 60 * 1000,
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
    useEstadisticasByDependencia,
    useCategorias,
    useDashboard,
  };
};
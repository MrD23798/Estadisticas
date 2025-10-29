import { trpc } from '../../trpc/client';

// 🧠 Hook para estadísticas de evolución temporal usando React Query
export const useEvolutionStatistics = () => {
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

  // Función para obtener evolución temporal
  const useEvolucion = (
    dependencias: string[] | undefined,
    metrica: 'existentes' | 'recibidos' | 'reingresados',
    periodoInicio: string,
    periodoFin: string,
    agruparPor?: string
  ) => {
    return trpc.estadisticas.getEvolucion.useQuery(
      { dependencias, metrica, periodoInicio, periodoFin, agruparPor, buscarEnGoogleSheets: true },
      {
        enabled: !!metrica && !!periodoInicio && !!periodoFin,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      }
    );
  };

  // Función para obtener timeline data
  const useTimelineData = (
    dependencias: string[] | undefined,
    metrica: 'existentes' | 'recibidos' | 'reingresados',
    periodoInicio: string,
    periodoFin: string,
    agruparPor?: string
  ) => {
    return trpc.estadisticas.getTimeline.useQuery(
      { dependencias, metrica, periodoInicio, periodoFin, agruparPor },
      {
        enabled: !!metrica && !!periodoInicio && !!periodoFin,
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
    useEvolucion,
    useTimelineData,
  };
};
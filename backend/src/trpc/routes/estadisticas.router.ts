// src/trpc/routes/estadisticas.router.ts
import { publicProcedure, router } from '../../trpc/trpc';
import {
  ConsultaIndividualSchema,
  ConsultaComparativaSchema,
  EvolucionTemporalSchema,
  TopDependenciasSchema,
  DashboardResumenSchema,
  BusquedaSchema,
  EvolucionDependenciaSchema,
  ComparativaDependenciasSchema,
  ReporteIndividualSchema,
} from '../../schemas/estadisticas.schema';
import { estadisticasService } from '../../services/estadisticas.service';

export const estadisticasRouter = router({
  // GET /api/statistics -> estadísticas por dependencia
  getEstadisticas: publicProcedure
    .input(ConsultaIndividualSchema)
    .query(async ({ input }) => {
      return estadisticasService.getByDependencia(input);
    }),

  // GET /api/dependencies -> dependencias disponibles
  getDependencias: publicProcedure
    .query(async () => {
      return estadisticasService.getDependenciasDisponibles();
    }),

  // GET /api/case-types -> objetos de juicio disponibles
  getObjetosJuicio: publicProcedure
    .query(async () => {
      return estadisticasService.getObjetosJuicioDisponibles();
    }),

  // Comparativa de dependencias para un período
  compararDependencias: publicProcedure
    .input(ConsultaComparativaSchema)
    .mutation(async ({ input }) => {
      return estadisticasService.compararDependencias(input);
    }),

  // Evolución temporal (agregada)
  getEvolucion: publicProcedure
    .input(EvolucionTemporalSchema)
    .query(async ({ input }) => {
      return estadisticasService.getEvolucion(input);
    }),

  // Top dependencias por métrica
  getTopDependencias: publicProcedure
    .input(TopDependenciasSchema)
    .query(async ({ input }) => {
      return estadisticasService.getTopDependencias(input);
    }),

  // Timeline de evolución (alias del servicio)
  getTimeline: publicProcedure
    .input(EvolucionTemporalSchema)
    .query(async ({ input }) => {
      return estadisticasService.getTimelineData(input);
    }),

  // Dashboard resumen
  getDashboard: publicProcedure
    .input(DashboardResumenSchema)
    .query(async ({ input }) => {
      return estadisticasService.getDashboard(input);
    }),

  // Búsqueda
  buscar: publicProcedure
    .input(BusquedaSchema)
    .query(async ({ input }) => {
      return estadisticasService.buscar(input);
    }),

  // Períodos disponibles
  getPeriodos: publicProcedure
    .query(async () => {
      return estadisticasService.getPeriodosDisponibles();
    }),

  // Endpoints orientados al frontend (por IDs y anio/mes)
  evolucionDependencia: publicProcedure
    .input(EvolucionDependenciaSchema)
    .query(async ({ input }) => {
      return estadisticasService.getEvolucionDependencia(input.dependenciaId);
    }),

  comparativaDependencias: publicProcedure
    .input(ComparativaDependenciasSchema)
    .query(async ({ input }) => {
      return estadisticasService.getComparativaDependencias(input.dependenciaIds, input.anio, input.mes);
    }),

  reporteIndividualFrontend: publicProcedure
    .input(ReporteIndividualSchema)
    .query(async ({ input }) => {
      return estadisticasService.getReporteIndividualFrontend(input.dependenciaId, input.anio, input.mes);
    }),

  // Reporte individual completo con totales y desglose
  reporteIndividual: publicProcedure
    .input(ReporteIndividualSchema)
    .query(async ({ input }) => {
      return estadisticasService.getReporteIndividualCompleto(input.dependenciaId, input.anio, input.mes);
    }),
});
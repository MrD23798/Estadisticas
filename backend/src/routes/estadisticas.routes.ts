import { FastifyInstance } from 'fastify';
import { estadisticasController } from '../controllers/estadisticas.controller';
import {
  ConsultaIndividualSchema,
  ConsultaComparativaSchema,
  EvolucionTemporalSchema,
  TopDependenciasSchema,
  ConsultaCategoriasSchema,
  DashboardResumenSchema,
  SincronizacionSchema,
  BusquedaSchema
} from '../schemas/estadisticas.schema';

// 🛣️ Rutas de la API con validación de esquemas Zod
export async function estadisticasRoutes(fastify: FastifyInstance) {
  // Rutas para estadísticas individuales
  fastify.get('/estadisticas/dependencia/:nombre', {
    schema: {
      params: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1 }
        },
        required: ['nombre']
      }
    }
  }, estadisticasController.getByDependencia);

  fastify.get('/estadisticas/categorias/:dependencia/:periodo', {
    schema: {
      params: {
        type: 'object',
        properties: {
          dependencia: { type: 'string', minLength: 1 },
          periodo: { type: 'string', pattern: '^\\d{6}$' }
        },
        required: ['dependencia', 'periodo']
      }
    }
  }, estadisticasController.getCategorias);
  
  // Rutas para comparativas
  fastify.post('/estadisticas/comparar', {
    // Temporalmente sin validación de esquema
  }, estadisticasController.compararDependencias);

  fastify.post('/estadisticas/evolucion', {
    // Temporalmente sin validación de esquema
  }, estadisticasController.getEvolucion);

  fastify.get('/estadisticas/top/:periodo/:metrica', {
    schema: {
      params: {
        type: 'object',
        properties: {
          periodo: { type: 'string', pattern: '^\\d{6}$' },
          metrica: { type: 'string', enum: ['existentes', 'recibidos', 'reingresados'] }
        },
        required: ['periodo', 'metrica']
      }
    }
  }, estadisticasController.getTopDependencias);
  
  // Rutas para gráficos y dashboard
  fastify.post('/estadisticas/timeline', {
    // Temporalmente sin validación de esquema
  }, estadisticasController.getTimelineData);

  fastify.get('/estadisticas/dashboard/:periodo', {
    schema: {
      params: {
        type: 'object',
        properties: {
          periodo: { type: 'string', pattern: '^\\d{6}$' }
        },
        required: ['periodo']
      }
    }
  }, estadisticasController.getDashboard);
  
  // Rutas de administración
  fastify.post('/estadisticas/sync', {
    // Temporalmente sin validación de esquema
  }, estadisticasController.sincronizar);

  fastify.get('/estadisticas/periodos', estadisticasController.getPeriodosDisponibles);
  fastify.get('/estadisticas/dependencias', estadisticasController.getDependenciasDisponibles);
  fastify.get('/estadisticas/objetos-juicio', estadisticasController.getObjetosJuicioDisponibles);
  
  // Ruta de búsqueda
  fastify.post('/estadisticas/buscar', {
    // Temporalmente sin validación de esquema
  }, estadisticasController.buscar);
}
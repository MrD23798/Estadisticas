import { FastifyRequest, FastifyReply } from 'fastify';
import { estadisticasService } from '../services/estadisticas.service';
import {
  ConsultaIndividualDTO,
  ConsultaComparativaDTO,
  EvolucionTemporalDTO,
  TopDependenciasDTO,
  ConsultaCategoriasDTO,
  DashboardResumenDTO,
  SincronizacionDTO,
  BusquedaDTO
} from '../schemas/estadisticas.schema';

export const estadisticasController = {
  // Obtener estadísticas por dependencia
  async getByDependencia(request: FastifyRequest<{
    Params: { nombre: string };
    Querystring: { periodo?: string; incluirHistorial?: boolean };
  }>, reply: FastifyReply) {
    try {
      const { nombre } = request.params;
      const { periodo, incluirHistorial } = request.query;
      
      const resultado = await estadisticasService.getByDependencia({
        dependencia: decodeURIComponent(nombre),
        periodo,
        incluirHistorial: incluirHistorial || false,
      });
      
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo estadísticas por dependencia',
        message: (error as Error).message,
      });
    }
  },

  // Obtener categorías de una dependencia
  async getCategorias(request: FastifyRequest<{
    Params: { dependencia: string; periodo: string };
    Querystring: { topCategorias?: number; buscarEnGoogleSheets?: boolean };
  }>, reply: FastifyReply) {
    try {
      const { dependencia, periodo } = request.params;
      const { topCategorias = 10, buscarEnGoogleSheets = true } = request.query; // Por defecto, buscar en Google Sheets
      
      request.log.info(`Buscando datos para ${dependencia} en período ${periodo} (buscarEnGoogleSheets: ${buscarEnGoogleSheets})`);
      
      const resultado = await estadisticasService.getCategorias({
        dependencia: decodeURIComponent(dependencia),
        periodo,
        topCategorias,
        buscarEnGoogleSheets,
      });
      
      // Sólo devolvemos error si no se encontraron datos y ya intentamos con Google Sheets
      if (!resultado.categorias || resultado.categorias.length === 0) {
        request.log.info(`No se encontraron datos para ${dependencia} en período ${periodo}. Origen: ${resultado.origen}`);
        
        // Si ya se buscó en ambas fuentes y no hay datos, retornamos un error 404
        if (buscarEnGoogleSheets || resultado.origen === 'no_encontrado') {
          return reply.code(404).send({
            error: 'No se encontraron datos',
            message: `No existen datos para la dependencia ${dependencia} en el período ${periodo}`,
            nota: resultado.origen === 'no_encontrado' ? 
                  'No se encontraron datos en ninguna fuente disponible.' :
                  'Los datos no se encontraron en la base de datos. Use buscarEnGoogleSheets=true para intentar obtenerlos desde Google Sheets.'
          });
        }
      }
      
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo categorías',
        message: (error as Error).message,
      });
    }
  },

  // Comparar múltiples dependencias
  async compararDependencias(request: FastifyRequest<{
    Body: {
      dependencias: string[];
      periodo: string;
      metricas: ('reingresados' | 'existentes' | 'recibidos' | 'categorias')[];
      buscarEnGoogleSheets?: boolean;
    };
  }>, reply: FastifyReply) {
    try {
      // Por defecto, buscar en Google Sheets si no se especifica lo contrario
      const body = {
        ...request.body,
        buscarEnGoogleSheets: request.body.buscarEnGoogleSheets !== false
      };
      
      request.log.info(`Comparando dependencias para período ${body.periodo} (buscarEnGoogleSheets: ${body.buscarEnGoogleSheets})`);
      const resultado = await estadisticasService.compararDependencias(body);
      
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error en comparación de dependencias',
        message: (error as Error).message,
      });
    }
  },

  // Obtener evolución temporal
  async getEvolucion(request: FastifyRequest<{
    Body: {
      dependencias?: string[];
      metrica: 'reingresados' | 'existentes' | 'recibidos';
      periodoInicio: string;
      periodoFin: string;
      agruparPor: 'mes' | 'trimestre' | 'año';
      buscarEnGoogleSheets?: boolean;
    };
  }>, reply: FastifyReply) {
    try {
      // Por defecto, buscar en Google Sheets si no se especifica lo contrario
      const body = {
        ...request.body,
        buscarEnGoogleSheets: request.body.buscarEnGoogleSheets !== false
      };
      
      request.log.info(`Obteniendo evolución temporal desde ${body.periodoInicio} hasta ${body.periodoFin} (buscarEnGoogleSheets: ${body.buscarEnGoogleSheets})`);
      const resultado = await estadisticasService.getEvolucion(body);
      
      // Si no se encontraron resultados, enviar un mensaje más claro
      if (resultado.evolucion.length === 0) {
        request.log.warn(`No se encontraron datos de evolución para el período ${body.periodoInicio} a ${body.periodoFin}`);
        return reply.code(404).send({
          error: 'Datos no encontrados',
          message: `No se encontraron datos de evolución para el período ${body.periodoInicio} a ${body.periodoFin}`,
          dependencias: body.dependencias
        });
      }
      
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo evolución temporal',
        message: (error as Error).message,
      });
    }
  },

  // Obtener top dependencias
  async getTopDependencias(request: FastifyRequest<{
    Params: { periodo: string; metrica: string };
    Querystring: { limite?: number; orden?: string };
  }>, reply: FastifyReply) {
    try {
      const { periodo, metrica } = request.params;
      const { limite, orden } = request.query;
      
      const resultado = await estadisticasService.getTopDependencias({
        periodo,
        metrica: metrica as any,
        limite: limite || 10,
        orden: (orden as any) || 'desc',
      });
      
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo top dependencias',
        message: (error as Error).message,
      });
    }
  },

  // Obtener datos para timeline/gráficos
  async getTimelineData(request: FastifyRequest<{
    Body: {
      dependencias?: string[];
      metrica: 'reingresados' | 'existentes' | 'recibidos';
      periodoInicio: string;
      periodoFin: string;
      agruparPor: 'mes' | 'trimestre' | 'año';
      buscarEnGoogleSheets?: boolean;
    };
  }>, reply: FastifyReply) {
    try {
      // Asegurar que buscarEnGoogleSheets tenga un valor por defecto
      const body = {
        ...request.body,
        buscarEnGoogleSheets: request.body.buscarEnGoogleSheets !== false
      };
      const resultado = await estadisticasService.getTimelineData(body);
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo datos de timeline',
        message: (error as Error).message,
      });
    }
  },

  // Obtener datos del dashboard
  async getDashboard(request: FastifyRequest<{
    Params: { periodo: string };
    Querystring: { compararConAnterior?: boolean };
  }>, reply: FastifyReply) {
    try {
      const { periodo } = request.params;
      const { compararConAnterior } = request.query;
      
      const resultado = await estadisticasService.getDashboard({
        periodo,
        compararConAnterior: compararConAnterior !== false,
      });
      
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo datos del dashboard',
        message: (error as Error).message,
      });
    }
  },

  // Sincronizar datos desde Google Sheets
  async sincronizar(request: FastifyRequest<{
    Body: {
      sheetIds?: string[];
      forzar: boolean;
      eliminarExistentes: boolean;
    };
  }>, reply: FastifyReply) {
    try {
      console.log('--- SINCRONIZACIÓN RECIBIDA EN EL CONTROLADOR ---');
      request.log.info('--- SINCRONIZACIÓN RECIBIDA EN EL CONTROLADOR ---');
      
      const body = {
        forzar: request.body.forzar ?? false,
        eliminarExistentes: request.body.eliminarExistentes ?? false,
        sheetIds: request.body.sheetIds
      };
      const resultado = await estadisticasService.sincronizar(body);
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error en sincronización',
        message: (error as Error).message,
      });
    }
  },

  // Obtener períodos disponibles
  async getPeriodosDisponibles(request: FastifyRequest, reply: FastifyReply) {
    try {
      const resultado = await estadisticasService.getPeriodosDisponibles();
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo períodos disponibles',
        message: (error as Error).message,
      });
    }
  },

  // Obtener dependencias disponibles
  async getDependenciasDisponibles(request: FastifyRequest, reply: FastifyReply) {
    try {
      const resultado = await estadisticasService.getDependenciasDisponibles();
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo dependencias disponibles',
        message: (error as Error).message,
      });
    }
  },
  
  // Obtener objetos de juicio disponibles
  async getObjetosJuicioDisponibles(request: FastifyRequest, reply: FastifyReply) {
    try {
      const resultado = await estadisticasService.getObjetosJuicioDisponibles();
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo objetos de juicio disponibles',
        message: (error as Error).message,
      });
    }
  },

  // Buscar estadísticas
  async buscar(request: FastifyRequest<{
    Body: {
      termino: string;
      campos: ('periodo' | 'dependencia' | 'categorias')[];
      limite: number;
      offset: number;
    };
  }>, reply: FastifyReply) {
    try {
      const body = {
        termino: request.body.termino,
        campos: request.body.campos ?? ['dependencia'],
        limite: request.body.limite ?? 50,
        offset: request.body.offset ?? 0
      };
      const resultado = await estadisticasService.buscar(body);
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error en búsqueda',
        message: (error as Error).message,
      });
    }
  },

  // ===============================
  // NUEVOS ENDPOINTS PARA FRONTEND
  // ===============================

  // Obtener evolución de una dependencia específica para el frontend
  async getEvolucionFrontend(request: FastifyRequest<{
    Querystring: { dependenciaId: string };
  }>, reply: FastifyReply) {
    try {
      const dependenciaId = parseInt(request.query.dependenciaId);
      
      if (isNaN(dependenciaId)) {
        return reply.code(400).send({
          error: 'Parámetro inválido',
          message: 'dependenciaId debe ser un número válido'
        });
      }

      const resultado = await estadisticasService.getEvolucionDependencia(dependenciaId);
      
      return reply.send({
        success: true,
        data: resultado,
        total: resultado.length
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo evolución',
        message: (error as Error).message,
      });
    }
  },

  // Obtener comparativa de múltiples dependencias para el frontend
  async getComparativaFrontend(request: FastifyRequest<{
    Querystring: { 
      dependenciaIds: string; 
      anio: string; 
      mes: string; 
    };
  }>, reply: FastifyReply) {
    try {
      const { dependenciaIds, anio, mes } = request.query;
      
      // Parsear dependenciaIds (puede ser "1,2,3" o similar)
      const ids = dependenciaIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const anioNum = parseInt(anio);
      const mesNum = parseInt(mes);
      
      if (ids.length === 0) {
        return reply.code(400).send({
          error: 'Parámetro inválido',
          message: 'dependenciaIds debe contener al menos un ID válido'
        });
      }
      
      if (isNaN(anioNum) || isNaN(mesNum)) {
        return reply.code(400).send({
          error: 'Parámetros inválidos',
          message: 'anio y mes deben ser números válidos'
        });
      }
      
      if (mesNum < 1 || mesNum > 12) {
        return reply.code(400).send({
          error: 'Mes inválido',
          message: 'mes debe estar entre 1 y 12'
        });
      }

      const resultado = await estadisticasService.getComparativaDependencias(ids, anioNum, mesNum);
      
      return reply.send({
        success: true,
        data: resultado,
        parametros: {
          dependenciaIds: ids,
          anio: anioNum,
          mes: mesNum,
          periodo: `${anioNum}${mesNum.toString().padStart(2, '0')}`
        },
        total: resultado.length
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo comparativa',
        message: (error as Error).message,
      });
    }
  },

  // Obtener reporte individual completo para el frontend
  async getReporteIndividualFrontend(request: FastifyRequest<{
    Querystring: { 
      dependenciaId: string; 
      anio: string; 
      mes: string; 
    };
  }>, reply: FastifyReply) {
    try {
      const { dependenciaId, anio, mes } = request.query;
      
      const depId = parseInt(dependenciaId);
      const anioNum = parseInt(anio);
      const mesNum = parseInt(mes);
      
      if (isNaN(depId) || isNaN(anioNum) || isNaN(mesNum)) {
        return reply.code(400).send({
          error: 'Parámetros inválidos',
          message: 'dependenciaId, anio y mes deben ser números válidos'
        });
      }
      
      if (mesNum < 1 || mesNum > 12) {
        return reply.code(400).send({
          error: 'Mes inválido',
          message: 'mes debe estar entre 1 y 12'
        });
      }

      const resultado = await estadisticasService.getReporteIndividualCompleto(depId, anioNum, mesNum);
      
      if (!resultado) {
        return reply.code(404).send({
          error: 'Datos no encontrados',
          message: `No se encontraron datos para la dependencia ${depId} en ${anioNum}-${mesNum.toString().padStart(2, '0')}`
        });
      }
      
      return reply.send({
        success: true,
        data: resultado,
        parametros: {
          dependenciaId: depId,
          anio: anioNum,
          mes: mesNum,
          periodo: `${anioNum}${mesNum.toString().padStart(2, '0')}`
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Error obteniendo reporte individual',
        message: (error as Error).message,
      });
    }
  },
};
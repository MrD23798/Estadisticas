// ===================================================================
// 🚧 RUTAS LEGACY - TEMPORALMENTE DESHABILITADAS
// ===================================================================
// Estas rutas están temporalmente comentadas durante la migración.
// Se reactivarán cuando los adapters entre servicios nuevos y legacy estén listos.

import { FastifyInstance } from 'fastify';

export async function legacyStatsRoutes(fastify: FastifyInstance) {
  // TODO: Reactivar rutas legacy cuando los adapters estén listos
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'Legacy routes temporarily disabled during migration',
      message: 'Use /api/v1 endpoints instead',
      timestamp: new Date().toISOString()
    };
  });

  // Placeholder para futuras rutas de compatibilidad
  fastify.get('/migration-status', async (request, reply) => {
    return {
      migrationComplete: false,
      availableEndpoints: [
        '/api/v1/estadisticas/dependencias',
        '/api/v1/estadisticas/dependencias/:dependencia',
        '/api/v1/estadisticas/resumen'
      ],
      legacyEndpoints: 'Coming soon...'
    };
  });
}
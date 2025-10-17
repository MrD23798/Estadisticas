// ===================================================================
// 🛣️ ROUTER PRINCIPAL - FASTIFY
// ===================================================================
// Este archivo consolida todas las rutas del backend

import { FastifyInstance } from 'fastify';
import { estadisticasRoutes } from './estadisticas.routes';
import { legacyStatsRoutes } from './legacy-stats.routes';
import { incrementalSyncRoutes } from './incremental-sync.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Registrar rutas principales (nuevas)
  await fastify.register(estadisticasRoutes, { prefix: '/api/v1' });
  
  // Registrar rutas de sincronización incremental
  await fastify.register(incrementalSyncRoutes, { prefix: '/api/v1' });
  
  // Registrar rutas legacy para compatibilidad
  await fastify.register(legacyStatsRoutes, { prefix: '/api/legacy' });
}

export type AppRouter = typeof registerRoutes;
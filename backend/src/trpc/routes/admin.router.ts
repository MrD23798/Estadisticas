// src/trpc/routers/admin.router.ts

import { publicProcedure, router } from '../../trpc/trpc';
import { z } from 'zod';
import { config } from '../../config';
import { estadisticasService } from '../../services/estadisticas.service';

export const adminRouter = router({
  /**
   * -------------------------------------------------------------------
   * REEMPLAZO DE: GET /api/admin/data-sources
   * -------------------------------------------------------------------
   * Obtiene las fuentes de datos y su estado (habilitado/deshabilitado).
   */
  getDataSources: publicProcedure
    .query(() => {
      // Lógica migrada directamente de admin.controller.ts
      const sources = [
        { name: 'Google Sheets', enabled: config.googleSheets.enabled },
        { name: 'Database', enabled: true },
      ];
      return sources;
    }),

  /**
   * -------------------------------------------------------------------
   * REEMPLAZO DE: POST /api/admin/run-sync
   * -------------------------------------------------------------------
   * Ejecuta manualmente la sincronización principal de estadísticas.
   * Reutiliza la lógica de `estadisticasService.sincronizar`.
   */
  runSync: publicProcedure
    .input(
      // Define el input esperado, que antes era 'req.body'
      // Zod se encarga de la validación
      z.object({
        force: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      // 'input' está totalmente tipado y validado
      // Lógica migrada de admin.controller.ts
      const resultado = await estadisticasService.sincronizar({
        forzar: input.force,
        eliminarExistentes: false, // Esto estaba hardcodeado
      });
      
      return {
        message: 'Sincronización completada',
        ...resultado,
      };
      // Nota: No necesitas try/catch, tRPC lo maneja
    }),
});
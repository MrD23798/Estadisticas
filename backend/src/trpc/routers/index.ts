// src/trpc/routers/index.ts
import { router } from '../../trpc/trpc';
import { adminRouter } from '../routes/admin.router';
import { estadisticasRouter } from '../routes/estadisticas.router';

export const appRouter = router({
  admin: adminRouter,
  estadisticas: estadisticasRouter,
});

export type AppRouter = typeof appRouter;



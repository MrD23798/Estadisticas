// src/trpc/context.ts
import { type CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export const createContext = ({ req, res }: CreateFastifyContextOptions) => {
  // Aquí podrías añadir info de autenticación si la tuvieras
  // const user = getUserFromRequest(req);
  // return { req, res, user };

  // Por ahora, un contexto simple es suficiente.
  return { req, res };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
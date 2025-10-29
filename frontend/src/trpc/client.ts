import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

// Si puedes compartir tipos del backend, importa AppRouter.
// De lo contrario, mantén 'any' temporalmente y luego lo tipamos.
// import type { AppRouter } from '../../../backend/src/trpc/routers';
type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient(baseUrl: string) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl.replace(/\/$/, '')}/trpc`,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: 'include' });
        },
      }),
    ],
  });
}

export function resolveApiBaseUrl() {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
}



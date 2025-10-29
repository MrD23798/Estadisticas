import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTrpcClient, resolveApiBaseUrl } from './trpc/client';
import App from './App.tsx';
import './index.css';

// 📡 Configurar React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1 * 60 * 1000, // 1 minuto por defecto
      gcTime: 5 * 60 * 1000, // 5 minutos por defecto
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Cliente tRPC
const trpcClient = createTrpcClient(resolveApiBaseUrl());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>
);

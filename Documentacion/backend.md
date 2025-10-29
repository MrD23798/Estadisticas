# Documentación del Backend

## 🔌 API Integration

### Estrategia de Conexión

1.  **Backend (Fastify + TypeORM + Servicios):** Actúa como el servidor principal. Expone una **API mixta**:
    * **API REST:** La implementación principal actual, usando `src/routes` y `src/controllers`.
    * **tRPC (Parcialmente Implementado):** Existe una estructura base en `src/routers`, pero **no está completamente integrada ni reemplaza a la API REST actualmente**. La migración completa a tRPC es una mejora futura potencial.
    El backend maneja toda la lógica de negocio, acceso a base de datos (MySQL), sincronización con Google Sheets y transformaciones de datos.
2.  **Frontend (React + Vite + Cliente API):** Actúa como el cliente. **NO** contiene lógica de negocio ni acceso directo a fuentes de datos. Su única responsabilidad es:
    * Mostrar la interfaz de usuario.
    * Recopilar las entradas del usuario (filtros, selecciones).
    * Realizar llamadas a la **API REST** del backend (a través del `apiClient`) para obtener los datos necesarios. *(La conexión tRPC existe pero no parece ser el método principal usado actualmente)*.
    * Renderizar los datos recibidos (usando D3, Three.js, etc.).

### Configuración de la Conexión

1.  **Backend (`.env`):** Define `PORT=3000`.
2.  **Frontend (`.env.local`):** Define `VITE_API_BASE_URL="http://localhost:3000/api"`. *(Si se usa tRPC, se necesitaría `VITE_TRPC_URL="http://localhost:3000/trpc"`)*.
3.  **CORS (Backend - `app.ts`):** **DEBE** configurar `@fastify/cors` con el `origin` del frontend (`http://localhost:5173`).

### Flujo de Datos Típico (Actual, vía REST)

1.  Usuario interactúa con Frontend.
2.  Hook (`useApi` o similar) llama al Backend (vía `apiClient`).
3.  Backend recibe petición (Ruta Fastify).
4.  Controller valida (Zod) y llama al Servicio (`estadisticas.service.ts`).
5.  Servicio consulta Base de Datos (TypeORM).
6.  Servicio transforma datos a JSON.
7.  Backend envía respuesta JSON.
8.  Hook recibe datos y actualiza estado.
9.  Componente React renderiza.

### Endpoints Principales (REST)

| Recurso       | Endpoint                                                | Método | Descripción                     |
| :------------ | :------------------------------------------------------ | :----- | :------------------------------ |
| Dashboard     | `/api/estadisticas/dashboard/:periodo`                  | GET    | Resumen del período             |
| Períodos      | `/api/estadisticas/periodos`                            | GET    | Lista períodos disponibles      |
| Dependencias  | `/api/estadisticas/dependencias`                        | GET    | Lista dependencias disponibles  |
| Objetos Juicio| `/api/estadisticas/objetos-juicio`                      | GET    | Lista tipos de caso             |
| Categorías    | `/api/estadisticas/categorias/:dependencia/:periodo`    | GET    | Estadísticas por tipo de caso   |
| Comparación   | `/api/estadisticas/comparar`                            | POST   | Comparación entre dependencias  |
| Evolución     | `/api/estadisticas/evolucion`                           | POST   | Evolución temporal de métricas  |
| Individual    | `/api/estadisticas/individual`                          | GET    | Reporte detallado individual    |
| Sincronización| `/api/admin/sync`                                       | POST   | Dispara sincronización completa |

---


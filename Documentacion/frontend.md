🚀 Arquitectura General

El frontend es una **Single Page Application (SPA)** construida con **React** y **Vite**, utilizando **TypeScript** para la seguridad de tipos y **Tailwind CSS** para el estilizado.

Su principal responsabilidad es la **presentación de datos** y la **interacción con el usuario**. **NO** contiene lógica de negocio compleja ni acceso directo a fuentes de datos como bases de datos o APIs externas (Google Sheets).

## 📊 Visualización de Datos

Se utilizan dos librerías principales para la creación de gráficos:

1.  **D3.js:** Para gráficos 2D interactivos y personalizados (barras, líneas, agrupados).
2.  **Three.js:** Para visualizaciones 3D (cubos, líneas de evolución en 3D).

Los componentes de gráficos (`src/components/charts/`) están diseñados para recibir datos ya procesados y listos para visualizar desde sus componentes padres.

## ⚙️ Estructura de Carpetas (`src/`)

* **`api/`:** Contiene **TODA** la lógica de comunicación con el backend.
    * `trpcClient.ts`: Configuración del cliente tRPC y React Query (si se usa tRPC).
    * *(Archivos obsoletos si se usa tRPC: `http.ts`, `apiClient.ts`, `services/`, `types/api.ts`)*.
* **`assets/`:** Imágenes y otros archivos estáticos.
* **`components/`:** Componentes React reutilizables, organizados por tipo:
    * `charts/`: Componentes de gráficos (D3, Three.js).
    * `layout/`: Estructura principal (Header, Dashboard).
    * `panels/`: Paneles principales de las vistas (Visualización, Comparación, Evolución).
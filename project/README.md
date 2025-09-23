# Página de Estadísticas para el Poder Judicial

Este proyecto es una aplicación web para visualizar estadísticas del Poder Judicial, permitiendo generar gráficos individuales y realizar comparativas entre diferentes dependencias.

## 🐳 Ejecutar con Docker (Recomendado)

### Desarrollo con Docker

Para ejecutar el proyecto en modo desarrollo con hot reload:

```bash
# Construir y ejecutar con docker-compose
docker-compose up app-dev

# O construir y ejecutar manualmente
docker build -f Dockerfile.dev -t estadisticas-dev .
docker run -p 5173:5173 -v "$(pwd):/app" -v /app/node_modules estadisticas-dev
```

La aplicación estará disponible en: http://localhost:5173

### Producción con Docker

Para ejecutar en modo producción:

```bash
# Usando docker-compose con perfil de producción
docker-compose --profile production up app-prod

# O construir y ejecutar manualmente
docker build -t estadisticas-prod .
docker run -p 80:80 estadisticas-prod
```

La aplicación estará disponible en: http://localhost

### Comandos útiles de Docker

```bash
# Ver logs del contenedor
docker-compose logs app-dev

# Ejecutar comandos dentro del contenedor
docker-compose exec app-dev npm install nueva-dependencia

# Limpiar imágenes y contenedores
docker-compose down --rmi all --volumes --remove-orphans
```

## 💻 Instalación Local (Alternativa)

## Pasos para crear esta página manualmente

### 1. Configuración inicial del proyecto

1. Crear un nuevo proyecto React con TypeScript usando Vite:
   ```bash
   npm create vite@latest estadisticas-poder-judicial -- --template react-ts
   cd estadisticas-poder-judicial
   ```

2. Instalar las dependencias necesarias:
   ```bash
   npm install
   npm install lucide-react
   npm install -D tailwindcss postcss autoprefixer
   ```

3. Inicializar Tailwind CSS:
   ```bash
   npx tailwindcss init -p
   ```

4. Configurar Tailwind CSS en `tailwind.config.js`:
   ```javascript
   /** @type {import('tailwindcss').Config} */
   export default {
     content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
     theme: {
       extend: {},
     },
     plugins: [],
   };
   ```

5. Configurar los estilos base en `src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### 2. Estructura del componente principal

1. Crear el estado inicial en `src/App.tsx`:
   ```typescript
   const [showVisualizationMenu, setShowVisualizationMenu] = useState(false);
   const [showComparisonMenu, setShowComparisonMenu] = useState(false);
   const [selectedDependency, setSelectedDependency] = useState('');
   const [selectedMonth, setSelectedMonth] = useState('');
   const [selectedYear, setSelectedYear] = useState('');
   const [comparisonDependencies, setComparisonDependencies] = useState<string[]>([]);
   const [comparisonMonth, setComparisonMonth] = useState('');
   const [comparisonYear, setComparisonYear] = useState('');
   const [showStats, setShowStats] = useState(false);
   const [showComparisonStats, setShowComparisonStats] = useState(false);
   ```

2. Definir los datos estáticos:
   ```typescript
   const dependencies = [
     'Juzgado 1', 'Juzgado 2', 'Juzgado 3', 'Juzgado 4', 'Juzgado 5', 
     'Juzgado 6', 'Juzgado 8', 'Juzgado 9', 'Juzgado 10',
     'Sala 1', 'Sala 2', 'Sala 3'
   ];
   
   const months = [
     'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 
     'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
   ];
   
   const years = ['2014', '2015'];
   ```

### 3. Implementar funciones de manejo de eventos

1. Crear funciones para mostrar/ocultar menús:
   ```typescript
   const toggleVisualizationMenu = () => {
     setShowVisualizationMenu(!showVisualizationMenu);
     if (showComparisonMenu) setShowComparisonMenu(false);
   };

   const toggleComparisonMenu = () => {
     setShowComparisonMenu(!showComparisonMenu);
     if (showVisualizationMenu) setShowVisualizationMenu(false);
   };
   ```

2. Implementar la función para manejar la selección de dependencias en la comparativa:
   ```typescript
   const handleComparisonDependencyChange = (dependency: string) => {
     if (comparisonDependencies.includes(dependency)) {
       setComparisonDependencies(comparisonDependencies.filter(dep => dep !== dependency));
     } else if (comparisonDependencies.length < 5) {
       setComparisonDependencies([...comparisonDependencies, dependency]);
     }
   };
   ```

3. Crear funciones para mostrar estadísticas:
   ```typescript
   const handleShowStats = () => {
     if (selectedDependency && selectedMonth && selectedYear) {
       setShowStats(true);
       setShowComparisonStats(false);
     }
   };

   const handleShowComparisonStats = () => {
     if (comparisonDependencies.length > 0 && comparisonMonth && comparisonYear) {
       setShowComparisonStats(true);
       setShowStats(false);
     }
   };
   ```

4. Implementar funciones para restablecer formularios:
   ```typescript
   const resetVisualizationForm = () => {
     setSelectedDependency('');
     setSelectedMonth('');
     setSelectedYear('');
     setShowStats(false);
   };

   const resetComparisonForm = () => {
     setComparisonDependencies([]);
     setComparisonMonth('');
     setComparisonYear('');
     setShowComparisonStats(false);
   };
   ```

### 4. Crear la estructura de la interfaz de usuario

1. Crear el encabezado:
   ```jsx
   <header className="mb-10 text-center">
     <h1 className="text-4xl font-bold text-blue-900 mb-2">Estadísticas</h1>
     <p className="text-gray-600">Poder Judicial - Sistema de Visualización de Datos</p>
   </header>
   ```

2. Implementar el botón "Visualizar Gráfico" con su menú desplegable:
   ```jsx
   <button 
     onClick={toggleVisualizationMenu}
     className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition-all"
   >
     <BarChart className="mr-2" size={20} />
     Visualizar Gráfico
     <ChevronDown className={`ml-2 transition-transform ${showVisualizationMenu ? 'rotate-180' : ''}`} size={20} />
   </button>
   ```

3. Crear el formulario de visualización con selectores para dependencia, mes y año:
   ```jsx
   {showVisualizationMenu && (
     <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
       {/* Botón de restablecer */}
       <div className="flex justify-between items-center mb-4">
         <h3 className="font-semibold text-gray-800">Seleccionar Datos</h3>
         <button 
           onClick={resetVisualizationForm}
           className="text-gray-600 hover:text-blue-600 flex items-center text-sm"
         >
           <RotateCcw size={14} className="mr-1" />
           Restablecer
         </button>
       </div>
       
       {/* Selector de dependencia */}
       <div className="mb-4">
         <label className="block text-gray-700 font-medium mb-2">Dependencia</label>
         <select 
           value={selectedDependency}
           onChange={(e) => setSelectedDependency(e.target.value)}
           className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
         >
           <option value="">Seleccione una dependencia</option>
           {dependencies.map(dep => (
             <option key={dep} value={dep}>{dep}</option>
           ))}
         </select>
       </div>

       {/* Selector de mes */}
       <div className="mb-4">
         <label className="block text-gray-700 font-medium mb-2">Mes</label>
         <select 
           value={selectedMonth}
           onChange={(e) => setSelectedMonth(e.target.value)}
           className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
         >
           <option value="">Seleccione un mes</option>
           {months.map(month => (
             <option key={month} value={month}>{month}</option>
           ))}
         </select>
       </div>

       {/* Selector de año */}
       <div className="mb-4">
         <label className="block text-gray-700 font-medium mb-2">Año</label>
         <select 
           value={selectedYear}
           onChange={(e) => setSelectedYear(e.target.value)}
           className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
         >
           <option value="">Seleccione un año</option>
           {years.map(year => (
             <option key={year} value={year}>{year}</option>
           ))}
         </select>
       </div>

       {/* Botón para generar estadísticas */}
       <button 
         onClick={handleShowStats}
         className={`w-full font-semibold py-2 px-4 rounded-md transition-colors ${
           selectedDependency && selectedMonth && selectedYear
             ? 'bg-green-600 hover:bg-green-700 text-white' 
             : 'bg-gray-300 text-gray-500 cursor-not-allowed'
         }`}
         disabled={!selectedDependency || !selectedMonth || !selectedYear}
       >
         Generar Estadísticas
       </button>
     </div>
   )}
   ```

4. Implementar el botón "Realizar Comparativa" con su menú desplegable:
   ```jsx
   <button 
     onClick={toggleComparisonMenu}
     className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition-all"
   >
     <LineChart className="mr-2" size={20} />
     Realizar Comparativa
     <ChevronDown className={`ml-2 transition-transform ${showComparisonMenu ? 'rotate-180' : ''}`} size={20} />
   </button>
   ```

5. Crear el formulario de comparativa con selección múltiple de dependencias y selectores de período:
   ```jsx
   {showComparisonMenu && (
     <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
       {/* Botón de restablecer */}
       <div className="flex justify-between items-center mb-4">
         <h3 className="font-semibold text-gray-800">Configurar Comparativa</h3>
         <button 
           onClick={resetComparisonForm}
           className="text-gray-600 hover:text-indigo-600 flex items-center text-sm"
         >
           <RotateCcw size={14} className="mr-1" />
           Restablecer
         </button>
       </div>
       
       {/* Selección de dependencias */}
       <div className="mb-4">
         <label className="block text-gray-700 font-medium mb-2">
           Dependencias a comparar (Máximo 5)
         </label>
         <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
           {dependencies.map(dep => (
             <div key={dep} className="flex items-center mb-2">
               <input 
                 type="checkbox" 
                 id={dep} 
                 checked={comparisonDependencies.includes(dep)}
                 onChange={() => handleComparisonDependencyChange(dep)}
                 className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                 disabled={!comparisonDependencies.includes(dep) && comparisonDependencies.length >= 5}
               />
               <label htmlFor={dep} className="text-gray-700">{dep}</label>
             </div>
           ))}
         </div>
         <p className="text-sm text-gray-500 mt-1">
           Seleccionados: {comparisonDependencies.length}/5
         </p>
       </div>

       {/* Selección de período */}
       <div className="mb-4">
         <label className="block text-gray-700 font-medium mb-2">
           <Calendar className="inline-block mr-2" size={16} />
           Período a comparar
         </label>
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm text-gray-600 mb-1">Mes</label>
             <select 
               value={comparisonMonth}
               onChange={(e) => setComparisonMonth(e.target.value)}
               className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="">Seleccione un mes</option>
               {months.map(month => (
                 <option key={month} value={month}>{month}</option>
               ))}
             </select>
           </div>
           <div>
             <label className="block text-sm text-gray-600 mb-1">Año</label>
             <select 
               value={comparisonYear}
               onChange={(e) => setComparisonYear(e.target.value)}
               className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="">Seleccione un año</option>
               {years.map(year => (
                 <option key={year} value={year}>{year}</option>
               ))}
             </select>
           </div>
         </div>
       </div>

       {/* Botón para generar comparativa */}
       <button 
         onClick={handleShowComparisonStats}
         className={`w-full font-semibold py-2 px-4 rounded-md transition-colors ${
           comparisonDependencies.length > 0 && comparisonMonth && comparisonYear
             ? 'bg-green-600 hover:bg-green-700 text-white' 
             : 'bg-gray-300 text-gray-500 cursor-not-allowed'
         }`}
         disabled={comparisonDependencies.length === 0 || !comparisonMonth || !comparisonYear}
       >
         Generar Comparativa
       </button>
     </div>
   )}
   ```

### 5. Implementar el área de visualización de estadísticas

1. Crear el contenedor condicional para mostrar estadísticas:
   ```jsx
   {(showStats || showComparisonStats) && (
     <div className="bg-white p-6 rounded-lg shadow-lg">
       <h2 className="text-2xl font-bold text-gray-800 mb-4">
         {showStats 
           ? `Estadísticas: ${selectedDependency} - ${selectedMonth} ${selectedYear}` 
           : `Comparativa - ${comparisonMonth} ${comparisonYear}`
         }
       </h2>
       
       {/* Visualización de estadísticas individuales */}
       {showStats && (
         <div className="p-4 bg-gray-50 rounded-md text-center">
           <p className="text-gray-600 mb-4">Conectando con Google Sheets para obtener datos...</p>
           <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
             <div className="text-center">
               <BarChart size={64} className="mx-auto text-blue-500 mb-4" />
               <p className="text-gray-500">
                 Aquí se mostrarán las estadísticas de {selectedDependency} para {selectedMonth} de {selectedYear}
               </p>
             </div>
           </div>
         </div>
       )}
       
       {/* Visualización de comparativa */}
       {showComparisonStats && (
         <div className="p-4 bg-gray-50 rounded-md text-center">
           <p className="text-gray-600 mb-4">Comparando {comparisonDependencies.length} dependencias...</p>
           <div className="mb-4">
             <p className="font-medium">Dependencias seleccionadas:</p>
             <ul className="list-disc list-inside">
               {comparisonDependencies.map(dep => (
                 <li key={dep} className="text-gray-700">{dep}</li>
               ))}
             </ul>
           </div>
           <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
             <div className="text-center">
               <LineChart size={64} className="mx-auto text-indigo-500 mb-4" />
               <p className="text-gray-500">
                 Aquí se mostrará la comparativa para {comparisonMonth} de {comparisonYear}
               </p>
             </div>
           </div>
         </div>
       )}
     </div>
   )}
   ```

### 6. Integración con Google Sheets (Implementación futura)

Para la integración real con Google Sheets, se necesitaría:

1. Configurar una API de Google Sheets:
   - Crear un proyecto en Google Cloud Console
   - Habilitar la API de Google Sheets
   - Crear credenciales de acceso

2. Instalar la biblioteca para interactuar con Google Sheets:
   ```bash
   npm install googleapis
   ```

3. Implementar funciones para obtener datos de Google Sheets:
   ```typescript
   // Ejemplo conceptual - requiere implementación completa
   async function fetchDataFromGoogleSheets(dependency, month, year) {
     // Implementar lógica para conectar con Google Sheets
     // y obtener los datos específicos
     return data;
   }
   ```

4. Visualizar los datos usando una biblioteca de gráficos como Chart.js o Recharts:
   ```bash
   npm install recharts
   ```

### 7. Ejecutar y probar la aplicación

1. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abrir el navegador en la URL proporcionada (generalmente http://localhost:5173)

3. Probar todas las funcionalidades:
   - Seleccionar dependencia, mes y año para visualizar estadísticas
   - Seleccionar múltiples dependencias para comparar
   - Verificar que los botones de restablecer funcionen correctamente
   - Comprobar que los botones de generación estén deshabilitados hasta que se completen todas las selecciones

## Consideraciones adicionales

- **Responsive Design**: La aplicación está diseñada para funcionar en dispositivos móviles y de escritorio.
- **Accesibilidad**: Se han incluido etiquetas y atributos para mejorar la accesibilidad.
- **Optimización**: Para un proyecto en producción, considerar la implementación de memoización para componentes que renderizan listas grandes.
- **Seguridad**: Para la integración con Google Sheets, asegurar que las credenciales estén protegidas y no se incluyan en el código fuente.

## Próximos pasos

1. Implementar la conexión real con Google Sheets
2. Añadir visualizaciones de gráficos con datos reales
3. Implementar funcionalidad de exportación de datos
4. Añadir filtros adicionales para análisis más detallados
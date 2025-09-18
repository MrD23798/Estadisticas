import React, { useState, useEffect } from 'react';
import { BarChart, Calendar, ChevronDown, LineChart, RotateCcw, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import D3BarChart from './components/D3BarChart';
import D3GroupedBarChart from './components/D3GroupedBarChart';
import D3LineChart, { EvolutionData } from './components/D3LineChart';
import { 
  fetchDependencyStats,
  fetchComparisonStats,
  fetchEvolutionStats,
  fetchDependencies,
  fetchObjectTypes,
  checkCSVAvailability,
  DependencyData,
  ComparisonData
} from './services/csvService';

function App() {
  const [showVisualizationMenu, setShowVisualizationMenu] = useState(false);
  const [showComparisonMenu, setShowComparisonMenu] = useState(false);
  const [showEvolutionMenu, setShowEvolutionMenu] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [comparisonDependencies, setComparisonDependencies] = useState<string[]>([]);
  const [comparisonMonth, setComparisonMonth] = useState('');
  const [comparisonYear, setComparisonYear] = useState('');
  const [evolutionDependency, setEvolutionDependency] = useState('');
  const [evolutionStartMonth, setEvolutionStartMonth] = useState('');
  const [evolutionEndMonth, setEvolutionEndMonth] = useState('');
  const [evolutionYear, setEvolutionYear] = useState('');
  const [evolutionObjectType, setEvolutionObjectType] = useState('TODOS');
  const [availableObjectTypes, setAvailableObjectTypes] = useState<string[]>(['TODOS']);
  const [showStats, setShowStats] = useState(false);
  const [showComparisonStats, setShowComparisonStats] = useState(false);
  const [showEvolutionStats, setShowEvolutionStats] = useState(false);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [dependencyData, setDependencyData] = useState<DependencyData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
  const [csvAvailable, setCsvAvailable] = useState<boolean | null>(null);
  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  
  // Obtener meses y años únicos de los archivos CSV disponibles
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const periodsFromFiles = csvFiles.map(file => {
    const match = file.match(/Datos (\d{4})(\d{2})/);
    if (match) {
      const year = match[1];
      const monthNum = parseInt(match[2], 10);
      const month = monthNames[monthNum - 1];
      return { month, year };
    }
    return null;
  }).filter(Boolean) as { month: string; year: string }[];
  const months = [...new Set(periodsFromFiles.map(p => p.month))];
  const years = [...new Set(periodsFromFiles.map(p => p.year))].sort((a, b) => parseInt(b) - parseInt(a));

  // Verificar la disponibilidad de archivos CSV al cargar
  useEffect(() => {
    // Leer archivos CSV disponibles en public/data
    const fetchCsvFiles = async () => {
      try {
        console.log('Iniciando carga de archivos CSV...');
        // Simulación: lista fija de archivos (puedes reemplazar esto por una petición al backend si lo necesitas)
        const files = [
          'Datos 200502 - Hoja1.csv',
          'Datos 200503 - Hoja1.csv',
          'Datos 200504 - Hoja1.csv',
          'Datos 200505 - Hoja1.csv',
          'Datos 200506 - Hoja1.csv',
          'Datos 200507 - Hoja1.csv',
          'Datos 200508 - Hoja1.csv',
          'Datos 200509 - Hoja1.csv',
          'Datos 200510 - Hoja1.csv',
          'Datos 200511 - Hoja1.csv',
          'Datos 200512 - Hoja1.csv',
          'Datos 200602 - Hoja1.csv',
          'Datos 200603 - Hoja1.csv',
          'Datos 200604 - Hoja1.csv',
          'Datos 200605 - Hoja1.csv',
          'Datos 200606 - Hoja1.csv',
          'Datos 200607 - Hoja1.csv',
          'Datos 200608 - Hoja1.csv',
          'Datos 200609 - Hoja1.csv',
          'Datos 200610 - Hoja1.csv',
          'Datos 200611 - Hoja1.csv',
          'Datos 200612 - Hoja1.csv',
          'Datos 200702 - Hoja1.csv',
          'Datos 200703 - Hoja1.csv',
          'Datos 200704 - Hoja1.csv',
          'Datos 200705 - Hoja1.csv',
          'Datos 200706 - Hoja1.csv',
          'Datos 200707 - Hoja1.csv',
          'Datos 200708 - Hoja1.csv',
          'Datos 200709 - Hoja1.csv',
          'Datos 200710 - Hoja1.csv',
          'Datos 200711 - Hoja1.csv',
          'Datos 200712 - Hoja1.csv',
          'Datos 200802 - Hoja1.csv',
          'Datos 200803 - Hoja1.csv',
          'Datos 200804 - Hoja1.csv',
          'Datos 200805 - Hoja1.csv',
          'Datos 200806 - Hoja1.csv',
          'Datos 200807 - Hoja1.csv',
          'Datos 200808 - Hoja1.csv',
          'Datos 200809 - Hoja1.csv',
          'Datos 200810 - Hoja1.csv',
          'Datos 200811 - Hoja1.csv',
          'Datos 200812 - Hoja1.csv',
          'Datos 200902 - Hoja1.csv',
          'Datos 200903 - Hoja1.csv',
          'Datos 200904 - Hoja1.csv',
          'Datos 200905 - Hoja1.csv',
          'Datos 200906 - Hoja1.csv',
          'Datos 200907 - Hoja1.csv',
          'Datos 200908 - Hoja1.csv',
          'Datos 200909 - Hoja1.csv',
          'Datos 200910 - Hoja1.csv',
          'Datos 200911 - Hoja1.csv',
          'Datos 200912 - Hoja1.csv',
          'Datos 201002 - Hoja1.csv',
          'Datos 201003 - Hoja1.csv',
          'Datos 201004 - Hoja1.csv',
          'Datos 201005 - Hoja1.csv',
          'Datos 201006 - Hoja1.csv',
          'Datos 201007 - Hoja1.csv',
          'Datos 201008 - Hoja1.csv',
          'Datos 201009 - Hoja1.csv',
          'Datos 201010 - Hoja1.csv',
          'Datos 201011 - Hoja1.csv',
          'Datos 201012 - Hoja1.csv',
          'Datos 201102 - Hoja1.csv',
          'Datos 201103 - Hoja1.csv',
          'Datos 201104 - Hoja1.csv',
          'Datos 201105 - Hoja1.csv',
          'Datos 201106 - Hoja1.csv',
          'Datos 201107 - Hoja1.csv',
          'Datos 201108 - Hoja1.csv',
          'Datos 201109 - Hoja1.csv',
          'Datos 201110 - Hoja1.csv',
          'Datos 201111 - Hoja1.csv',
          'Datos 201112 - Hoja1.csv',
          'Datos 201202 - Hoja1.csv',
          'Datos 201203 - Hoja1.csv',
          'Datos 201204 - Hoja1.csv',
          'Datos 201205 - Hoja1.csv',
          'Datos 201206 - Hoja1.csv',
          'Datos 201207 - Hoja1.csv',
          'Datos 201208 - Hoja1.csv',
          'Datos 201209 - Hoja1.csv',
          'Datos 201210 - Hoja1.csv',
          'Datos 201211 - Hoja1.csv',
          'Datos 201212 - Hoja1.csv',
          'Datos 201302 - Hoja1.csv',
          'Datos 201303 - Hoja1.csv',
          'Datos 201304 - Hoja1.csv',
          'Datos 201305 - Hoja1.csv',
          'Datos 201306 - Hoja1.csv',
          'Datos 201307 - Hoja1.csv',
          'Datos 201308 - Hoja1.csv',
          'Datos 201309 - Hoja1.csv',
          'Datos 201310 - Hoja1.csv',
          'Datos 201311 - Hoja1.csv',
          'Datos 201312 - Hoja1.csv',
          'Datos 201402 - Hoja1.csv',
          'Datos 201403 - Hoja1.csv',
          'Datos 201404 - Hoja1.csv',
          'Datos 201405 - Hoja1.csv',
          'Datos 201406 - Hoja1.csv',
          'Datos 201407 - Hoja1.csv',
          'Datos 201408 - Hoja1.csv',
          'Datos 201409 - Hoja1.csv',
          'Datos 201410 - Hoja1.csv',
          'Datos 201411 - Hoja1.csv',
          'Datos 201412 - Hoja1.csv',
          'Datos 201502 - Hoja1.csv',
          'Datos 201503 - Hoja1.csv',
          'Datos 201504 - Hoja1.csv',
          'Datos 201505 - Hoja1.csv',
          'Datos 201506 - Hoja1.csv',
          'Datos 201507 - Hoja1.csv',
          'Datos 201508 - Hoja1.csv',
          'Datos 201509 - Hoja1.csv',
          'Datos 201510 - Hoja1.csv',
          'Datos 201511 - Hoja1.csv',
          'Datos 201512 - Hoja1.csv',
          'Datos 201602 - Hoja1.csv',
          'Datos 201603 - Hoja1.csv',
          'Datos 201604 - Hoja1.csv',
          'Datos 201605 - Hoja1.csv',
          'Datos 201606 - Hoja1.csv',
          'Datos 201607 - Hoja1.csv',
          'Datos 201608 - Hoja1.csv',
          'Datos 201609 - Hoja1.csv',
          'Datos 201610 - Hoja1.csv',
          'Datos 201611 - Hoja1.csv',
          'Datos 201612 - Hoja1.csv',
          'Datos 201702 - Hoja1.csv',
          'Datos 201703 - Hoja1.csv',
          'Datos 201704 - Hoja1.csv',
          'Datos 201705 - Hoja1.csv',
          'Datos 201706 - Hoja1.csv',
          'Datos 201707 - Hoja1.csv',
          'Datos 201708 - Hoja1.csv',
          'Datos 201709 - Hoja1.csv',
          'Datos 201710 - Hoja1.csv',
          'Datos 201711 - Hoja1.csv',
          'Datos 201712 - Hoja1.csv',
          'Datos 201802 - Hoja1.csv',
          'Datos 201803 - Hoja1.csv',
          'Datos 201804 - Hoja1.csv',
          'Datos 201805 - Hoja1.csv',
          'Datos 201806 - Hoja1.csv',
          'Datos 201807 - Hoja1.csv',
          'Datos 201808 - Hoja1.csv',
          'Datos 201809 - Hoja1.csv',
          'Datos 201810 - Hoja1.csv',
          'Datos 201811 - Hoja1.csv',
          'Datos 201812 - Hoja1.csv',
          'Datos 201902 - Hoja1.csv',
          'Datos 201903 - Hoja1.csv',
          'Datos 201904 - Hoja1.csv',
          'Datos 201905 - Hoja1.csv',
          'Datos 201906 - Hoja1.csv',
          'Datos 201907 - Hoja1.csv',
          'Datos 201908 - Hoja1.csv',
          'Datos 201909 - Hoja1.csv',
          'Datos 201910 - Hoja1.csv',
          'Datos 201911 - Hoja1.csv',
          'Datos 201912 - Hoja1.csv',
          'Datos 202002 - Hoja1.csv',
          'Datos 202003 - Hoja1.csv',
          'Datos 202004 - Hoja1.csv',
          'Datos 202005 - Hoja1.csv',
          'Datos 202006 - Hoja1.csv',
          'Datos 202007 - Hoja1.csv',
          'Datos 202008 - Hoja1.csv',
          'Datos 202009 - Hoja1.csv',
          'Datos 202010 - Hoja1.csv',
          'Datos 202011 - Hoja1.csv',
          'Datos 202012 - Hoja1.csv',
          'Datos 202102 - Hoja1.csv',
          'Datos 202103 - Hoja1.csv',
          'Datos 202104 - Hoja1.csv',
          'Datos 202105 - Hoja1.csv',
          'Datos 202106 - Hoja1.csv',
          'Datos 202107 - Hoja1.csv',
          'Datos 202108 - Hoja1.csv',
          'Datos 202109 - Hoja1.csv',
          'Datos 202110 - Hoja1.csv',
          'Datos 202111 - Hoja1.csv',
          'Datos 202112 - Hoja1.csv',
          'Datos 202202 - Hoja1.csv',
          'Datos 202203 - Hoja1.csv',
          'Datos 202204 - Hoja1.csv',
          'Datos 202205 - Hoja1.csv',
          'Datos 202206 - Hoja1.csv',
          'Datos 202207 - Hoja1.csv',
          'Datos 202208 - Hoja1.csv',
          'Datos 202209 - Hoja1.csv',
          'Datos 202210 - Hoja1.csv',
          'Datos 202211 - Hoja1.csv',
          'Datos 202212 - Hoja1.csv',
          'Datos 202302 - Hoja1.csv',
          'Datos 202303 - Hoja1.csv',
          'Datos 202304 - Hoja1.csv',
          'Datos 202305 - Hoja1.csv',
          'Datos 202306 - Hoja1.csv',
          'Datos 202307 - Hoja1.csv',
          'Datos 202308 - Hoja1.csv',
          'Datos 202309 - Hoja1.csv',
          'Datos 202310 - Hoja1.csv',
          'Datos 202311 - Hoja1.csv',
          'Datos 202312 - Hoja1.csv',
          'Datos 202402 - Hoja1.csv',
          'Datos 202403 - Hoja1.csv',
          'Datos 202404 - Hoja1.csv',
          'Datos 202405 - Hoja1.csv',
          'Datos 202406 - Hoja1.csv',
          'Datos 202407 - Hoja1.csv',
          'Datos 202408 - Hoja1.csv',
          'Datos 202409 - Hoja1.csv',
          'Datos 202410 - Hoja1.csv',
          'Datos 202411 - Hoja1.csv',
          'Datos 202412 - Hoja1.csv',
          'Datos 202502 - Hoja1.csv',
          'Datos 202503 - Hoja1.csv',
          'Datos 202504 - Hoja1.csv',
          'Datos 202505 - Hoja1.csv',
          'Datos 202506 - Hoja1.csv',
          'Datos 202507 - Hoja1.csv',
          'Datos 202508 - Hoja1.csv',
          'Datos 202509 - Hoja1.csv',
          'Datos 202510 - Hoja1.csv',
          'Datos 202511 - Hoja1.csv',
          'Datos 202512 - Hoja1.csv',
        ];
        setCsvFiles(files);
        console.log(`Archivos CSV configurados: ${files.length} archivos`);
        
        // Usar el primer archivo como default para dependencias y períodos
        const defaultFile = files[0];
        console.log(`Verificando disponibilidad del archivo: ${defaultFile}`);
        const isAvailable = await checkCSVAvailability(defaultFile);
        console.log(`Archivo disponible: ${isAvailable}`);
        setCsvAvailable(isAvailable);
        
        if (isAvailable) {
          console.log('Cargando dependencias...');
          const fetchedDependencies = await fetchDependencies();
          console.log(`Dependencias cargadas: ${fetchedDependencies.length}`, fetchedDependencies);
          
          // Ordenar dependencias por número de juzgado
          const sortDependencies = (deps: string[]) => {
            return deps.slice().sort((a, b) => {
              const numA = parseInt(a.match(/SOCIAL (\d+)/)?.[1] || "0");
              const numB = parseInt(b.match(/SOCIAL (\d+)/)?.[1] || "0");
              return numA - numB;
            });
          };
          const sortedDeps = sortDependencies(fetchedDependencies);
          console.log('Dependencias ordenadas:', sortedDeps);
          setDependencies(sortedDeps);
        } else {
          console.error('No se pudo verificar la disponibilidad del archivo CSV');
        }
      } catch (error) {
        console.error('Error al cargar archivos CSV:', error);
      }
    };
    fetchCsvFiles();
  }, []);

  const toggleVisualizationMenu = () => {
    setShowVisualizationMenu(!showVisualizationMenu);
    if (showComparisonMenu) setShowComparisonMenu(false);
    if (showEvolutionMenu) setShowEvolutionMenu(false);
  };

  const toggleComparisonMenu = () => {
    setShowComparisonMenu(!showComparisonMenu);
    if (showVisualizationMenu) setShowVisualizationMenu(false);
    if (showEvolutionMenu) setShowEvolutionMenu(false);
  };

  const toggleEvolutionMenu = () => {
    setShowEvolutionMenu(!showEvolutionMenu);
    if (showVisualizationMenu) setShowVisualizationMenu(false);
    if (showComparisonMenu) setShowComparisonMenu(false);
  };

  const handleComparisonDependencyChange = (dependency: string) => {
    if (comparisonDependencies.includes(dependency)) {
      setComparisonDependencies(comparisonDependencies.filter(dep => dep !== dependency));
    } else if (comparisonDependencies.length < 5) {
      setComparisonDependencies([...comparisonDependencies, dependency]);
    }
  };

  // Función para obtener el número de mes en formato MM
  

  // Función para armar el nombre del archivo CSV


  const handleShowStats = async () => {
    if (selectedDependency && selectedMonth && selectedYear) {
      setLoading(true);
      setShowStats(true);
      setShowComparisonStats(false);
      try {
        const data = await fetchDependencyStats(selectedDependency, selectedMonth, selectedYear);
        setDependencyData(data);
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        // Mostrar mensaje de error al usuario
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShowComparisonStats = async () => {
    if (comparisonDependencies.length > 0 && comparisonMonth && comparisonYear) {
      setComparisonLoading(true);
      setShowComparisonStats(true);
      setShowStats(false);
      try {
        const data = await fetchComparisonStats(comparisonDependencies, comparisonMonth, comparisonYear);
        setComparisonData(data);
      } catch (error) {
        console.error('Error al obtener comparación:', error);
        // Mostrar mensaje de error al usuario
      } finally {
        setComparisonLoading(false);
      }
    }
  };

  const resetVisualizationForm = () => {
    setSelectedDependency('');
    setSelectedMonth('');
    setSelectedYear('');
    setShowStats(false);
    setDependencyData([]);
  };

  const handleEvolutionDependencyChange = async (dependency: string) => {
    setEvolutionDependency(dependency);
    setEvolutionObjectType('TODOS');
    
    if (dependency) {
      try {
        // Obtener los tipos de objetos disponibles para la dependencia
        const objectTypes = await fetchObjectTypes(dependency);
        setAvailableObjectTypes(objectTypes);
      } catch (error) {
        console.error('Error al cargar tipos de objetos:', error);
        setAvailableObjectTypes(['TODOS']);
      }
    } else {
      setAvailableObjectTypes(['TODOS']);
    }
  };

  const handleShowEvolutionStats = async () => {
    if (evolutionDependency && evolutionStartMonth && evolutionEndMonth && evolutionYear) {
      setEvolutionLoading(true);
      setShowEvolutionStats(true);
      setShowStats(false);
      setShowComparisonStats(false);
      try {
        const data = await fetchEvolutionStats(
          evolutionDependency, 
          evolutionStartMonth, 
          evolutionEndMonth, 
          evolutionYear,
          evolutionObjectType
        );
        setEvolutionData(data);
      } catch (error) {
        console.error('Error al obtener evolución:', error);
        // Mostrar mensaje de error al usuario
      } finally {
        setEvolutionLoading(false);
      }
    }
  };

  const resetEvolutionForm = () => {
    setEvolutionDependency('');
    setEvolutionStartMonth('');
    setEvolutionEndMonth('');
    setEvolutionYear('');
    setEvolutionObjectType('TODOS');
    setAvailableObjectTypes(['TODOS']);
    setShowEvolutionStats(false);
    setEvolutionData([]);
  };

  const resetComparisonForm = () => {
    setComparisonDependencies([]);
    setComparisonMonth('');
    setComparisonYear('');
    setShowComparisonStats(false);
    setComparisonData([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center text-white" style={{ margin: 0, padding: '2rem', overflow: 'hidden' }}>
      <div className="w-full max-w-7xl" style={{ margin: 0, padding: 0 }}>
        <motion.header 
          className="mb-10 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-3">Estadísticas</h1>
          <p className="text-slate-400">Poder Judicial - Sistema de Visualización de Datos</p>
          {csvAvailable === false && (
            <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-300 text-sm">
                
              </p>
            </div>
          )}
          {/* Eliminado: no mostrar nada, ni contenedor verde */}
        </motion.header>

        <div className="flex flex-col lg:flex-row gap-6 mb-8 w-full">
          {/* Visualizar Gráfico Button */}
          <motion.div 
            className="w-full lg:w-1/3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.button 
              onClick={toggleVisualizationMenu}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BarChart className="mr-2" size={22} />
              Visualizar Gráfico
              <motion.div
                animate={{ rotate: showVisualizationMenu ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="ml-2" size={22} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showVisualizationMenu && (
                <motion.div 
                  className="mt-4 bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/10"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-white">Seleccionar Datos</h3>
                    <motion.button 
                      onClick={resetVisualizationForm}
                      className="text-slate-300 hover:text-blue-400 flex items-center text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RotateCcw size={14} className="mr-1" />
                      Restablecer
                    </motion.button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-slate-200 font-medium mb-2">Dependencia</label>
                    <select 
                      value={selectedDependency}
                      onChange={(e) => setSelectedDependency(e.target.value)}
                      className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Seleccione una dependencia</option>
                      {dependencies.map(dep => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-slate-200 font-medium mb-2">Mes</label>
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Seleccione un mes</option>
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-slate-200 font-medium mb-2">Año</label>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Seleccione un año</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <motion.button 
                    onClick={handleShowStats}
                    className={`w-full font-semibold py-3 px-4 rounded-lg transition-all ${
                      selectedDependency && selectedMonth && selectedYear
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                    disabled={!selectedDependency || !selectedMonth || !selectedYear}
                    whileHover={selectedDependency && selectedMonth && selectedYear ? { scale: 1.02 } : {}}
                    whileTap={selectedDependency && selectedMonth && selectedYear ? { scale: 0.98 } : {}}
                  >
                    Generar Estadísticas
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Realizar Comparativa Button */}
          <motion.div 
            className="w-full lg:w-1/3"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.button 
              onClick={toggleComparisonMenu}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-indigo-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LineChart className="mr-2" size={22} />
              Realizar Comparativa
              <motion.div
                animate={{ rotate: showComparisonMenu ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="ml-2" size={22} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showComparisonMenu && (
                <motion.div 
                  className="mt-4 bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/10"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-white">Configurar Comparativa</h3>
                    <motion.button 
                      onClick={resetComparisonForm}
                      className="text-slate-300 hover:text-indigo-400 flex items-center text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RotateCcw size={14} className="mr-1" />
                      Restablecer
                    </motion.button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-slate-200 font-medium mb-2">
                      Dependencias a comparar (Máximo 5)
                    </label>
                    <div className="max-h-48 overflow-y-auto bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                      {dependencies.map(dep => (
                        <motion.div 
                          key={dep} 
                          className="flex items-center mb-2"
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <input 
                            type="checkbox" 
                            id={dep} 
                            checked={comparisonDependencies.includes(dep)}
                            onChange={() => handleComparisonDependencyChange(dep)}
                            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded"
                            disabled={!comparisonDependencies.includes(dep) && comparisonDependencies.length >= 5}
                          />
                          <label htmlFor={dep} className="text-slate-200">{dep}</label>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      Seleccionados: <span className="text-indigo-400 font-medium">{comparisonDependencies.length}/5</span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-slate-200 font-medium mb-2">
                      <Calendar className="inline-block mr-2" size={16} />
                      Período a comparar
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Mes</label>
                        <select 
                          value={comparisonMonth}
                          onChange={(e) => setComparisonMonth(e.target.value)}
                          className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="">Seleccione un mes</option>
                          {months.map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Año</label>
                        <select 
                          value={comparisonYear}
                          onChange={(e) => setComparisonYear(e.target.value)}
                          className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="">Seleccione un año</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <motion.button 
                    onClick={handleShowComparisonStats}
                    className={`w-full font-semibold py-3 px-4 rounded-lg transition-all ${
                      comparisonDependencies.length > 0 && comparisonMonth && comparisonYear
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                    disabled={comparisonDependencies.length === 0 || !comparisonMonth || !comparisonYear}
                    whileHover={comparisonDependencies.length > 0 && comparisonMonth && comparisonYear ? { scale: 1.02 } : {}}
                    whileTap={comparisonDependencies.length > 0 && comparisonMonth && comparisonYear ? { scale: 0.98 } : {}}
                  >
                    Generar Comparativa
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Evolución Button */}
          <motion.div 
            className="w-full lg:w-1/3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.button 
              onClick={toggleEvolutionMenu}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-emerald-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TrendingUp className="mr-2" size={22} />
              Ver Evolución
              <motion.div
                animate={{ rotate: showEvolutionMenu ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="ml-2" size={22} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showEvolutionMenu && (
                <motion.div 
                  className="mt-4 bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/10"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-white">Configurar Evolución</h3>
                    <motion.button 
                      onClick={resetEvolutionForm}
                      className="text-slate-300 hover:text-emerald-400 flex items-center text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RotateCcw size={14} className="mr-1" />
                      Restablecer
                    </motion.button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-slate-200 font-medium mb-2">Dependencia</label>
                    <select 
                      value={evolutionDependency}
                      onChange={(e) => handleEvolutionDependencyChange(e.target.value)}
                      className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    >
                      <option value="">Seleccione una dependencia</option>
                      {dependencies.map(dep => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-slate-200 font-medium mb-2">Tipo de Objeto</label>
                    <select 
                      value={evolutionObjectType}
                      onChange={(e) => setEvolutionObjectType(e.target.value)}
                      className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      disabled={!evolutionDependency}
                    >
                      {availableObjectTypes.map(objectType => (
                        <option key={objectType} value={objectType}>
                          {objectType === 'TODOS' ? 'Todos los tipos' : objectType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-slate-200 font-medium mb-2">
                      <Calendar className="inline-block mr-2" size={16} />
                      Rango de períodos
                    </label>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Mes inicial</label>
                        <select 
                          value={evolutionStartMonth}
                          onChange={(e) => setEvolutionStartMonth(e.target.value)}
                          className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        >
                          <option value="">Seleccione</option>
                          {months.map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Mes final</label>
                        <select 
                          value={evolutionEndMonth}
                          onChange={(e) => setEvolutionEndMonth(e.target.value)}
                          className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        >
                          <option value="">Seleccione</option>
                          {months.map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Año</label>
                      <select 
                        value={evolutionYear}
                        onChange={(e) => setEvolutionYear(e.target.value)}
                        className="w-full p-3 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      >
                        <option value="">Seleccione un año</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <motion.button 
                    onClick={handleShowEvolutionStats}
                    className={`w-full font-semibold py-3 px-4 rounded-lg transition-all ${
                      evolutionDependency && evolutionStartMonth && evolutionEndMonth && evolutionYear
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                    disabled={!evolutionDependency || !evolutionStartMonth || !evolutionEndMonth || !evolutionYear}
                    whileHover={evolutionDependency && evolutionStartMonth && evolutionEndMonth && evolutionYear ? { scale: 1.02 } : {}}
                    whileTap={evolutionDependency && evolutionStartMonth && evolutionEndMonth && evolutionYear ? { scale: 0.98 } : {}}
                  >
                    Generar Evolución
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Statistics Display Area */}
        <AnimatePresence>
          {(showStats || showComparisonStats || showEvolutionStats) && (
            <motion.div 
              className="rounded-xl shadow-xl"
              style={{ 
                margin: 0, 
                padding: 0, 
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h2 
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {showStats 
                  ? '' 
                  : showComparisonStats
                  ? ''
                  : ''
                }
              </motion.h2>
              
              {showStats && (
                <motion.div 
                  className="rounded-lg"
                  style={{ 
                    margin: 0, 
                    padding: 0, 
                    overflow: 'hidden',
                    background: 'rgba(30, 41, 59, 0.5)'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <D3BarChart 
                    data={dependencyData}
                    dependency={selectedDependency}
                    month={selectedMonth}
                    year={selectedYear}
                    loading={loading}
                  />
                </motion.div>
              )}
              
              {showComparisonStats && (
                <motion.div 
                  className="bg-slate-800/50 rounded-lg"
                  style={{ 
                    margin: 0, 
                    padding: 0, 
                    overflow: 'hidden'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {!comparisonLoading && comparisonData.length > 0 && (
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <p className="font-medium text-slate-200">Dependencias seleccionadas:</p>
                      <ul className="mt-2 space-y-1">
                        {comparisonDependencies.map((dep, index) => (
                          <motion.li 
                            key={dep} 
                            className="text-indigo-400 bg-slate-800/80 px-3 py-1 rounded-md inline-block mr-2 mb-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + (index * 0.1), duration: 0.3 }}
                          >
                            {dep}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                  
                  <D3GroupedBarChart 
                    data={comparisonData}
                    month={comparisonMonth}
                    year={comparisonYear}
                    loading={comparisonLoading}
                  />
                </motion.div>
              )}
              
              {showEvolutionStats && (
                <motion.div 
                  className="bg-slate-800/50 rounded-lg"
                  style={{ 
                    margin: 0, 
                    padding: 0, 
                    overflow: 'hidden'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <D3LineChart 
                    data={evolutionData}
                    dependency={evolutionDependency}
                    startPeriod={evolutionStartMonth}
                    endPeriod={evolutionEndMonth}
                    year={evolutionYear}
                    objectType={evolutionObjectType}
                    loading={evolutionLoading}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
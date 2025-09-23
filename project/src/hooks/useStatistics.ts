import { useState, useEffect } from 'react';
import { 
  fetchDependencyStats,
  fetchComparisonStats,
  fetchEvolutionStats,
  fetchDependencies,
  fetchObjectTypes,
  checkCSVAvailability,
  DependencyData,
  ComparisonData,
  EvolutionData
} from '../services/csvService';
import { 
  VisualizationFilters,
  ComparisonFilters,
  EvolutionFilters
} from '../types';

export const useStatistics = () => {
  // Estados de datos
  const [dependencyData, setDependencyData] = useState<DependencyData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [availableObjectTypes, setAvailableObjectTypes] = useState<string[]>(['TODOS']);
  
  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  
  // Estados de visualización
  const [showStats, setShowStats] = useState(false);
  const [showComparisonStats, setShowComparisonStats] = useState(false);
  const [showEvolutionStats, setShowEvolutionStats] = useState(false);
  
  // Estados de CSV
  const [csvAvailable, setCsvAvailable] = useState<boolean | null>(null);
  const [csvFiles, setCsvFiles] = useState<string[]>([]);

  // Cargar dependencias disponibles
  const loadDependencies = async () => {
    try {
      const deps = await fetchDependencies();
      setDependencies(deps);
    } catch (error) {
      console.error('Error al cargar dependencias:', error);
    }
  };

  // Generar estadísticas simples
  const generateStats = async (filters: VisualizationFilters) => {
    if (!filters.selectedDependency || !filters.selectedMonth || !filters.selectedYear) {
      return;
    }

    setLoading(true);
    try {
      const data = await fetchDependencyStats(
        filters.selectedDependency,
        filters.selectedMonth,
        filters.selectedYear
      );
      setDependencyData(data);
      setShowStats(true);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generar estadísticas comparativas
  const generateComparison = async (filters: ComparisonFilters) => {
    if (filters.comparisonDependencies.length === 0 || !filters.comparisonMonth || !filters.comparisonYear) {
      return;
    }

    setComparisonLoading(true);
    try {
      const data = await fetchComparisonStats(
        filters.comparisonDependencies,
        filters.comparisonMonth,
        filters.comparisonYear
      );
      setComparisonData(data);
      setShowComparisonStats(true);
    } catch (error) {
      console.error('Error al obtener comparación:', error);
    } finally {
      setComparisonLoading(false);
    }
  };

  // Generar estadísticas de evolución
  const generateEvolution = async (filters: EvolutionFilters) => {
    if (!filters.evolutionDependency || !filters.evolutionStartMonth || 
        !filters.evolutionEndMonth || !filters.evolutionYear) {
      return;
    }

    setEvolutionLoading(true);
    try {
      const data = await fetchEvolutionStats(
        filters.evolutionDependency,
        filters.evolutionStartMonth,
        filters.evolutionEndMonth,
        filters.evolutionYear,
        filters.evolutionObjectType
      );
      setEvolutionData(data as EvolutionData[]);
      setShowEvolutionStats(true);
    } catch (error) {
      console.error('Error al obtener evolución:', error);
    } finally {
      setEvolutionLoading(false);
    }
  };

  // Cargar tipos de objetos para una dependencia
  const loadObjectTypes = async (dependency: string) => {
    if (dependency) {
      try {
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

  // Verificar disponibilidad de CSV
  const checkCsvAvailability = async () => {
    try {
      // Verificar con el primer archivo como ejemplo
      const isAvailable = await checkCSVAvailability('Datos 200502 - Hoja1.csv');
      setCsvAvailable(isAvailable);
    } catch (error) {
      console.error('Error al verificar disponibilidad de CSV:', error);
      setCsvAvailable(false);
    }
  };

  // Cargar archivos CSV disponibles (hardcodeado por ahora)
  const loadCsvFiles = () => {
    const files = [
      'Datos 200502 - Hoja1.csv', 'Datos 200503 - Hoja1.csv', 'Datos 200504 - Hoja1.csv',
      'Datos 200505 - Hoja1.csv', 'Datos 200506 - Hoja1.csv', 'Datos 200507 - Hoja1.csv',
      'Datos 200508 - Hoja1.csv', 'Datos 200509 - Hoja1.csv', 'Datos 200510 - Hoja1.csv',
      'Datos 200511 - Hoja1.csv', 'Datos 200512 - Hoja1.csv', 'Datos 200602 - Hoja1.csv',
      'Datos 200603 - Hoja1.csv', 'Datos 200604 - Hoja1.csv', 'Datos 200605 - Hoja1.csv',
      'Datos 200606 - Hoja1.csv', 'Datos 200607 - Hoja1.csv', 'Datos 200608 - Hoja1.csv',
      'Datos 200609 - Hoja1.csv', 'Datos 200610 - Hoja1.csv', 'Datos 200611 - Hoja1.csv',
      'Datos 200612 - Hoja1.csv', 'Datos 200702 - Hoja1.csv', 'Datos 200703 - Hoja1.csv',
      'Datos 200704 - Hoja1.csv', 'Datos 200705 - Hoja1.csv', 'Datos 200706 - Hoja1.csv',
      'Datos 200707 - Hoja1.csv', 'Datos 200708 - Hoja1.csv', 'Datos 200709 - Hoja1.csv',
      'Datos 200710 - Hoja1.csv', 'Datos 200711 - Hoja1.csv', 'Datos 200712 - Hoja1.csv',
      'Datos 200802 - Hoja1.csv', 'Datos 200803 - Hoja1.csv', 'Datos 200804 - Hoja1.csv',
      'Datos 200805 - Hoja1.csv', 'Datos 200806 - Hoja1.csv', 'Datos 200807 - Hoja1.csv',
      'Datos 200808 - Hoja1.csv', 'Datos 200809 - Hoja1.csv', 'Datos 200810 - Hoja1.csv',
      'Datos 200811 - Hoja1.csv', 'Datos 200812 - Hoja1.csv', 'Datos 200902 - Hoja1.csv',
      'Datos 200903 - Hoja1.csv', 'Datos 200904 - Hoja1.csv', 'Datos 200905 - Hoja1.csv',
      'Datos 200906 - Hoja1.csv', 'Datos 200907 - Hoja1.csv', 'Datos 200908 - Hoja1.csv',
      'Datos 200909 - Hoja1.csv', 'Datos 200910 - Hoja1.csv', 'Datos 200911 - Hoja1.csv',
      'Datos 200912 - Hoja1.csv', 'Datos 201002 - Hoja1.csv', 'Datos 201003 - Hoja1.csv',
      'Datos 201004 - Hoja1.csv', 'Datos 201005 - Hoja1.csv', 'Datos 201006 - Hoja1.csv',
      'Datos 201007 - Hoja1.csv', 'Datos 201008 - Hoja1.csv', 'Datos 201009 - Hoja1.csv',
      'Datos 201010 - Hoja1.csv', 'Datos 201011 - Hoja1.csv', 'Datos 201012 - Hoja1.csv',
      'Datos 201102 - Hoja1.csv', 'Datos 201103 - Hoja1.csv', 'Datos 201104 - Hoja1.csv',
      'Datos 201105 - Hoja1.csv', 'Datos 201106 - Hoja1.csv', 'Datos 201107 - Hoja1.csv',
      'Datos 201108 - Hoja1.csv', 'Datos 201109 - Hoja1.csv', 'Datos 201110 - Hoja1.csv',
      'Datos 201111 - Hoja1.csv', 'Datos 201112 - Hoja1.csv', 'Datos 201202 - Hoja1.csv',
      'Datos 201203 - Hoja1.csv', 'Datos 201204 - Hoja1.csv', 'Datos 201205 - Hoja1.csv',
      'Datos 201206 - Hoja1.csv', 'Datos 201207 - Hoja1.csv', 'Datos 201208 - Hoja1.csv',
      'Datos 201209 - Hoja1.csv', 'Datos 201210 - Hoja1.csv', 'Datos 201211 - Hoja1.csv',
      'Datos 201212 - Hoja1.csv', 'Datos 201302 - Hoja1.csv', 'Datos 201303 - Hoja1.csv',
      'Datos 201304 - Hoja1.csv', 'Datos 201305 - Hoja1.csv', 'Datos 201306 - Hoja1.csv',
      'Datos 201307 - Hoja1.csv', 'Datos 201308 - Hoja1.csv', 'Datos 201309 - Hoja1.csv',
      'Datos 201310 - Hoja1.csv', 'Datos 201311 - Hoja1.csv', 'Datos 201312 - Hoja1.csv',
      'Datos 201402 - Hoja1.csv', 'Datos 201403 - Hoja1.csv', 'Datos 201404 - Hoja1.csv',
      'Datos 201405 - Hoja1.csv', 'Datos 201406 - Hoja1.csv', 'Datos 201407 - Hoja1.csv',
      'Datos 201408 - Hoja1.csv', 'Datos 201409 - Hoja1.csv', 'Datos 201410 - Hoja1.csv',
      'Datos 201411 - Hoja1.csv', 'Datos 201412 - Hoja1.csv', 'Datos 201502 - Hoja1.csv',
      'Datos 201503 - Hoja1.csv', 'Datos 201504 - Hoja1.csv', 'Datos 201505 - Hoja1.csv',
      'Datos 201506 - Hoja1.csv', 'Datos 201507 - Hoja1.csv', 'Datos 201508 - Hoja1.csv',
      'Datos 201509 - Hoja1.csv', 'Datos 201510 - Hoja1.csv', 'Datos 201511 - Hoja1.csv',
      'Datos 201512 - Hoja1.csv', 'Datos 201602 - Hoja1.csv', 'Datos 201603 - Hoja1.csv',
      'Datos 201604 - Hoja1.csv', 'Datos 201605 - Hoja1.csv', 'Datos 201606 - Hoja1.csv',
      'Datos 201607 - Hoja1.csv', 'Datos 201608 - Hoja1.csv', 'Datos 201609 - Hoja1.csv',
      'Datos 201610 - Hoja1.csv', 'Datos 201611 - Hoja1.csv', 'Datos 201612 - Hoja1.csv',
      'Datos 201702 - Hoja1.csv', 'Datos 201703 - Hoja1.csv', 'Datos 201704 - Hoja1.csv',
      'Datos 201705 - Hoja1.csv', 'Datos 201706 - Hoja1.csv', 'Datos 201707 - Hoja1.csv',
      'Datos 201708 - Hoja1.csv', 'Datos 201709 - Hoja1.csv', 'Datos 201710 - Hoja1.csv',
      'Datos 201711 - Hoja1.csv', 'Datos 201712 - Hoja1.csv', 'Datos 201802 - Hoja1.csv',
      'Datos 201803 - Hoja1.csv', 'Datos 201804 - Hoja1.csv', 'Datos 201805 - Hoja1.csv',
      'Datos 201806 - Hoja1.csv', 'Datos 201807 - Hoja1.csv', 'Datos 201808 - Hoja1.csv',
      'Datos 201809 - Hoja1.csv', 'Datos 201810 - Hoja1.csv', 'Datos 201811 - Hoja1.csv',
      'Datos 201812 - Hoja1.csv', 'Datos 201902 - Hoja1.csv', 'Datos 201903 - Hoja1.csv',
      'Datos 201904 - Hoja1.csv', 'Datos 201905 - Hoja1.csv', 'Datos 201906 - Hoja1.csv',
      'Datos 201907 - Hoja1.csv', 'Datos 201908 - Hoja1.csv', 'Datos 201909 - Hoja1.csv',
      'Datos 201910 - Hoja1.csv', 'Datos 201911 - Hoja1.csv', 'Datos 201912 - Hoja1.csv',
      'Datos 202002 - Hoja1.csv', 'Datos 202003 - Hoja1.csv', 'Datos 202004 - Hoja1.csv',
      'Datos 202005 - Hoja1.csv', 'Datos 202006 - Hoja1.csv', 'Datos 202007 - Hoja1.csv',
      'Datos 202008 - Hoja1.csv', 'Datos 202009 - Hoja1.csv', 'Datos 202010 - Hoja1.csv',
      'Datos 202011 - Hoja1.csv', 'Datos 202012 - Hoja1.csv', 'Datos 202102 - Hoja1.csv',
      'Datos 202103 - Hoja1.csv', 'Datos 202104 - Hoja1.csv', 'Datos 202105 - Hoja1.csv',
      'Datos 202106 - Hoja1.csv', 'Datos 202107 - Hoja1.csv', 'Datos 202108 - Hoja1.csv',
      'Datos 202109 - Hoja1.csv', 'Datos 202110 - Hoja1.csv', 'Datos 202111 - Hoja1.csv',
      'Datos 202112 - Hoja1.csv', 'Datos 202202 - Hoja1.csv', 'Datos 202203 - Hoja1.csv',
      'Datos 202204 - Hoja1.csv', 'Datos 202205 - Hoja1.csv', 'Datos 202206 - Hoja1.csv',
      'Datos 202207 - Hoja1.csv', 'Datos 202208 - Hoja1.csv', 'Datos 202209 - Hoja1.csv',
      'Datos 202210 - Hoja1.csv', 'Datos 202211 - Hoja1.csv', 'Datos 202212 - Hoja1.csv',
      'Datos 202302 - Hoja1.csv', 'Datos 202303 - Hoja1.csv', 'Datos 202304 - Hoja1.csv',
      'Datos 202305 - Hoja1.csv', 'Datos 202306 - Hoja1.csv', 'Datos 202307 - Hoja1.csv',
      'Datos 202308 - Hoja1.csv', 'Datos 202309 - Hoja1.csv', 'Datos 202310 - Hoja1.csv',
      'Datos 202311 - Hoja1.csv', 'Datos 202312 - Hoja1.csv', 'Datos 202402 - Hoja1.csv',
      'Datos 202403 - Hoja1.csv', 'Datos 202404 - Hoja1.csv', 'Datos 202405 - Hoja1.csv',
      'Datos 202406 - Hoja1.csv', 'Datos 202407 - Hoja1.csv', 'Datos 202408 - Hoja1.csv',
      'Datos 202409 - Hoja1.csv', 'Datos 202410 - Hoja1.csv', 'Datos 202411 - Hoja1.csv',
      'Datos 202412 - Hoja1.csv', 'Datos 202502 - Hoja1.csv', 'Datos 202503 - Hoja1.csv',
      'Datos 202504 - Hoja1.csv', 'Datos 202505 - Hoja1.csv', 'Datos 202506 - Hoja1.csv',
      'Datos 202507 - Hoja1.csv', 'Datos 202508 - Hoja1.csv', 'Datos 202509 - Hoja1.csv',
      'Datos 202510 - Hoja1.csv', 'Datos 202511 - Hoja1.csv', 'Datos 202512 - Hoja1.csv'
    ];
    setCsvFiles(files);
  };

  // Efectos de inicialización
  useEffect(() => {
    loadDependencies();
    checkCsvAvailability();
    loadCsvFiles();
  }, []);

  return {
    // Estados
    dependencyData,
    comparisonData,
    evolutionData,
    dependencies,
    availableObjectTypes,
    loading,
    comparisonLoading,
    evolutionLoading,
    showStats,
    showComparisonStats,
    showEvolutionStats,
    csvAvailable,
    csvFiles,
    
    // Funciones
    generateStats,
    generateComparison,
    generateEvolution,
    loadObjectTypes,
    setShowStats,
    setShowComparisonStats,
    setShowEvolutionStats,
  };
};
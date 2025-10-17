import { useState, useEffect } from 'react';
import { 
  fetchDependencyStats,
  fetchComparisonStats,
  fetchEvolutionStats,
  fetchDependencies,
  fetchObjectTypes,
  checkAPIAvailability,
  fetchAvailablePeriods,
  DependencyData,
  ComparisonData,
  EvolutionData
} from '../services/apiService';
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
  
  // Estados de API
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<{ month: string; year: string }[]>([]);

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
      console.log('Buscando datos en base de datos y luego en Google Sheets si es necesario...');
      // Habilitamos la búsqueda en cascada (primero BD, luego Google Sheets)
      const data = await fetchDependencyStats(
        filters.selectedDependency,
        filters.selectedMonth,
        filters.selectedYear,
        { forceGoogleSheets: true }
      );
      
      if (data.length === 0) {
        console.warn('⚠️ No se encontraron datos en ninguna fuente');
      }
      
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

      // Verificar si se obtuvieron datos reales o datos vacíos (valores en 0)
      const hasRealData = data.some(item => item.value > 0);
      
      if (!hasRealData) {
        console.warn(`⚠️ No se encontraron datos reales para la evolución. Mostrando gráfico con valores vacíos.`);
        // Podríamos mostrar una alerta al usuario aquí, pero seguimos mostrando el gráfico vacío
      }
      
      setEvolutionData(data);
      setShowEvolutionStats(true);
    } catch (error) {
      console.error('Error al obtener evolución:', error);
      
      // En caso de error, crear datos vacíos para mostrar un gráfico "sin datos"
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      const startIndex = months.indexOf(filters.evolutionStartMonth);
      const endIndex = months.indexOf(filters.evolutionEndMonth);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const placeholderData: EvolutionData[] = [];
        
        // Crear periodos para el rango completo
        for (let i = startIndex; i <= endIndex; i++) {
          const currentMonth = months[i];
          const currentPeriod = `${filters.evolutionYear}${(i + 1).toString().padStart(2, '0')}`;
          
          placeholderData.push({
            period: currentPeriod,
            value: 0,
            year: filters.evolutionYear,
            month: currentMonth
          });
        }
        
        console.info('💡 Mostrando gráfico con datos vacíos debido al error');
        setEvolutionData(placeholderData);
        setShowEvolutionStats(true);
      }
    } finally {
      setEvolutionLoading(false);
    }
  };

  // Cargar tipos de objetos para una dependencia
  const loadObjectTypes = async (dependency: string) => {
    try {
      console.log('🔍 Cargando objetos de juicio para', dependency || 'todos los objetos');
      const objectTypes = await fetchObjectTypes();
      
      if (objectTypes.length > 1) {
        console.log(`✅ Se cargaron ${objectTypes.length} tipos de objetos de juicio`);
        setAvailableObjectTypes(objectTypes);
      } else {
        console.warn('⚠️ Solo se encontró el tipo por defecto (TODOS)');
        setAvailableObjectTypes(['TODOS']);
      }
    } catch (error) {
      console.error('❌ Error al cargar tipos de objetos:', error);
      setAvailableObjectTypes(['TODOS']);
    }
  };

  // Verificar disponibilidad de la API
  const checkApiAvailability = async () => {
    try {
      const isAvailable = await checkAPIAvailability();
      setApiAvailable(isAvailable);
    } catch (error) {
      console.error('Error al verificar disponibilidad de la API:', error);
      setApiAvailable(false);
    }
  };

  // Cargar períodos disponibles desde la API
  const loadAvailablePeriods = async () => {
    try {
      console.log('Cargando períodos disponibles desde la API...');
      const periods = await fetchAvailablePeriods();
      console.log(`✅ Períodos obtenidos correctamente: ${periods.length}`);
      
      if (periods.length === 0) {
        console.warn('⚠️ No se encontraron períodos en la API');
        // Si no hay períodos de la API, establecer algunos valores por defecto que abarquen varios años
        const defaultPeriods = [];
        
        // Generar períodos para los últimos 3 años, todos los meses
        const currentYear = new Date().getFullYear();
        const months = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        // Últimos 3 años
        for (let year = currentYear; year >= currentYear - 2; year--) {
          for (let i = 0; i < months.length; i++) {
            defaultPeriods.push({ month: months[i], year: year.toString() });
          }
        }
        
        console.log(`Usando ${defaultPeriods.length} períodos por defecto temporalmente`);
        setAvailablePeriods(defaultPeriods);
      } else {
        setAvailablePeriods(periods);
      }
    } catch (error) {
      console.error('Error al cargar períodos disponibles:', error);
      // En caso de error, establecer períodos por defecto para asegurar que la app funcione
      const defaultPeriods = [];
      const currentYear = new Date().getFullYear();
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      // Últimos 2 años
      for (let year = currentYear; year >= currentYear - 1; year--) {
        for (let i = 0; i < months.length; i++) {
          defaultPeriods.push({ 
            month: months[i], 
            year: year.toString() 
          });
        }
      }
      
      console.log(`Usando ${defaultPeriods.length} períodos por defecto debido al error`);
      setAvailablePeriods(defaultPeriods);
    }
  };

  // Efectos de inicialización
  useEffect(() => {
    loadDependencies();
    checkApiAvailability();
    loadAvailablePeriods();
    loadObjectTypes(''); // Cargar todos los objetos de juicio disponibles al inicio
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
    apiAvailable,
    availablePeriods,
    
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
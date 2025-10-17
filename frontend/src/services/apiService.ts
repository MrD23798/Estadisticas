import { apiClient } from '../api/apiClient';
import axios from 'axios';

// Interfaces para los datos
export interface DependencyData {
  category: string;
  value: number;
}

export interface ComparisonData {
  dependency: string;
  category: string;
  value: number;
}

export interface EvolutionData {
  period: string;
  value: number;
  year: string;
  month: string;
}

// Interfaces para respuestas API
interface Categoria {
  categoria: string;
  total: number;
}

interface CategoriasResponse {
  categorias: Categoria[];
}

interface DependenciaInfo {
  nombre: string;
  codigo?: string;
}

interface DependenciasResponse {
  dependencias: DependenciaInfo[];
}

interface PeriodosResponse {
  periodos: string[];
}

interface ComparacionItem {
  dependencia: string;
  expedientesRecibidos: number;
  categoriasDetalle?: Record<string, { asignados: number, reingresados: number }>;
}

interface ComparacionResponse {
  comparacion: ComparacionItem[];
}

interface EvolucionItem {
  periodo: string;
  valor: number;
}

interface EvolucionResponse {
  evolucion: EvolucionItem[];
}

/**
 * Convierte el período YYYYMM a formato legible
 */
const formatPeriod = (period: string): { month: string; year: string } => {
  if (period.length !== 6) {
    return { month: '', year: '' };
  }
  
  const year = period.substring(0, 4);
  const monthNum = parseInt(period.substring(4, 6));
  
  const months = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return {
    month: months[monthNum] || '',
    year: year
  };
};

/**
 * Convierte mes y año a formato de período YYYYMM
 */
const toPeriodFormat = (month: string, year: string): string => {
  const months: { [key: string]: string } = {
    'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
    'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
    'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
  };
  
  const monthNum = months[month];
  if (!monthNum) return '';
  
  return `${year}${monthNum}`;
};

/**
 * Obtiene datos de estadísticas para una dependencia específica
 */
export const fetchDependencyStats = async (
  dependency: string,
  month: string,
  year: string,
  options?: { forceGoogleSheets?: boolean }
): Promise<DependencyData[]> => {
  console.log('🔍 fetchDependencyStats llamada con:', { dependency, month, year, options });
  
  try {
    const targetPeriod = toPeriodFormat(month, year);
    console.log('📅 Período objetivo:', targetPeriod);
    
    if (!targetPeriod) {
      throw new Error(`Período inválido: ${month} ${year}`);
    }

    // SIEMPRE buscar en Google Sheets si no se encuentra en BD (estrategia cascada)
    // Solo si se especifica explícitamente forceGoogleSheets=false, se deshabilita
    const shouldSearchInGoogleSheets = options?.forceGoogleSheets !== false;
    console.log(`🔍 Buscando con estrategia cascada: ${shouldSearchInGoogleSheets ? 'BD→GoogleSheets' : 'Solo BD'}`);
    
    // Usar la API del backend
    const response = await apiClient.getCategorias(dependency, targetPeriod, { 
      topCategorias: 10,
      buscarEnGoogleSheets: shouldSearchInGoogleSheets
    });
    
    if (!response.categorias || response.categorias.length === 0) {
      console.warn(`No se encontraron datos para ${dependency} en ${month} ${year}`);
      
      // Si no se encontraron datos y aún no hemos buscado en Google Sheets, 
      // intentamos nuevamente con Google Sheets habilitado (solo si no lo habíamos habilitado antes)
      if (!shouldSearchInGoogleSheets) {
        console.log('Intentando buscar en Google Sheets como fallback...');
        
        try {
          const gsResponse = await apiClient.getCategorias(dependency, targetPeriod, { 
            topCategorias: 10, 
            buscarEnGoogleSheets: true 
          });
          
          if (gsResponse.categorias && gsResponse.categorias.length > 0) {
            console.log('✅ Datos encontrados en Google Sheets');
            
            // Transformar al formato esperado por los componentes front
            const gsResult: DependencyData[] = gsResponse.categorias.map((cat: Categoria) => ({
              category: cat.categoria,
              value: cat.total
            }));
            
            return gsResult;
          }
        } catch (gsError) {
          console.error('Error al buscar en Google Sheets:', gsError);
          
          // Si el error es 404, mostrar un mensaje más específico
          if (axios.isAxiosError(gsError) && gsError.response?.status === 404) {
            console.warn(`⚠️ No hay datos disponibles para ${dependency} en el período ${month} ${year} en ninguna fuente.`);
            console.info(`💡 Sugerencia: Intente con otro período o dependencia donde haya datos disponibles.`);
            
            // Devolvemos una categoría "sin datos" para evitar errores en la UI
            return [{
              category: "Sin datos disponibles",
              value: 0
            }];
          }
        }
      }
      
      return [];
    }
    
    // Transformar al formato esperado por los componentes front
    const result: DependencyData[] = response.categorias.map((cat: Categoria) => ({
      category: cat.categoria,
      value: cat.total
    }));
    
    // Indicar el origen de los datos para mejor diagnóstico
    if (response.origen) {
      console.log(`ℹ️ Origen de los datos: ${response.origen}`);
    }
    
    return result;
  } catch (error: unknown) {
    console.error('Error al obtener datos de dependencia:', error);
    
    // Si es un error 404, podemos mostrar un mensaje más específico
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('No se encontraron datos para esta combinación de dependencia y período');
    }
    
    return [];
  }
};

/**
 * Obtiene datos para comparar múltiples dependencias
 */
export const fetchComparisonStats = async (
  dependencies: string[],
  month: string,
  year: string
): Promise<ComparisonData[]> => {
  try {
    const targetPeriod = toPeriodFormat(month, year);
    
    if (!targetPeriod) {
      throw new Error(`Período inválido: ${month} ${year}`);
    }

    // Usar la API del backend - incluir parámetro para buscar en Google Sheets si es necesario
    const response = await apiClient.compararDependencias({
      dependencias: dependencies,
      periodo: targetPeriod,
      metricas: ['categorias'],
      buscarEnGoogleSheets: true // Habilitar búsqueda en Google Sheets si no hay datos en BD
    });
    
    if (!response.comparacion || response.comparacion.length === 0) {
      console.warn(`No se encontraron datos para comparar en ${month} ${year}`);
      return [];
    }
    
    // Transformar al formato esperado
    const result: ComparisonData[] = [];
    
    response.comparacion.forEach((item: ComparacionItem) => {
      const dependency = item.dependencia;
      
      // Si hay detalle de categorías
      if (item.categoriasDetalle) {
        Object.entries(item.categoriasDetalle).forEach(([category, data]: [string, { asignados: number, reingresados: number }]) => {
          const total = data.asignados + data.reingresados;
          result.push({
            dependency,
            category,
            value: total
          });
        });
      } else {
        // Si no hay detalle, usamos los totales
        result.push({
          dependency,
          category: 'Total',
          value: item.expedientesRecibidos
        });
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error al obtener datos de comparación:', error);
    return [];
  }
};

/**
 * Obtiene la lista de dependencias disponibles
 */
export const fetchDependencies = async (): Promise<string[]> => {
  try {
    // Usar la API del backend
    const response = await apiClient.getDependenciasDisponibles();
    
    if (!response.dependencias || response.dependencias.length === 0) {
      throw new Error('No se encontraron dependencias');
    }
    
    // Extraer solo los nombres
    const dependenciaNames = response.dependencias.map((dep: DependenciaInfo) => dep.nombre);
    console.log(`Total de dependencias encontradas: ${dependenciaNames.length}`);
    
    return dependenciaNames;
  } catch (error) {
    console.error('Error al obtener lista de dependencias:', error);
    return [];
  }
};

/**
 * Obtiene la lista de períodos disponibles
 */
export const fetchAvailablePeriods = async (): Promise<{ month: string; year: string }[]> => {
  try {
    // Usar la API del backend
    const response = await apiClient.getPeriodosDisponibles();
    
    if (!response.periodos || response.periodos.length === 0) {
      throw new Error('No se encontraron períodos');
    }
    
    // Convertir los períodos a formato legible
    const formattedPeriods = response.periodos
      .map((period: string) => formatPeriod(period))
      .filter((period: { month: string; year: string }) => period.month && period.year)
      .sort((a: { month: string; year: string }, b: { month: string; year: string }) => {
        // Ordenar por año descendente, luego por mes descendente
        if (a.year !== b.year) {
          return parseInt(b.year) - parseInt(a.year);
        }
        
        const months = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        return months.indexOf(b.month) - months.indexOf(a.month);
      });
    
    return formattedPeriods;
  } catch (error) {
    console.error('Error al obtener períodos disponibles:', error);
    return [];
  }
};

/**
 * Verifica si la API está disponible
 * @returns Un objeto con la disponibilidad y detalles adicionales
 */
export const checkAPIAvailability = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verificando disponibilidad de la API...');
    
    // Utilizar la función de checkAPIAvailability que hemos añadido en apiClient
    // para mantener todo centralizado
    const { checkAPIAvailability } = await import('../api/apiClient');
    const status = await checkAPIAvailability();
    
    console.log(`📡 Estado de la API:`, status);
    
    if (status.available) {
      console.log(`✅ API disponible: ${status.message || 'Servidor funcionando correctamente'}`);
      
      if (status.features) {
        console.log(`📊 Características del backend:
          - Google Sheets: ${status.features.googleSheets ? '✅ Habilitado' : '❌ Deshabilitado'}
          - Sincronización: ${status.features.sync ? '✅ Habilitada' : '❌ Deshabilitada'}
          - Cache: ${status.features.cache ? '✅ Habilitado' : '❌ Deshabilitado'}
        `);
      }
      
      return true;
    } else {
      console.warn(`❌ API no disponible: ${status.message || 'Error de conexión'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar disponibilidad de API:', error);
    return false;
  }
};

/**
 * Obtiene datos de evolución para una dependencia específica en un rango de períodos
 */
export const fetchEvolutionStats = async (
  dependency: string,
  startMonth: string,
  endMonth: string,
  year: string,
  objectType?: string
): Promise<EvolutionData[]> => {
  try {
    console.log('🔍 fetchEvolutionStats llamada con:', { 
      dependency, 
      startMonth, 
      endMonth, 
      year, 
      objectType 
    });
    
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const startMonthIndex = months.indexOf(startMonth);
    const endMonthIndex = months.indexOf(endMonth);
    
    if (startMonthIndex === -1 || endMonthIndex === -1) {
      throw new Error('Mes inválido');
    }
    
    // Crear período de inicio y fin
    const periodoInicio = `${year}${(startMonthIndex + 1).toString().padStart(2, '0')}`;
    const periodoFin = `${year}${(endMonthIndex + 1).toString().padStart(2, '0')}`;
    
    // Primero intentamos buscar solo en la base de datos (sin Google Sheets)
    console.log('🔍 Intentando buscar primero solo en la base de datos...');
    
    // Preparar los parámetros de la solicitud para buscar solo en BD
    const dbOnlyParams: {
      dependencias: string[];
      metrica: string;
      periodoInicio: string;
      periodoFin: string;
      buscarEnGoogleSheets: boolean;
      objetoJuicio?: string;
    } = {
      dependencias: [dependency],
      metrica: 'recibidos', // Podría ser configurable
      periodoInicio,
      periodoFin,
      buscarEnGoogleSheets: false // Primero buscamos SOLO en la base de datos
    };
    
    // Si se especificó un objeto de juicio específico y no es "TODOS",
    // incluirlo en los parámetros de la solicitud
    if (objectType && objectType !== 'TODOS') {
      console.log(`🔍 Filtrando por objeto de juicio específico: ${objectType}`);
      dbOnlyParams.objetoJuicio = objectType;
    }
    
    try {
      // Intento 1: Solo base de datos
      console.log('📊 Enviando petición de evolución (solo BD):', dbOnlyParams);
      const dbResponse = await apiClient.getEvolucion(dbOnlyParams);
      
      if (dbResponse.evolucion && dbResponse.evolucion.length > 0) {
        console.log(`✅ Datos encontrados en base de datos: ${dbResponse.evolucion.length} registros`);
        
        // Transformar al formato esperado
        const result: EvolutionData[] = dbResponse.evolucion.map((item: EvolucionItem) => {
          const formattedPeriod = formatPeriod(item.periodo);
          return {
            period: item.periodo,
            value: Number(item.valor) || 0,
            year: formattedPeriod.year,
            month: formattedPeriod.month
          };
        });
        
        // Ordenar por período
        result.sort((a, b) => a.period.localeCompare(b.period));
        
        console.log('🎯 Resultado final de evolución (desde BD):', result);
        return result;
      }
    } catch (dbError) {
      console.warn('⚠️ No se encontraron datos en la BD, continuando con Google Sheets:', dbError);
    }
    
    // Si llegamos aquí, es porque no hay datos en la BD o hubo un error
    // Ahora intentamos con Google Sheets habilitado
    console.log('🔍 No hay datos en BD. Intentando con Google Sheets...');
    
    try {
      // Preparar los parámetros de la solicitud incluyendo Google Sheets
      const fullParams = {
        ...dbOnlyParams,
        buscarEnGoogleSheets: true
      };
      
      // Usar la API del backend con los parámetros configurados para incluir Google Sheets
      console.log('📊 Enviando petición de evolución (con Google Sheets):', fullParams);
      const response = await apiClient.getEvolucion(fullParams);
      
      if (response.evolucion && response.evolucion.length > 0) {
        // Transformar al formato esperado
        const result: EvolutionData[] = response.evolucion.map((item: EvolucionItem) => {
          const formattedPeriod = formatPeriod(item.periodo);
          return {
            period: item.periodo,
            value: Number(item.valor) || 0,
            year: formattedPeriod.year,
            month: formattedPeriod.month
          };
        });
        
        // Ordenar por período
        result.sort((a, b) => a.period.localeCompare(b.period));
        
        console.log('🎯 Resultado final de evolución (incluyendo Google Sheets):', result);
        return result;
      } else {
        console.warn(`⚠️ No se encontraron datos de evolución para ${dependency} en ninguna fuente`);
      }
    } catch (gsError) {
      console.error('❌ Error al buscar en Google Sheets:', gsError);
      
      // Si es un error 404, mostramos un mensaje más claro
      if (axios.isAxiosError(gsError) && gsError.response?.status === 404) {
        console.warn(`⚠️ No hay datos disponibles para ${dependency} en el periodo seleccionado en ninguna fuente.`);
      }
    }
    
    // Si llegamos hasta aquí es porque no se encontraron datos o hubo un error.
    // Creamos datos vacíos para los meses del rango para mostrar un gráfico "sin datos"
    console.info('💡 Generando datos vacíos para mostrar un gráfico con mensaje de "sin datos"');
    
    const placeholderData: EvolutionData[] = [];
    
    // Crear periodos para el rango completo
    for (let i = startMonthIndex; i <= endMonthIndex; i++) {
      const currentMonth = months[i];
      const currentPeriod = `${year}${(i + 1).toString().padStart(2, '0')}`;
      
      placeholderData.push({
        period: currentPeriod,
        value: 0, // Sin valor
        year,
        month: currentMonth
      });
    }
    
    return placeholderData;
  } catch (error) {
    console.error('Error al obtener datos de evolución:', error);
    return [];
  }
};

/**
 * Obtiene los tipos de objetos disponibles para una dependencia específica
 */
export const fetchObjectTypes = async (): Promise<string[]> => {
  try {
    console.log('🔍 Obteniendo objetos de juicio desde la API...');
    
    // Obtener los objetos de juicio desde el backend
    const response = await apiClient.getObjetosJuicioDisponibles();
    console.log('✅ Respuesta de la API de objetos de juicio:', response);
    
    if (response.objetosJuicio && response.objetosJuicio.length > 0) {
      console.log(`✅ Se encontraron ${response.objetosJuicio.length} objetos de juicio en la API`);
      
      // Agregar la opción "TODOS" al principio y eliminar duplicados
      const allObjectTypes = ['TODOS', ...response.objetosJuicio];
      const uniqueObjectTypes = [...new Set(allObjectTypes)];
      
      console.log(`📊 Total de objetos de juicio disponibles: ${uniqueObjectTypes.length}`);
      return uniqueObjectTypes;
    } else {
      console.warn('⚠️ No se encontraron objetos de juicio en la respuesta de la API');
    }
    
    // Si no hay datos, retornar al menos la opción por defecto
    return ['TODOS'];
  } catch (error) {
    console.error('❌ Error al obtener tipos de objetos:', error);
    return ['TODOS'];
  }
};
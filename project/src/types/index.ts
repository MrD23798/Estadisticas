// Tipos centralizados para la aplicación de estadísticas
import { DependencyData, ComparisonData, EvolutionData } from '../services/csvService';

// Re-exportar tipos del servicio
export type { DependencyData, ComparisonData, EvolutionData } from '../services/csvService';

// Estados de la aplicación
export interface AppState {
  // Menús
  showVisualizationMenu: boolean;
  showComparisonMenu: boolean;
  showEvolutionMenu: boolean;
  
  // Estados de visualización
  showStats: boolean;
  showComparisonStats: boolean;
  showEvolutionStats: boolean;
  
  // Estados de carga
  loading: boolean;
  comparisonLoading: boolean;
  evolutionLoading: boolean;
  
  // Datos
  dependencyData: DependencyData[];
  comparisonData: ComparisonData[];
  evolutionData: EvolutionData[];
  dependencies: string[];
  availableObjectTypes: string[];
  csvFiles: string[];
  csvAvailable: boolean | null;
}

// Parámetros de filtros
export interface VisualizationFilters {
  selectedDependency: string;
  selectedMonth: string;
  selectedYear: string;
}

export interface ComparisonFilters {
  comparisonDependencies: string[];
  comparisonMonth: string;
  comparisonYear: string;
}

export interface EvolutionFilters {
  evolutionDependency: string;
  evolutionStartMonth: string;
  evolutionEndMonth: string;
  evolutionYear: string;
  evolutionObjectType: string;
}

// Props para componentes
export interface HeaderProps {
  title: string;
}

export interface DashboardProps {
  showStats: boolean;
  showComparisonStats: boolean;
  showEvolutionStats: boolean;
  dependencyData: DependencyData[];
  comparisonData: ComparisonData[];
  evolutionData: EvolutionData[];
  loading: boolean;
  comparisonLoading: boolean;
  evolutionLoading: boolean;
  visualizationFilters: VisualizationFilters;
  comparisonFilters: ComparisonFilters;
  evolutionFilters: EvolutionFilters;
}

// Constantes
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export type MonthName = typeof MONTH_NAMES[number];
import { useState } from 'react';
import { VisualizationFilters, ComparisonFilters, EvolutionFilters } from '../types';

export const useFilters = () => {
  // Filtros de visualización simple
  const [visualizationFilters, setVisualizationFilters] = useState<VisualizationFilters>({
    selectedDependency: '',
    selectedMonth: '',
    selectedYear: ''
  });

  // Filtros de comparación
  const [comparisonFilters, setComparisonFilters] = useState<ComparisonFilters>({
    comparisonDependencies: [],
    comparisonMonth: '',
    comparisonYear: ''
  });

  // Filtros de evolución
  const [evolutionFilters, setEvolutionFilters] = useState<EvolutionFilters>({
    evolutionDependency: '',
    evolutionStartMonth: '',
    evolutionEndMonth: '',
    evolutionYear: '',
    evolutionObjectType: 'TODOS'
  });

  // Funciones para actualizar filtros
  const updateVisualizationFilters = (filters: VisualizationFilters) => {
    setVisualizationFilters(filters);
  };

  const updateComparisonFilters = (filters: ComparisonFilters) => {
    setComparisonFilters(filters);
  };

  const updateEvolutionFilters = (filters: EvolutionFilters) => {
    setEvolutionFilters(filters);
  };

  // Función para resetear todos los filtros
  const resetAllFilters = () => {
    setVisualizationFilters({
      selectedDependency: '',
      selectedMonth: '',
      selectedYear: ''
    });
    
    setComparisonFilters({
      comparisonDependencies: [],
      comparisonMonth: '',
      comparisonYear: ''
    });
    
    setEvolutionFilters({
      evolutionDependency: '',
      evolutionStartMonth: '',
      evolutionEndMonth: '',
      evolutionYear: '',
      evolutionObjectType: 'TODOS'
    });
  };

  return {
    // Estados
    visualizationFilters,
    comparisonFilters,
    evolutionFilters,
    
    // Funciones de actualización
    updateVisualizationFilters,
    updateComparisonFilters,
    updateEvolutionFilters,
    resetAllFilters
  };
};
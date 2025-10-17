import React, { useState } from 'react';
import { useVisualizationStatistics } from './useVisualizationStatistics';
import { DarkSelect } from '../../components/ui/DarkSelect';
import { StatisticsSummary } from '../../components/charts/StatisticsSummary';
import { Chart } from '../../components/charts/Chart';
import { Chart3D } from '../../components/charts/Chart3D';

// 🎯 Componente principal que une toda la funcionalidad de visualización
export const VisualizationView: React.FC = () => {
  const {
    dependencias,
    periodos,
    loadingDependencias,
    loadingPeriodos,
    useEstadisticasByDependencia,
    useCategorias,
    useDashboard,
  } = useVisualizationStatistics();

  // Estados locales para filtros
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [includeHistory, setIncludeHistory] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'2d' | '3d'>('2d');

  // Queries condicionales basadas en selección
  const {
    data: estadisticas,
    isLoading: loadingEstadisticas,
    error: errorEstadisticas,
  } = useEstadisticasByDependencia(selectedDependency, {
    periodo: selectedPeriod,
    incluirHistorial: includeHistory,
  });

  const {
    data: categorias,
    isLoading: loadingCategorias,
  } = useCategorias(selectedDependency, selectedPeriod);

  const {
    data: dashboard,
    isLoading: loadingDashboard,
  } = useDashboard(selectedPeriod);

  // Handlers
  const handleDependencyChange = (dependency: string) => {
    setSelectedDependency(dependency);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleReset = () => {
    setSelectedDependency('');
    setSelectedPeriod('');
    setIncludeHistory(false);
  };

  const canGenerate = selectedDependency && selectedPeriod;
  const isLoading = loadingEstadisticas || loadingCategorias || loadingDashboard;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          📊 Visualización Individual
        </h2>
        <div className="flex items-center space-x-2">
          {/* Toggle 2D/3D */}
          <button
            onClick={() => setChartType(chartType === '2d' ? '3d' : '2d')}
            className="px-3 py-1 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            {chartType === '2d' ? '📊 2D' : '🧊 3D'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Selección de Dependencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dependencia
          </label>
          <DarkSelect
            value={selectedDependency}
            onChange={handleDependencyChange}
            options={dependencias.map((dep: string) => ({ value: dep, label: dep }))}
            placeholder="Selecciona una dependencia"
            disabled={loadingDependencias}
          />
        </div>

        {/* Selección de Período */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Período
          </label>
          <DarkSelect
            value={selectedPeriod}
            onChange={handlePeriodChange}
            options={periodos.map((periodo: string) => ({ 
              value: periodo, 
              label: `${periodo.slice(4, 6)}/${periodo.slice(0, 4)}` 
            }))}
            placeholder="Selecciona un período"
            disabled={loadingPeriodos}
          />
        </div>

        {/* Opciones adicionales */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-2">
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Incluir historial
          </label>
          
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando datos...</span>
        </div>
      )}

      {/* Error State */}
      {errorEstadisticas && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-4">
          <p className="font-medium">Error al cargar las estadísticas</p>
          <p className="text-sm">{(errorEstadisticas as Error).message}</p>
        </div>
      )}

      {/* Results */}
      {canGenerate && estadisticas && !isLoading && (
        <div className="space-y-6">
          {/* Summary */}
          <StatisticsSummary 
            data={estadisticas}
            categorias={categorias}
            dashboard={dashboard}
          />

          {/* Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            {chartType === '2d' ? (
              <Chart 
                data={estadisticas}
                categorias={categorias}
                type="bar"
              />
            ) : (
              <Chart3D 
                data={estadisticas}
                categorias={categorias}
              />
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!canGenerate && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            Selecciona una dependencia y período
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Para comenzar a visualizar las estadísticas
          </p>
        </div>
      )}
    </div>
  );
};
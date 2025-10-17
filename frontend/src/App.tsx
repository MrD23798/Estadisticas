import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/layout/Header';
import VisualizationPanel from './components/panels/VisualizationPanel';
import ComparisonPanel from './components/panels/ComparisonPanel';
import EvolutionPanel from './components/panels/EvolutionPanel';
import Dashboard from './components/layout/Dashboard';
import BackgroundElements from './components/layout/BackgroundElements';
import ApiStatus from './components/ApiStatus';
import { useStatistics } from './hooks/useStatistics';
import { useFilters } from './hooks/useFilters';


function App() {
  // Custom hooks
  const {
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
    generateStats,
    generateComparison,
    generateEvolution,
    loadObjectTypes,
    setShowStats,
    setShowComparisonStats,
    setShowEvolutionStats
  } = useStatistics();

  const {
    visualizationFilters,
    comparisonFilters,
    evolutionFilters,
    updateVisualizationFilters,
    updateComparisonFilters,
    updateEvolutionFilters
  } = useFilters();

  // Extraer meses y años de los períodos disponibles
  const months = [...new Set(availablePeriods.map(p => p.month))];
  const years = [...new Set(availablePeriods.map(p => p.year))].sort((a, b) => parseInt(b) - parseInt(a));

  // Handlers para generar estadísticas
  const handleGenerateStats = () => {
    generateStats(visualizationFilters);
  };

  const handleGenerateComparison = () => {
    generateComparison(comparisonFilters);
  };

  const handleGenerateEvolution = () => {
    generateEvolution(evolutionFilters);
  };

  // Handlers para reset
  const handleResetVisualization = () => {
    updateVisualizationFilters({
      selectedDependency: '',
      selectedMonth: '',
      selectedYear: ''
    });
    setShowStats(false);
  };

  const handleResetComparison = () => {
    updateComparisonFilters({
      comparisonDependencies: [],
      comparisonMonth: '',
      comparisonYear: ''
    });
    setShowComparisonStats(false);
  };

  const handleResetEvolution = () => {
    updateEvolutionFilters({
      evolutionDependency: '',
      evolutionStartMonth: '',
      evolutionEndMonth: '',
      evolutionYear: '',
      evolutionObjectType: 'TODOS'
    });
    setShowEvolutionStats(false);
  };

  const handleEvolutionDependencyChange = (dependency: string) => {
    loadObjectTypes(dependency);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center text-slate-900 dark:text-white transition-colors duration-300" style={{ margin: 0, padding: '2rem', overflow: 'hidden' }}>
        <BackgroundElements />
        <div className="w-full max-w-7xl relative z-10" style={{ margin: 0, padding: 0 }}>
        {/* Header */}
        <Header apiAvailable={apiAvailable} />

        {/* Control Panels - Diseño original horizontal */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 w-full">
          {/* Panel de Visualización */}
          <VisualizationPanel
            dependencies={dependencies}
            months={months}
            years={years}
            filters={visualizationFilters}
            onFiltersChange={updateVisualizationFilters}
            onGenerate={handleGenerateStats}
            onReset={handleResetVisualization}
            showChart={showStats}
          />

          {/* Panel de Comparación */}
          <ComparisonPanel
            dependencies={dependencies}
            months={months}
            years={years}
            filters={comparisonFilters}
            onFiltersChange={updateComparisonFilters}
            onGenerate={handleGenerateComparison}
            onReset={handleResetComparison}
          />

          {/* Panel de Evolución */}
          <EvolutionPanel
            dependencies={dependencies}
            months={months}
            years={years}
            availableObjectTypes={availableObjectTypes}
            filters={evolutionFilters}
            onFiltersChange={updateEvolutionFilters}
            onGenerate={handleGenerateEvolution}
            onReset={handleResetEvolution}
            onDependencyChange={handleEvolutionDependencyChange}
          />
        </div>

        {/* Dashboard - Área de visualizaciones */}
        <Dashboard
          showStats={showStats}
          showComparisonStats={showComparisonStats}
          showEvolutionStats={showEvolutionStats}
          dependencyData={dependencyData}
          comparisonData={comparisonData}
          evolutionData={evolutionData}
          loading={loading}
          comparisonLoading={comparisonLoading}
          evolutionLoading={evolutionLoading}
          visualizationFilters={visualizationFilters}
          comparisonFilters={comparisonFilters}
          evolutionFilters={evolutionFilters}
        />
        </div>
        
        {/* Indicador de estado de la API */}
        <ApiStatus />
      </div>
    </ThemeProvider>
  );
}

export default App;
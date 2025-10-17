import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HybridChart from '../charts/HybridChart';
import HybridComparisonChart from '../charts/HybridComparisonChart';
import HybridEvolutionChart from '../charts/HybridEvolutionChart';
import { DashboardProps } from '../../types';

const Dashboard: React.FC<DashboardProps> = ({
  showStats,
  showComparisonStats,
  showEvolutionStats,
  dependencyData,
  comparisonData,
  evolutionData,
  loading,
  comparisonLoading,
  evolutionLoading,
  visualizationFilters,
  comparisonFilters,
  evolutionFilters
}) => {
  return (
    <motion.main 
      className="flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="space-y-8">
        {/* Estadísticas Simples */}
        <AnimatePresence>
          {showStats && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Gráfico Híbrido 2D/3D */}
              <HybridChart 
                data={dependencyData}
                dependency={visualizationFilters.selectedDependency}
                month={visualizationFilters.selectedMonth}
                year={visualizationFilters.selectedYear}
                title={`Estadísticas - ${visualizationFilters.selectedDependency || 'Todas las Dependencias'}`}
                selectedObjectType="TODOS"
                width={1200}
                height={800}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estadísticas Comparativas */}
        <AnimatePresence>
          {showComparisonStats && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Gráfico Híbrido Comparativo 2D/3D */}
              <HybridComparisonChart 
                data={comparisonData}
                month={parseInt(comparisonFilters.comparisonMonth)}
                year={parseInt(comparisonFilters.comparisonYear)}
                loading={comparisonLoading}
                width={1200}
                height={800}
                comparisonDependencies={comparisonFilters.comparisonDependencies}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estadísticas de Evolución */}
        <AnimatePresence>
          {showEvolutionStats && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Gráfico Híbrido de Evolución 2D/3D */}
              <HybridEvolutionChart 
                data={evolutionData}
                dependency={evolutionFilters.evolutionDependency}
                startPeriod={evolutionFilters.evolutionStartMonth}
                endPeriod={evolutionFilters.evolutionEndMonth}
                year={evolutionFilters.evolutionYear}
                objectType={evolutionFilters.evolutionObjectType}
                loading={evolutionLoading}
                width={1200}
                height={800}
              />
            </motion.div>
          )}
        </AnimatePresence>


      </div>
    </motion.main>
  );
};

export default Dashboard;
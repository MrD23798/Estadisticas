import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import D3BarChart from './D3BarChart';
import D3GroupedBarChart from './D3GroupedBarChart';
import D3LineChart from './D3LineChart';
import { DashboardProps } from '../types';

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
              className="bg-slate-800/50 dark:bg-slate-800/50 bg-white/70 dark:bg-slate-800/50 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
              style={{ 
                margin: 0, 
                padding: 0, 
                overflow: 'hidden'
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <D3BarChart 
                data={dependencyData}
                dependency={visualizationFilters.selectedDependency}
                month={visualizationFilters.selectedMonth}
                year={visualizationFilters.selectedYear}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estadísticas Comparativas */}
        <AnimatePresence>
          {showComparisonStats && (
            <motion.div 
              className="bg-slate-800/50 rounded-lg"
              style={{ 
                margin: 0, 
                padding: 0, 
                overflow: 'hidden'
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              {comparisonFilters.comparisonDependencies.length > 0 && (
                <motion.div 
                  className="mb-4 p-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">
                    Dependencias seleccionadas:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {comparisonFilters.comparisonDependencies.map((dep, index) => (
                      <motion.span
                        key={dep}
                        className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-full text-sm border border-green-500/30"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {dep}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
              
              <D3GroupedBarChart 
                data={comparisonData}
                month={parseInt(comparisonFilters.comparisonMonth)}
                year={parseInt(comparisonFilters.comparisonYear)}
                loading={comparisonLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estadísticas de Evolución */}
        <AnimatePresence>
          {showEvolutionStats && (
            <motion.div 
              className="bg-slate-800/50 rounded-lg"
              style={{ 
                margin: 0, 
                padding: 0, 
                overflow: 'hidden'
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <D3LineChart 
                data={evolutionData}
                dependency={evolutionFilters.evolutionDependency}
                startPeriod={evolutionFilters.evolutionStartMonth}
                endPeriod={evolutionFilters.evolutionEndMonth}
                year={evolutionFilters.evolutionYear}
                objectType={evolutionFilters.evolutionObjectType}
                loading={evolutionLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>


      </div>
    </motion.main>
  );
};

export default Dashboard;
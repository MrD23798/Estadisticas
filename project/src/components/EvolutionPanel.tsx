import React, { useState } from 'react';
import { TrendingUp, ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EvolutionFilters } from '../types';
import DarkSelect from './DarkSelect';

interface EvolutionPanelProps {
  dependencies: string[];
  months: string[];
  years: string[];
  availableObjectTypes: string[];
  filters: EvolutionFilters;
  onFiltersChange: (filters: EvolutionFilters) => void;
  onGenerate: () => void;
  onReset: () => void;
  onDependencyChange: (dependency: string) => void;
}

const EvolutionPanel: React.FC<EvolutionPanelProps> = ({
  dependencies,
  months,
  years,
  availableObjectTypes,
  filters,
  onFiltersChange,
  onGenerate,
  onReset,
  onDependencyChange
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleDependencyChange = (dependency: string) => {
    onFiltersChange({
      ...filters,
      evolutionDependency: dependency
    });
    onDependencyChange(dependency);
  };

  return (
    <motion.div 
      className="w-full lg:w-1/3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <motion.button 
        onClick={toggleMenu}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-purple-500/20"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <TrendingUp className="mr-2" size={22} />
        Evolución Temporal
        <motion.div
          animate={{ rotate: showMenu ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="ml-2" size={22} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div 
            className="mt-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-gray-100">Configurar Evolución</h3>
              <motion.button 
                onClick={onReset}
                className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 flex items-center text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={14} className="mr-1" />
                Restablecer
              </motion.button>
            </div>
            
            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Dependencia</label>
              <DarkSelect
                value={filters.evolutionDependency}
                onChange={(value) => handleDependencyChange(value)}
                options={[
                  { value: '', label: 'Seleccione una dependencia' },
                  ...dependencies.map(dep => ({ value: dep, label: dep }))
                ]}
                placeholder=""
                className="focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Mes Inicial</label>
                <DarkSelect
                  value={filters.evolutionStartMonth}
                  onChange={(value) => onFiltersChange({
                    ...filters,
                    evolutionStartMonth: value
                  })}
                  options={[
                    { value: '', label: 'Inicial' },
                    ...months.map(month => ({ value: month, label: month }))
                  ]}
                  placeholder=""
                  className="focus:ring-purple-500 dark:focus:ring-purple-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Mes Final</label>
                <DarkSelect
                  value={filters.evolutionEndMonth}
                  onChange={(value) => onFiltersChange({
                    ...filters,
                    evolutionEndMonth: value
                  })}
                  options={[
                    { value: '', label: 'Final' },
                    ...months.map(month => ({ value: month, label: month }))
                  ]}
                  placeholder=""
                  className="focus:ring-purple-500 dark:focus:ring-purple-400 text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Año</label>
              <DarkSelect
                value={filters.evolutionYear}
                onChange={(value) => onFiltersChange({
                  ...filters,
                  evolutionYear: value
                })}
                options={[
                  { value: '', label: 'Seleccione un año' },
                  ...years.map(year => ({ value: year, label: year }))
                ]}
                placeholder=""
                className="focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Tipo de Objeto</label>
              <DarkSelect
                value={filters.evolutionObjectType}
                onChange={(value) => onFiltersChange({
                  ...filters,
                  evolutionObjectType: value
                })}
                options={availableObjectTypes.map(type => ({ value: type, label: type }))}
                placeholder=""
                className="focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>

            <motion.button 
              onClick={onGenerate}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-all ${
                filters.evolutionDependency && filters.evolutionStartMonth && filters.evolutionEndMonth && filters.evolutionYear
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg' 
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
              disabled={!filters.evolutionDependency || !filters.evolutionStartMonth || !filters.evolutionEndMonth || !filters.evolutionYear}
              whileHover={filters.evolutionDependency && filters.evolutionStartMonth && filters.evolutionEndMonth && filters.evolutionYear ? { scale: 1.02 } : {}}
              whileTap={filters.evolutionDependency && filters.evolutionStartMonth && filters.evolutionEndMonth && filters.evolutionYear ? { scale: 0.98 } : {}}
            >
              Generar Evolución
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EvolutionPanel;
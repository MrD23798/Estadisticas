import React from 'react';

interface PeriodSelectorProps {
  availablePeriods: {year: number, month: number}[];
  selectedYear?: number;
  selectedMonth?: number;
  onPeriodChange: (year: number, month: number) => void;
  label?: string;
  className?: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  availablePeriods,
  selectedYear,
  selectedMonth,
  onPeriodChange,
  label = 'Período',
  className = '',
}) => {
  // Get unique years
  const availableYears = [...new Set(availablePeriods.map(p => p.year))].sort((a, b) => b - a);
  
  // Get months for selected year
  const availableMonths = selectedYear 
    ? availablePeriods
        .filter(p => p.year === selectedYear)
        .map(p => p.month)
        .sort((a, b) => b - a)
    : [];

  const handleYearChange = (year: number) => {
    // Get the latest month for this year
    const monthsForYear = availablePeriods
      .filter(p => p.year === year)
      .map(p => p.month)
      .sort((a, b) => b - a);
    
    const latestMonth = monthsForYear[0] || 1;
    onPeriodChange(year, latestMonth);
  };

  const handleMonthChange = (month: number) => {
    if (selectedYear) {
      onPeriodChange(selectedYear, month);
    }
  };

  if (availablePeriods.length === 0) {
    return (
      <div className={`period-selector ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="text-sm text-gray-500">
          No hay períodos disponibles
        </div>
      </div>
    );
  }

  return (
    <div className={`period-selector ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="flex gap-3">
        {/* Year Selector */}
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Año</label>
          <select
            value={selectedYear || ''}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Seleccionar año</option>
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Mes</label>
          <select
            value={selectedMonth || ''}
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            disabled={!selectedYear || availableMonths.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar mes</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {MONTH_NAMES[month - 1]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Selection Display */}
      {selectedYear && selectedMonth && (
        <div className="mt-2 text-sm text-gray-600">
          Período seleccionado: <span className="font-medium">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </span>
        </div>
      )}
    </div>
  );
};
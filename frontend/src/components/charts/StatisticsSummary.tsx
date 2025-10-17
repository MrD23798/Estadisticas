import React from 'react';
import { StatisticsSummary as SummaryData } from '../services/masterDatabaseService';

interface StatisticsSummaryProps {
  data: SummaryData[];
  isLoading: boolean;
  error: string | null;
  className?: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const StatisticsSummary: React.FC<StatisticsSummaryProps> = ({
  data,
  isLoading,
  error,
  className = '',
}) => {
  const getPlantillaShortName = (plantilla: string): string => {
    if (plantilla.includes('Previsional')) return 'Previsional';
    if (plantilla.includes('Tributaria')) return 'Tributaria';
    if (plantilla.includes('Sala')) return 'Sala';
    return 'Otro';
  };

  const getPlantillaColor = (plantilla: string): string => {
    if (plantilla.includes('Previsional')) return 'bg-blue-100 text-blue-800';
    if (plantilla.includes('Tributaria')) return 'bg-green-100 text-green-800';
    if (plantilla.includes('Sala')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Group data by plantilla
  const groupedData = data.reduce((acc, item) => {
    const key = getPlantillaShortName(item.plantilla);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, SummaryData[]>);

  if (isLoading) {
    return (
      <div className={`statistics-summary ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Estadísticas
          </h3>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando resumen...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`statistics-summary ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Estadísticas
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar resumen</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`statistics-summary ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Estadísticas
          </h3>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos disponibles</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron estadísticas para el período seleccionado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`statistics-summary ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen de Estadísticas
        </h3>

        <div className="space-y-6">
          {Object.entries(groupedData).map(([plantillaType, items]) => (
            <div key={plantillaType} className="border-b border-gray-200 pb-4 last:border-b-0">
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getPlantillaColor(items[0].plantilla)}`}>
                  {plantillaType}
                </span>
                <span className="text-sm text-gray-600">
                  ({items.length} {items.length === 1 ? 'dependencia' : 'dependencias'})
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items
                  .sort((a, b) => {
                    // Sort by year desc, month desc, numero asc
                    if (a.anio !== b.anio) return b.anio - a.anio;
                    if (a.mes !== b.mes) return b.mes - a.mes;
                    return a.numero - b.numero;
                  })
                  .map((item) => (
                    <div
                      key={`${item.plantilla}-${item.numero}-${item.anio}-${item.mes}`}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-gray-900">
                          {getPlantillaShortName(item.plantilla)} #{item.numero}
                        </div>
                        <div className="text-xs text-gray-500">
                          {MONTH_NAMES[item.mes - 1]} {item.anio}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Registros:</span>
                          <span className="font-medium text-gray-900">
                            {item.totalRecords.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Actualizado: {formatDate(item.lastUpdated)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Summary for this plantilla type */}
              <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-900">
                      {items.length}
                    </div>
                    <div className="text-blue-700">Dependencias</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-900">
                      {items.reduce((sum, item) => sum + item.totalRecords, 0).toLocaleString()}
                    </div>
                    <div className="text-blue-700">Total Registros</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-900">
                      {Math.round(items.reduce((sum, item) => sum + item.totalRecords, 0) / items.length).toLocaleString()}
                    </div>
                    <div className="text-blue-700">Promedio</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {Object.keys(groupedData).length}
              </div>
              <div className="text-sm text-gray-600">Tipos</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {data.length}
              </div>
              <div className="text-sm text-gray-600">Dependencias</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {data.reduce((sum, item) => sum + item.totalRecords, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Registros</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.totalRecords, 0) / data.length).toLocaleString() : '0'}
              </div>
              <div className="text-sm text-gray-600">Promedio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
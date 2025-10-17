import { useState } from 'react';
import {
  useEstadisticasPage,
  useDashboardPage,
} from '../hooks/useApi';
import type { EstadisticasFiltros } from '../types/api';

// ===== COMPONENTE DE EJEMPLO: PÁGINA DE ESTADÍSTICAS =====

export function EstadisticasPage() {
  const {
    estadisticas,
    dependencias,
    periodos,
    pagination,
    loading,
    error,
    filtros,
    updateFiltros,
    resetFiltros,
    refetch
  } = useEstadisticasPage({
    limit: 20
  });

  const handleFiltroChange = (key: keyof EstadisticasFiltros, value: unknown) => {
    updateFiltros({ [key]: value });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={refetch}
          className="mt-2 bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dependencia ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependencia ID
            </label>
            <input
              type="number"
              value={filtros.dependenciaId || ''}
              onChange={(e) => handleFiltroChange('dependenciaId', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full border rounded-md px-3 py-2"
              placeholder="ID de dependencia"
            />
          </div>

          {/* Período Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período Inicio
            </label>
            <input
              type="text"
              value={filtros.periodoInicio || ''}
              onChange={(e) => handleFiltroChange('periodoInicio', e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              placeholder="YYYYMM (ej: 202401)"
            />
          </div>

          {/* Período Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período Fin
            </label>
            <input
              type="text"
              value={filtros.periodoFin || ''}
              onChange={(e) => handleFiltroChange('periodoFin', e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              placeholder="YYYYMM (ej: 202412)"
            />
          </div>

          {/* Límite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registros por página
            </label>
            <select
              value={filtros.limit || 20}
              onChange={(e) => handleFiltroChange('limit', parseInt(e.target.value))}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Página */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Página
            </label>
            <input
              type="number"
              min="1"
              value={filtros.page || 1}
              onChange={(e) => handleFiltroChange('page', parseInt(e.target.value))}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 space-x-2">
          <button
            onClick={resetFiltros}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Limpiar Filtros
          </button>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Información de Paginación */}
      {pagination && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} registros
            </span>
            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>
          </div>
        </div>
      )}

      {/* Tabla de Estadísticas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Estadísticas</h2>
        </div>
        
        {estadisticas && estadisticas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dependencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Existentes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recibidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reingresados
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estadisticas.map((estadistica) => (
                  <tr key={estadistica.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estadistica.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estadistica.dependencia.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estadistica.periodo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estadistica.expedientesExistentes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estadistica.expedientesRecibidos.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estadistica.expedientesReingresados.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            No se encontraron estadísticas con los filtros aplicados.
          </div>
        )}
      </div>

      {/* Navegación de Páginas */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => handleFiltroChange('page', Math.max(1, (filtros.page || 1) - 1))}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            
            <span className="px-3 py-2 text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handleFiltroChange('page', Math.min(pagination.totalPages, (filtros.page || 1) + 1))}
              disabled={!pagination.hasNext}
              className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== COMPONENTE DE EJEMPLO: DASHBOARD =====

export function DashboardPage() {
  const [periodo] = useState('2024');
  const [syncSecret, setSyncSecret] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);

  const {
    dashboard,
    loading,
    error,
    syncing,
    syncError,
    syncSuccess,
    refetch,
    handleSync,
    resetSync
  } = useDashboardPage(periodo);

  const onSyncSubmit = async () => {
    if (syncSecret.trim()) {
      await handleSync(syncSecret);
      if (!syncError) {
        setShowSyncModal(false);
        setSyncSecret('');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acción de sync */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard - {periodo}
          </h1>
          <div className="space-x-2">
            <button
              onClick={refetch}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Actualizar
            </button>
            <button
              onClick={() => setShowSyncModal(true)}
              disabled={syncing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>

        {/* Indicadores de sync */}
        {syncSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            ✓ Sincronización completada exitosamente
          </div>
        )}

        {syncError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between items-center">
            <span>Error en sincronización: {syncError}</span>
            <button
              onClick={resetSync}
              className="text-red-800 hover:text-red-900 underline"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Contenido del Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Expedientes</h3>
            <p className="text-3xl font-bold text-blue-600">
              {dashboard.resumen?.totalExpedientes?.toLocaleString() || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Existentes</h3>
            <p className="text-3xl font-bold text-green-600">
              {dashboard.resumen?.expedientesExistentes?.toLocaleString() || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Recibidos</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {dashboard.resumen?.expedientesRecibidos?.toLocaleString() || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Reingresados</h3>
            <p className="text-3xl font-bold text-purple-600">
              {dashboard.resumen?.expedientesReingresados?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}

      {/* Modal de Sincronización */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Sincronizar Datos</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clave de administrador
                </label>
                <input
                  type="password"
                  value={syncSecret}
                  onChange={(e) => setSyncSecret(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Ingrese la clave secreta"
                />
              </div>
              
              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncSecret('');
                    resetSync();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={onSyncSubmit}
                  disabled={syncing || !syncSecret.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
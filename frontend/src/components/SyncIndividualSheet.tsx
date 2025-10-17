import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '../api/apiClient';

interface SyncFormData {
  sheetId: string;
  periodo: string;
  dependencia: string;
}

export function SyncIndividualSheet() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SyncFormData>();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<{
    checked: boolean;
    isSynced?: boolean;
    message?: string;
  }>({ checked: false });
  
  // Función para verificar si la hoja ya está sincronizada
  const checkSheetStatus = async (sheetId: string) => {
    if (!sheetId || sheetId.trim() === '') return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.verificarEstadoHoja(sheetId);
      setSheetStatus({
        checked: true,
        isSynced: response.isSynced,
        message: response.message
      });
      setError(null);
    } catch (error: any) {
      setError(`Error al verificar la hoja: ${error.message}`);
      setSheetStatus({ checked: false });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para sincronizar una hoja
  const onSubmit = async (data: SyncFormData) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await apiClient.sincronizarHojaIndividual(data);
      setResult(response);
      
      if (response.success) {
        reset();  // Limpiar el formulario si fue exitoso
        setSheetStatus({ checked: false });
      }
    } catch (error: any) {
      setError(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Sincronizar Hoja Individual</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID de Google Sheet
          </label>
          <div className="flex">
            <input
              {...register('sheetId', { 
                required: 'El ID de la hoja es requerido',
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: 'Ingrese un ID de hoja válido'
                }
              })}
              className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Ej: 1AHi-ksvNFvRatDXsR607nKCS2V8v7FNbQJJW035PPig"
              onBlur={(e) => checkSheetStatus(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => checkSheetStatus(document.querySelector<HTMLInputElement>('input[name="sheetId"]')?.value || '')}
              className="bg-gray-100 text-gray-700 px-3 rounded-r-md border border-gray-300 hover:bg-gray-200"
              disabled={isLoading}
            >
              Verificar
            </button>
          </div>
          {errors.sheetId && (
            <p className="mt-1 text-sm text-red-600">{errors.sheetId.message}</p>
          )}
          
          {sheetStatus.checked && (
            <p className={`mt-1 text-sm ${sheetStatus.isSynced ? 'text-orange-600' : 'text-green-600'}`}>
              {sheetStatus.message}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Periodo (YYYYMM)
          </label>
          <input
            {...register('periodo', { 
              required: 'El periodo es requerido',
              pattern: {
                value: /^20\d{2}(0[1-9]|1[0-2])$/,
                message: 'El periodo debe tener formato YYYYMM (ejemplo: 202410)'
              }
            })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Ej: 202410"
          />
          {errors.periodo && (
            <p className="mt-1 text-sm text-red-600">{errors.periodo.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dependencia
          </label>
          <input
            {...register('dependencia', { 
              required: 'La dependencia es requerida'
            })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Ej: JUZGADO FEDERAL DE MENDOZA"
          />
          {errors.dependencia && (
            <p className="mt-1 text-sm text-red-600">{errors.dependencia.message}</p>
          )}
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || isSubmitting || (sheetStatus.checked && sheetStatus.isSynced)}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white 
              ${isLoading || isSubmitting || (sheetStatus.checked && sheetStatus.isSynced) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
          >
            {isLoading || isSubmitting ? 'Procesando...' : 'Sincronizar Hoja'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {result && (
        <div className={`mt-4 p-3 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className={result.success ? 'text-green-700' : 'text-yellow-700'}>
            {result.message}
          </p>
          {result.success && result.registrosInsertados && (
            <p className="text-green-700 mt-1">
              Registros insertados: {result.registrosInsertados}
            </p>
          )}
        </div>
      )}
      
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Instrucciones:</h3>
        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
          <li>Ingresa el ID de la hoja de Google Sheets (la parte final de la URL)</li>
          <li>Verifica si la hoja ya está sincronizada haciendo clic en "Verificar"</li>
          <li>Ingresa el periodo en formato YYYYMM (ej: 202410 para Octubre 2024)</li>
          <li>Ingresa el nombre exacto de la dependencia</li>
          <li>Haz clic en "Sincronizar Hoja" para importar los datos</li>
        </ol>
      </div>
    </div>
  );
}
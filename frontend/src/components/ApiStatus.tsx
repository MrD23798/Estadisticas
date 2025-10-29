import { useEffect, useState } from 'react';
import { resolveApiBaseUrl } from '../trpc/client';

type ApiStatusInfo = {
  available: boolean;
  message?: string;
  version?: string;
  environment?: string;
  database?: {
    connected: boolean;
    info?: unknown;
  };
  features?: {
    googleSheets: boolean;
    sync: boolean;
    cache: boolean;
  };
};

const ApiStatus = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [message, setMessage] = useState<string>('Comprobando conexión con la API...');
  const [info, setInfo] = useState<ApiStatusInfo | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setStatus('checking');
        setMessage('Comprobando conexión con la API...');
        
        // Reemplazo simple: consulta al endpoint /health directamente
        const response = await fetch(`${resolveApiBaseUrl()}/health`, { credentials: 'include' });
        const data = await response.json();
        const result = {
          available: data?.status === 'ok',
          message: data?.status,
          version: data?.version,
          environment: data?.environment,
          database: data?.database,
          features: data?.features,
        } as ApiStatusInfo;
        setInfo(result);
        
        if (result.available) {
          setStatus('online');
          setMessage(`API ${result.version || ''} ${result.environment ? `(${result.environment})` : ''}`);
        } else {
          setStatus('offline');
          setMessage(`Error: ${result.message || 'No se pudo conectar al servidor'}`);
        }
      } catch (error) {
        setStatus('offline');
        setMessage(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setInfo(null);
      }
    };

    checkStatus();
    
    // Comprobar periódicamente
    const interval = setInterval(checkStatus, 30000); // Cada 30 segundos
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const toggleDetails = () => {
    setShowDetails(prev => !prev);
  };

  return (
    <div 
      className={`api-status fixed bottom-4 right-4 p-2 rounded-md shadow-md z-50 transition-all duration-200 
      ${status === 'checking' ? 'bg-yellow-100 text-yellow-800' : 
        status === 'online' ? 'bg-green-100 text-green-800' : 
        'bg-red-100 text-red-800'
      } ${showDetails ? 'w-64' : 'w-auto'}`}
      onClick={toggleDetails}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          status === 'checking' ? 'bg-yellow-500 animate-pulse' : 
          status === 'online' ? 'bg-green-500' : 
          'bg-red-500'
        }`}></div>
        <span className="text-sm font-medium">{message}</span>
      </div>

      {showDetails && info && (
        <div className="mt-2 text-xs border-t pt-2 border-gray-200">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">Versión:</span>
            <span>{info.version || 'N/A'}</span>
            
            <span className="font-medium">Ambiente:</span>
            <span>{info.environment || 'N/A'}</span>
            
            <span className="font-medium">Base de datos:</span>
            <span>{info.database?.connected ? '✅ Conectada' : '❌ Desconectada'}</span>
            
            {info.features && (
              <>
                <span className="font-medium">Google Sheets:</span>
                <span>{info.features.googleSheets ? '✅ Habilitado' : '❌ Deshabilitado'}</span>
                
                <span className="font-medium">Sincronización:</span>
                <span>{info.features.sync ? '✅ Habilitada' : '❌ Deshabilitada'}</span>
                
                <span className="font-medium">Cache:</span>
                <span>{info.features.cache ? '✅ Habilitado' : '❌ Deshabilitado'}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiStatus;
import { SyncIndividualSheet } from '../components/SyncIndividualSheet';

export function SyncPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Sincronización de Datos
      </h1>
      
      <div className="grid grid-cols-1 gap-8">
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Sincronización General</h2>
            <p className="text-gray-600 mb-4">
              La sincronización general descarga todos los datos de Google Sheets. Este proceso puede tardar varios minutos
              y se ejecuta automáticamente cuando inicia el servidor en modo desarrollo.
            </p>
            <a 
              href="/api/v1/estadisticas/sync" 
              target="_blank" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Ejecutar Sincronización General
            </a>
          </div>
        </div>
        
        <div>
          <SyncIndividualSheet />
        </div>
      </div>
    </div>
  );
}
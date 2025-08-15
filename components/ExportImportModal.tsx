
'use client';

import { useState } from 'react';
import { exportData, importData } from '@/lib/storage';

interface ExportImportModalProps {
  onClose: () => void;
}

export default function ExportImportModal({ onClose }: ExportImportModalProps) {
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deudas-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleImport = () => {
    try {
      if (!importText.trim()) {
        alert('Por favor pega los datos a importar');
        return;
      }

      const success = importData(importText);
      if (success) {
        alert('Datos importados correctamente');
        window.location.reload();
      } else {
        alert('Error: Los datos no tienen el formato correcto');
      }
    } catch (error) {
      alert('Error al importar los datos. Verifica el formato.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {showImport ? 'Importar Datos' : 'Exportar/Importar'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {!showImport ? (
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
              <h3 className="font-medium text-white mb-2 flex items-center">
                <i className="ri-download-line mr-2 text-green-400"></i>
                Exportar Datos
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                Descarga un archivo con todas tus deudas y pagos como respaldo.
              </p>
              <button
                onClick={handleExport}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
              >
                <i className="ri-download-line mr-2"></i>
                Descargar Respaldo
              </button>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
              <h3 className="font-medium text-white mb-2 flex items-center">
                <i className="ri-upload-line mr-2 text-red-400"></i>
                Importar Datos
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                Restaura tus datos desde un archivo de respaldo previo.
              </p>
              <button
                onClick={() => setShowImport(true)}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                <i className="ri-upload-line mr-2"></i>
                Importar Respaldo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pega aquí el contenido del archivo de respaldo:
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-white placeholder-gray-400 text-xs"
                placeholder="Pega aquí el contenido JSON del archivo..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
              >
                Volver
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                Importar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
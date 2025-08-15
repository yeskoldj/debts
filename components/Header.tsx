
'use client';

import { useState } from 'react';
import ExportImportModal from './ExportImportModal';

interface HeaderProps {
  onProgressClick?: () => void;
  showProgressButton?: boolean;
}

export default function Header({ onProgressClick, showProgressButton }: HeaderProps) {
  const [showExportImport, setShowExportImport] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3">
                <i className="ri-money-dollar-circle-line text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">DebtFree</h1>
                <p className="text-xs text-gray-400">Control de Deudas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {showProgressButton && (
                <button
                  onClick={onProgressClick}
                  className="w-10 h-10 flex items-center justify-center text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition-all duration-200"
                  title="Ver progreso"
                >
                  <i className="ri-line-chart-line text-lg"></i>
                </button>
              )}
              
              <button
                onClick={() => setShowExportImport(true)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                title="Exportar/Importar"
              >
                <i className="ri-download-cloud-line text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {showExportImport && (
        <ExportImportModal onClose={() => setShowExportImport(false)} />
      )}
    </>
  );
}

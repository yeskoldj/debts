
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DebtCard from '@/components/DebtCard';
import AddDebtModal from '@/components/AddDebtModal';
import FilterTabs from '@/components/FilterTabs';
import FinancialPlannerModal from '@/components/FinancialPlannerModal';
import ProgressTracker from '@/components/ProgressTracker';
import FinancialProgressDashboard from '@/components/FinancialProgressDashboard';
import { Debt, DebtFilter } from '@/lib/types';
import { getDebts, saveDebt, loadSampleDebts } from '@/lib/storage';
import { getSavedFinancialPlan } from '@/lib/financialPlan';
import { initNotifications } from '@/lib/notifications';

export default function Home() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filter, setFilter] = useState<DebtFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [hasSavedPlan, setHasSavedPlan] = useState(false);

  useEffect(() => {
    loadDebts();
    initializeApp();
    checkForSavedPlan();
  }, []);

  const checkForSavedPlan = () => {
    const savedPlan = getSavedFinancialPlan();
    setHasSavedPlan(!!savedPlan);
  };

  const initializeApp = async () => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado');
      } catch (error) {
        console.log('Error al registrar Service Worker:', error);
      }
    }

    // Inicializar notificaciones
    await initNotifications();
  };

  const loadDebts = () => {
    const savedDebts = getDebts();
    setDebts(savedDebts);
  };

  const handleLoadSampleData = () => {
    if (confirm('¿Estás seguro de que quieres cargar todas las deudas del resumen? Esto reemplazará los datos actuales.')) {
      loadSampleDebts();
      loadDebts();
    }
  };

  const handleAddDebt = (debtData: Omit<Debt, 'id' | 'payments' | 'createdAt'>) => {
    const newDebt: Debt = {
      ...debtData,
      id: Date.now().toString(),
      payments: [],
      createdAt: new Date().toISOString()
    };
    saveDebt(newDebt);
    loadDebts();
    setShowAddModal(false);
  };

  const filteredDebts = debts.filter(debt => {
    const principalPaid = debt.payments.filter(p => p.type === 'principal').reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = debt.totalAmount - principalPaid;
    
    switch (filter) {
      case 'active':
        return remainingAmount > 0;
      case 'paid':
        return remainingAmount <= 0;
      default:
        return true;
    }
  });

  const totalAmount = debts.reduce((sum, debt) => sum + debt.totalAmount, 0);
  const totalRemaining = debts.reduce((sum, debt) => {
    const principalPaid = debt.payments.filter(p => p.type === 'principal').reduce((paidSum, payment) => paidSum + payment.amount, 0);
    return sum + (debt.totalAmount - principalPaid);
  }, 0);

  const activeDebtsCount = debts.filter(debt => {
    const principalPaid = debt.payments.filter(p => p.type === 'principal').reduce((sum, payment) => sum + payment.amount, 0);
    return debt.totalAmount - principalPaid > 0;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header 
        onProgressClick={() => setShowProgressTracker(true)}
        showProgressButton={activeDebtsCount > 0}
      />
      
      <div className="pt-20 pb-6 px-4">
        <div className="max-w-md mx-auto">
          {/* Resumen total */}
          {debts.length > 0 && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  ${totalRemaining.toFixed(2)}
                </div>
                <div className="text-sm text-gray-300 mb-3">
                  de ${totalAmount.toFixed(2)} total restante
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  {activeDebtsCount} deuda{activeDebtsCount !== 1 ? 's' : ''} activa{activeDebtsCount !== 1 ? 's' : ''}
                </div>
                
                {/* Botones del planificador */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowPlannerModal(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg font-medium"
                  >
                    <i className="ri-calculator-line mr-2"></i>
                    {hasSavedPlan ? 'Ver Plan Financiero' : 'Crear Plan Inteligente'}
                  </button>
                  
                  {hasSavedPlan && (
                    <button
                      onClick={() => setShowProgressDashboard(true)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 shadow-lg font-medium text-sm"
                    >
                      <i className="ri-dashboard-line mr-2"></i>
                      Ver Progreso del Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <FilterTabs currentFilter={filter} onFilterChange={setFilter} />
          
          <div className="space-y-4 mt-6">
            {filteredDebts.map(debt => (
              <DebtCard 
                key={debt.id} 
                debt={debt} 
                onUpdate={() => {
                  loadDebts();
                  checkForSavedPlan();
                }}
              />
            ))}
            
            {filteredDebts.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-file-list-3-line text-4xl text-gray-500 mb-4"></i>
                <p className="text-gray-300 mb-4">
                  {filter === 'active' ? 'No tienes deudas activas' : 
                   filter === 'paid' ? 'No tienes deudas pagadas' : 
                   'No tienes deudas registradas'}
                </p>
                {debts.length === 0 && (
                  <button
                    onClick={handleLoadSampleData}
                    className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm border border-red-500/30"
                  >
                    Cargar deudas del resumen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105"
      >
        <i className="ri-add-line text-2xl"></i>
      </button>

      {showAddModal && (
        <AddDebtModal
          onSave={handleAddDebt}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showPlannerModal && (
        <FinancialPlannerModal
          onClose={() => {
            setShowPlannerModal(false);
            checkForSavedPlan();
          }}
        />
      )}

      {showProgressTracker && (
        <ProgressTracker
          onClose={() => setShowProgressTracker(false)}
        />
      )}

      {showProgressDashboard && (
        <FinancialProgressDashboard
          onClose={() => setShowProgressDashboard(false)}
        />
      )}
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DebtCard from '@/components/DebtCard';
import AddDebtModal from '@/components/AddDebtModal';
import FilterTabs from '@/components/FilterTabs';
import FinancialPlannerModal from '@/components/FinancialPlannerModal';
import ProgressTracker from '@/components/ProgressTracker';
import FinancialProgressDashboard from '@/components/FinancialProgressDashboard';
import AddSavingGoalModal from '@/components/AddSavingGoalModal';
import SavingGoalCard from '@/components/SavingGoalCard';
import UpdateSavingGoalModal from '@/components/UpdateSavingGoalModal';
import { Debt, DebtFilter, SavingGoal } from '@/lib/types';
import { getDebts, saveDebt, loadSampleDebts, getSavingGoals, saveSavingGoal, deleteSavingGoal, recordSavingContribution } from '@/lib/storage';
import { getSavedFinancialPlan } from '@/lib/financialPlan';
import { initNotifications } from '@/lib/notifications';
import { formatCurrency, generateId } from '@/lib/utils';

export default function Home() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filter, setFilter] = useState<DebtFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [hasSavedPlan, setHasSavedPlan] = useState(false);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalToContribute, setGoalToContribute] = useState<SavingGoal | null>(null);

  useEffect(() => {
    loadDebts();
    loadSavingGoals();
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

  const loadSavingGoals = () => {
    const goals = getSavingGoals();
    setSavingGoals(goals);
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
      id: generateId(),
      payments: [],
      createdAt: new Date().toISOString()
    };
    saveDebt(newDebt);
    loadDebts();
    setShowAddModal(false);
  };

  const handleAddSavingGoal = (goalData: Omit<SavingGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newGoal: SavingGoal = {
      ...goalData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      lastContributionAt: goalData.currentAmount > 0 ? now : null,
      lastContributionNote: undefined
    };

    saveSavingGoal(newGoal);
    loadSavingGoals();
    setShowAddGoalModal(false);
  };

  const handleDeleteSavingGoal = (goalId: string) => {
    if (confirm('¿Eliminar este objetivo de ahorro?')) {
      deleteSavingGoal(goalId);
      loadSavingGoals();
    }
  };

  const handleContributeToGoal = (amount: number, note?: string) => {
    if (!goalToContribute) return;

    recordSavingContribution(goalToContribute.id, amount, note);
    loadSavingGoals();
    setGoalToContribute(null);
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

  const totalGoalsSaved = savingGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const completedGoals = savingGoals.filter(goal => goal.currentAmount >= goal.targetAmount).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header
        onProgressClick={() => setShowProgressTracker(true)}
        showProgressButton={activeDebtsCount > 0}
      />
      
      <div className="pt-20 pb-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <i className="ri-piggy-bank-line mr-2 text-green-400"></i>
                  Objetivos de ahorro
                </h2>
                <p className="text-xs text-gray-400">Organiza tus ahorros sin descuidar tus obligaciones.</p>
              </div>
              <button
                onClick={() => setShowAddGoalModal(true)}
                className="px-3 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
              >
                <i className="ri-add-line mr-1"></i>
                Nuevo objetivo
              </button>
            </div>

            {savingGoals.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="p-3 bg-gray-700/40 rounded-lg border border-gray-600/40">
                    <div className="text-xs text-gray-400">Metas activas</div>
                    <div className="text-white font-semibold">{savingGoals.length}</div>
                  </div>
                  <div className="p-3 bg-gray-700/40 rounded-lg border border-gray-600/40">
                    <div className="text-xs text-gray-400">Ahorro acumulado</div>
                    <div className="text-green-300 font-semibold">{formatCurrency(totalGoalsSaved)}</div>
                  </div>
                  <div className="p-3 bg-gray-700/40 rounded-lg border border-gray-600/40">
                    <div className="text-xs text-gray-400">Metas logradas</div>
                    <div className="text-blue-300 font-semibold">{completedGoals}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {savingGoals.map(goal => (
                    <SavingGoalCard
                      key={goal.id}
                      goal={goal}
                      onDelete={handleDeleteSavingGoal}
                      onContribute={(selectedGoal) => setGoalToContribute(selectedGoal)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <i className="ri-flag-line text-3xl text-gray-500 mb-2"></i>
                <p className="text-sm text-gray-300 mb-2">Crea tu primer objetivo para impulsar tu ahorro.</p>
                <p className="text-xs text-gray-400">Después de cubrir las deudas prioritarias, el plan asignará fondos aquí automáticamente.</p>
              </div>
            )}
          </div>

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

      {showAddGoalModal && (
        <AddSavingGoalModal
          onSave={handleAddSavingGoal}
          onClose={() => setShowAddGoalModal(false)}
        />
      )}

      {goalToContribute && (
        <UpdateSavingGoalModal
          goal={goalToContribute}
          onContribute={handleContributeToGoal}
          onClose={() => setGoalToContribute(null)}
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

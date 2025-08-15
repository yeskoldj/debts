
'use client';

import { useState, useEffect } from 'react';
import { Debt } from '@/lib/types';
import { getDebts } from '@/lib/storage';
import { getDaysUntilDue, formatCurrency } from '@/lib/utils';
import { 
  saveFinancialPlan, 
  getSavedFinancialPlan, 
  updateFinancialPlan, 
  deleteSavedPlan, 
  generateRecommendations,
  getWeeklyIncome,
  SavedFinancialPlan,
  DebtRecommendation
} from '@/lib/financialPlan';
import DailyIncomeTracker from './DailyIncomeTracker';
import DailyExpenseTracker from './DailyExpenseTracker';

interface FinancialPlannerModalProps {
  onClose: () => void;
}

interface WeeklyPlan {
  totalIncome: number;
  essentialExpenses: number;
  availableForDebts: number;
  recommendations: DebtRecommendation[];
  weeklyTarget: number;
}

export default function FinancialPlannerModal({ onClose }: FinancialPlannerModalProps) {
  const [weeklyIncome, setWeeklyIncome] = useState('');
  const [foodGas, setFoodGas] = useState('');
  const [otherExpenses, setOtherExpenses] = useState('');
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedFinancialPlan | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showIncomeTracker, setShowIncomeTracker] = useState(false);
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [useRealIncomeData, setUseRealIncomeData] = useState(false);
  const [useRealExpenseData, setUseRealExpenseData] = useState(false);

  useEffect(() => {
    const existing = getSavedFinancialPlan();
    if (existing) {
      setSavedPlan(existing);
      setShowProgress(true);
    }
  }, []);

  const getRealWeeklyIncome = () => {
    return getWeeklyIncome();
  };

  const getRealWeeklyExpenses = () => {
    if (typeof window === 'undefined') return { food: 0, gas: 0, other: 0, total: 0 };
    try {
      const stored = localStorage.getItem('dailyExpenses');
      if (!stored) return { food: 0, gas: 0, other: 0, total: 0 };

      const dailyExpenses = JSON.parse(stored);
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      return dailyExpenses
        .filter((expense: any) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= sevenDaysAgo && expenseDate <= today;
        })
        .reduce((totals: any, expense: any) => ({
          food: totals.food + expense.foodAmount,
          gas: totals.gas + expense.gasAmount,
          other: totals.other + expense.otherAmount,
          total: totals.total + expense.foodAmount + expense.gasAmount + expense.otherAmount
        }), { food: 0, gas: 0, other: 0, total: 0 });
    } catch {
      return { food: 0, gas: 0, other: 0, total: 0 };
    }
  };

  useEffect(() => {
    if (useRealIncomeData) {
      const realIncome = getRealWeeklyIncome();
      setWeeklyIncome(realIncome.toString());
    }
  }, [useRealIncomeData]);

  useEffect(() => {
    if (useRealExpenseData) {
      const realExpenses = getRealWeeklyExpenses();
      setFoodGas((realExpenses.food + realExpenses.gas).toString());
      setOtherExpenses(realExpenses.other.toString());
    }
  }, [useRealExpenseData]);

  const calculatePlan = () => {
    const income = parseFloat(weeklyIncome) || 0;
    const food = parseFloat(foodGas) || 0;
    const other = parseFloat(otherExpenses) || 0;

    if (income <= 0) {
      alert('Por favor ingresa tus ingresos semanales');
      return;
    }

    const totalExpenses = food + other;
    const available = income - totalExpenses;

    if (available <= 0) {
      alert('Tus gastos superan tus ingresos. Necesitas reducir gastos o aumentar ingresos.');
      return;
    }

    const debts = getDebts();
    const activeDebts = debts.filter(debt => {
      const paid = debt.payments.filter(p => p.type === 'principal').reduce((sum, p) => sum + p.amount, 0);
      return debt.totalAmount - paid > 0;
    });

    if (activeDebts.length === 0) {
      alert('¡Felicidades! No tienes deudas activas.');
      return;
    }

    const recommendations = generateRecommendations(activeDebts, available);

    const newPlan: WeeklyPlan = {
      totalIncome: income,
      essentialExpenses: totalExpenses,
      availableForDebts: available,
      recommendations,
      weeklyTarget: recommendations.reduce((sum, rec) => sum + rec.suggestedPayment, 0)
    };

    setPlan(newPlan);
    setShowPlan(true);
  };

  const handleSavePlan = () => {
    if (!plan) return;

    const saved = saveFinancialPlan({
      weeklyIncome: plan.totalIncome,
      essentialExpenses: plan.essentialExpenses,
      otherExpenses: parseFloat(otherExpenses) || 0,
      availableForDebts: plan.availableForDebts,
      weeklyTarget: plan.weeklyTarget,
      recommendations: plan.recommendations
    });

    setSavedPlan(saved);
    setShowPlan(false);
    setShowProgress(true);
  };

  const handleUpdatePlan = () => {
    if (!savedPlan) return;

    // Actualizar con datos reales actuales
    const currentIncome = getRealWeeklyIncome();
    const currentExpenses = getRealWeeklyExpenses();
    const newAvailable = currentIncome - currentExpenses.total;

    if (newAvailable <= 0) {
      alert('Tus gastos actuales superan tus ingresos. Revisa tu situación financiera.');
      return;
    }

    const debts = getDebts();
    const activeDebts = debts.filter(debt => {
      const paid = debt.payments.filter(p => p.type === 'principal').reduce((sum, p) => sum + p.amount, 0);
      return debt.totalAmount - paid > 0;
    });

    const newRecommendations = generateRecommendations(activeDebts, newAvailable);

    const updated = updateFinancialPlan({
      weeklyIncome: currentIncome,
      essentialExpenses: currentExpenses.food + currentExpenses.gas,
      otherExpenses: currentExpenses.other,
      availableForDebts: newAvailable,
      weeklyTarget: newRecommendations.reduce((sum, rec) => sum + rec.suggestedPayment, 0),
      recommendations: newRecommendations
    });

    if (updated) {
      setSavedPlan(updated);
      alert('Plan actualizado con tus datos más recientes!');
    }
  };

  const handleDeletePlan = () => {
    if (confirm('¿Estás seguro de que quieres eliminar tu plan financiero guardado?')) {
      deleteSavedPlan();
      setSavedPlan(null);
      setShowProgress(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'high':
        return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
      case 'low':
        return 'text-green-400 bg-green-900/30 border-green-500/50';
      default:
        return 'text-gray-400 bg-gray-900/30 border-gray-500/50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'URGENTE';
      case 'high':
        return 'ALTA';
      case 'medium':
        return 'MEDIA';
      case 'low':
        return 'BAJA';
      default:
        return priority.toUpperCase();
    }
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
        <div className="bg-gray-800 w-full max-w-2xl rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <i className="ri-calculator-line mr-2 text-blue-400"></i>
              Planificador Financiero
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Vista de Progreso del Plan Guardado */}
          {showProgress && savedPlan ? (
            <div className="space-y-4">
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-green-300 flex items-center">
                    <i className="ri-check-double-line mr-2"></i>
                    Plan Financiero Activo
                  </h3>
                  <div className="text-xs text-green-400">
                    Creado: {formatDateShort(savedPlan.createdAt)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-400">
                      {savedPlan.progress.weeksCompleted}
                    </div>
                    <div className="text-xs text-green-300">Semanas Completadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-400">
                      {formatCurrency(savedPlan.progress.totalAmountPaid)}
                    </div>
                    <div className="text-xs text-green-300">Total Pagado</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">{savedPlan.progress.completedDebts}</div>
                    <div className="text-green-300">Completadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-semibold">{savedPlan.progress.onTrackDebts}</div>
                    <div className="text-blue-300">Al día</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-semibold">{savedPlan.progress.behindDebts}</div>
                    <div className="text-red-300">Atrasadas</div>
                  </div>
                </div>
              </div>

              {/* Estado actual vs Plan */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                <h3 className="font-medium text-white mb-3 flex items-center">
                  <i className="ri-line-chart-line mr-2 text-blue-400"></i>
                  Estado Actual vs Plan
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Ingreos Actuales (7 días)</div>
                    <div className="text-lg font-semibold text-blue-400">{formatCurrency(getRealWeeklyIncome())}</div>
                    <div className="text-xs text-gray-400">
                      Plan: {formatCurrency(savedPlan.weeklyIncome)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Meta Semanal</div>
                    <div className="text-lg font-semibold text-green-400">{formatCurrency(savedPlan.weeklyTarget)}</div>
                    <div className="text-xs text-gray-400">
                      Para deudas
                    </div>
                  </div>
                </div>

                {savedPlan.progress.incomeGap > 0 && (
                  <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30 mb-3">
                    <div className="text-red-300 text-sm font-medium mb-1">
                      <i className="ri-alert-line mr-1"></i>
                      Déficit de Ingresos
                    </div>
                    <div className="text-red-200 text-sm">
                      Necesitas generar <span className="font-semibold">{formatCurrency(savedPlan.progress.incomeGap)}</span> más por semana
                    </div>
                  </div>
                )}

                {savedPlan.progress.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Recomendaciones:</div>
                    {savedPlan.progress.recommendations.map((rec, index) => (
                      <div key={index} className="text-xs text-yellow-300 bg-yellow-900/20 rounded px-2 py-1 border border-yellow-500/30">
                        <i className="ri-lightbulb-line mr-1"></i>
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plan de Pagos Actual */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                <h3 className="font-medium text-white mb-3 flex items-center">
                  <i className="ri-task-line mr-2 text-green-400"></i>
                  Plan de Pagos Actual
                </h3>

                <div className="space-y-3">
                  {savedPlan.recommendations.map((rec, index) => (
                    <div key={rec.debtId} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-white font-medium">{rec.debtName}</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs border ${getPriorityColor(rec.priority)}`}
                          >
                            {getPriorityLabel(rec.priority)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-semibold">
                            {formatCurrency(rec.suggestedPayment)}/sem
                          </div>
                          <div className="text-xs text-gray-400">
                            de {formatCurrency(rec.currentAmount)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {rec.reason}
                      </div>
                      <div className="text-xs text-blue-300 mt-1">
                        Progreso: {rec.weeksPaid}/{rec.totalWeeksNeeded} semanas
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proyección */}
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                <h3 className="font-medium text-blue-300 mb-2 flex items-center">
                  <i className="ri-calendar-event-line mr-2"></i>
                  Proyección de Finalización
                </h3>
                <p className="text-blue-200 text-sm">
                  Si mantienes el plan actual, terminarás de pagar todas tus deudas aproximadamente el
                  <span className="font-semibold">
                    {new Date(savedPlan.progress.projectedCompletion).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleUpdatePlan}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Actualizar Plan
                </button>
                <button
                  onClick={() => setShowProgress(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Crear Nuevo
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowIncomeTracker(true)}
                  className="flex-1 px-3 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                >
                  <i className="ri-line-chart-line mr-1"></i>
                  Ver Ingresos
                </button>
                <button
                  onClick={() => setShowExpenseTracker(true)}
                  className="flex-1 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                >
                  <i className="ri-shopping-cart-line mr-1"></i>
                  Ver Gastos
                </button>
                <button
                  onClick={handleDeletePlan}
                  className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm border border-red-500/30"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          ) : !showPlan ? (
            <div className="space-y-4">
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                <h3 className="font-medium text-blue-300 mb-2 flex items-center">
                  <i className="ri-information-line mr-2"></i>
                  ¿Cómo funciona?
                </h3>
                <p className="text-sm text-blue-200 mb-3">
                  Crea un plan personalizado que se actualiza automáticamente con tus ingresos reales. Te mostrará tu progreso y cuánto necesitas generar para cumplir tus metas.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowIncomeTracker(true)}
                    className="px-3 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <i className="ri-line-chart-line mr-1"></i>
                    Ver Ingresos Diarios
                  </button>
                  <button
                    onClick={() => setShowExpenseTracker(true)}
                    className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <i className="ri-shopping-cart-line mr-1"></i>
                    Ver Gastos Diarios
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    <i className="ri-money-dollar-circle-line mr-1 text-green-400"></i>
                    Ingresos semanales *
                  </label>
                  <button
                    onClick={() => setUseRealIncomeData(!useRealIncomeData)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      useRealIncomeData
                        ? 'bg-green-600/80 text-green-100'
                        : 'bg-gray-600/80 text-gray-300 hover:bg-gray-500/80'
                    }`}
                  >
                    {useRealIncomeData ? 'Usando datos reales' : 'Usar datos reales'}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={weeklyIncome}
                  onChange={(e) => setWeeklyIncome(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-gray-400"
                  placeholder="¿Cuánto generas por semana?"
                  required
                />
                {useRealIncomeData && (
                  <p className="text-xs text-green-300 mt-1">
                    <i className="ri-check-line mr-1"></i>
                    Calculado automáticamente de tus últimos 7 días
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    <i className="ri-restaurant-line mr-1 text-orange-400"></i>
                    Gastos esenciales (comida + gasolina) *
                  </label>
                  <button
                    onClick={() => setUseRealExpenseData(!useRealExpenseData)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      useRealExpenseData
                        ? 'bg-red-600/80 text-red-100'
                        : 'bg-gray-600/80 text-gray-300 hover:bg-gray-500/80'
                    }`}
                  >
                    {useRealExpenseData ? 'Usando datos reales' : 'Usar datos reales'}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={foodGas}
                  onChange={(e) => setFoodGas(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-gray-400"
                  placeholder="Gastos básicos semanales"
                  required
                />
                {useRealExpenseData && (
                  <p className="text-xs text-red-300 mt-1">
                    <i className="ri-check-line mr-1"></i>
                    Calculado automáticamente de tus gastos de comida y gas de los últimos 7 días
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <i className="ri-shopping-cart-line mr-1 text-purple-400"></i>
                  Otros gastos semanales
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-gray-400"
                  placeholder="Entretenimiento, ropa, etc."
                />
                {useRealExpenseData && (
                  <p className="text-xs text-purple-300 mt-1">
                    <i className="ri-check-line mr-1"></i>
                    Calculado automáticamente de tus otros gastos de los últimos 7 días
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={calculatePlan}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                >
                  <i className="ri-calculator-line mr-2"></i>
                  Calcular Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                <h3 className="font-medium text-white mb-3 flex items-center">
                  <i className="ri-pie-chart-line mr-2 text-blue-400"></i>
                  Resumen Semanal
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-400">
                      {formatCurrency(plan?.totalIncome || 0)}
                    </div>
                    <div className="text-xs text-gray-400">Ingresos</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-400">
                      {formatCurrency(plan?.essentialExpenses || 0)}
                    </div>
                    <div className="text-xs text-gray-400">Gastos</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-400">
                      {formatCurrency(plan?.availableForDebts || 0)}
                    </div>
                    <div className="text-xs text-gray-400">Para Deudas</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                <h3 className="font-medium text-white mb-3 flex items-center justify-between">
                  <span>
                    <i className="ri-task-line mr-2 text-green-400"></i>
                    Plan de Pagos Recomendado
                  </span>
                  <span className="text-sm text-green-400">
                    {formatCurrency(plan?.weeklyTarget || 0)}/semana
                  </span>
                </h3>

                <div className="space-y-3">
                  {plan?.recommendations.map((rec, index) => (
                    <div key={rec.debtId} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-white font-medium">{rec.debtName}</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs border ${getPriorityColor(rec.priority)}`}
                          >
                            {getPriorityLabel(rec.priority)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-semibold">
                            {formatCurrency(rec.suggestedPayment)}
                          </div>
                          <div className="text-xs text-gray-400">
                            de {formatCurrency(rec.currentAmount)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {rec.reason}
                      </div>
                      {rec.priority === 'urgent' && (
                        <div className="mt-2 text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded">
                          <i className="ri-alarm-warning-line mr-1"></i>
                          ¡Requiere atención inmediata!
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {plan && plan.availableForDebts - plan.weeklyTarget > 5 && (
                  <div className="mt-3 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                    <div className="text-green-300 text-sm font-medium mb-1">
                      <i className="ri-money-dollar-circle-line mr-1"></i>
                      Dinero extra disponible: {formatCurrency(plan.availableForDebts - plan.weeklyTarget)}
                    </div>
                    <div className="text-xs text-green-200">
                      Puedes usar este dinero para pagos adicionales o emergencias
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPlan(false)}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Modificar
                </button>
                <button
                  onClick={handleSavePlan}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
                >
                  <i className="ri-save-line mr-2"></i>
                  Guardar Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showIncomeTracker && <DailyIncomeTracker onClose={() => setShowIncomeTracker(false)} />}
      {showExpenseTracker && <DailyExpenseTracker onClose={() => setShowExpenseTracker(false)} />}
    </>
  );
}

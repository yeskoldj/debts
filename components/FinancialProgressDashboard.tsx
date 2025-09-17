
'use client';

import { useState, useEffect } from 'react';
import { getSavedFinancialPlan, getWeeklyIncome, SavedFinancialPlan } from '@/lib/financialPlan';
import { formatCurrency } from '@/lib/utils';

interface FinancialProgressDashboardProps {
  onClose: () => void;
}

export default function FinancialProgressDashboard({ onClose }: FinancialProgressDashboardProps) {
  const [savedPlan, setSavedPlan] = useState<SavedFinancialPlan | null>(null);
  const [currentIncome, setCurrentIncome] = useState(0);

  useEffect(() => {
    const plan = getSavedFinancialPlan();
    setSavedPlan(plan);
    setCurrentIncome(getWeeklyIncome());
  }, []);

  if (!savedPlan) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
        <div className="bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
          <div className="text-center py-8">
            <i className="ri-file-chart-line text-4xl text-gray-500 mb-4"></i>
            <p className="text-gray-300 mb-4">No tienes un plan financiero guardado</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = savedPlan.progress.weeksCompleted > 0 
    ? Math.min(100, (savedPlan.progress.totalAmountPaid / savedPlan.weeklyTarget / savedPlan.progress.weeksCompleted) * 100)
    : 0;

  const incomePerformance = currentIncome >= savedPlan.weeklyIncome ? 'good' : 
                           currentIncome >= savedPlan.weeklyIncome * 0.8 ? 'warning' : 'danger';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-2xl rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <i className="ri-dashboard-line mr-2 text-purple-400"></i>
            Progreso Financiero
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Resumen de progreso general */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {savedPlan.progress.weeksCompleted}
            </div>
            <div className="text-sm text-green-300">Semanas Activo</div>
            <div className="text-xs text-gray-400 mt-1">
              Desde {new Date(savedPlan.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </div>
          </div>
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {formatCurrency(savedPlan.progress.totalAmountPaid)}
            </div>
            <div className="text-sm text-blue-300">Total Pagado</div>
            <div className="text-xs text-gray-400 mt-1">
              Meta: {formatCurrency(savedPlan.weeklyTarget)}/sem
            </div>
          </div>
        </div>

        {/* Estado de ingresos actuales */}
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 mb-6">
          <h3 className="font-medium text-white mb-3 flex items-center">
            <i className="ri-money-dollar-circle-line mr-2 text-green-400"></i>
            Estado de Ingresos
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-sm text-gray-300">Ingresos Actuales</div>
              <div className={`text-lg font-semibold ${
                incomePerformance === 'good' ? 'text-green-400' :
                incomePerformance === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {formatCurrency(currentIncome)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-300">Meta del Plan</div>
              <div className="text-lg font-semibold text-blue-400">
                {formatCurrency(savedPlan.weeklyIncome)}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                incomePerformance === 'good' ? 'bg-green-500' :
                incomePerformance === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, (currentIncome / savedPlan.weeklyIncome) * 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className={`${
              incomePerformance === 'good' ? 'text-green-300' :
              incomePerformance === 'warning' ? 'text-yellow-300' : 'text-red-300'
            }`}>
              {incomePerformance === 'good' ? '✓ Ingresos en meta' :
               incomePerformance === 'warning' ? '⚠ Cerca de la meta' : '⚠ Por debajo de la meta'}
            </div>
            <div className="text-gray-400">
              {((currentIncome / savedPlan.weeklyIncome) * 100).toFixed(1)}%
            </div>
          </div>

          {savedPlan.progress.incomeGap > 0 && (
            <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
              <div className="text-red-300 text-sm font-medium mb-1">
                <i className="ri-alert-line mr-1"></i>
                Déficit Semanal
              </div>
              <div className="text-red-200 text-sm">
                Necesitas generar {formatCurrency(savedPlan.progress.incomeGap)} más por semana para cumplir tu plan
              </div>
            </div>
          )}
        </div>

        {/* Estado de las deudas */}
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 mb-6">
          <h3 className="font-medium text-white mb-3 flex items-center">
            <i className="ri-file-list-3-line mr-2 text-orange-400"></i>
            Estado de Deudas
          </h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400">
                {savedPlan.progress.completedDebts}
              </div>
              <div className="text-xs text-green-300">Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-400">
                {savedPlan.progress.onTrackDebts}
              </div>
              <div className="text-xs text-blue-300">Al Día</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-400">
                {savedPlan.progress.behindDebts}
              </div>
              <div className="text-xs text-red-300">Atrasadas</div>
            </div>
          </div>

          {savedPlan.progress.behindDebts > 0 && (
            <div className="text-xs text-orange-300 bg-orange-900/20 rounded px-2 py-1 border border-orange-500/30">
              <i className="ri-alert-line mr-1"></i>
              {savedPlan.progress.behindDebts > 1 ? 'Tienes deudas' : 'Tienes una deuda'} que requiere{savedPlan.progress.behindDebts > 1 ? 'n' : ''} atención
            </div>
          )}
        </div>

        <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30 mb-6">
          <h3 className="font-medium text-green-200 mb-3 flex items-center justify-between">
            <span>
              <i className="ri-piggy-bank-line mr-2"></i>
              Plan de Ahorro
            </span>
            <span className="text-sm font-semibold text-green-300">
              {formatCurrency(savedPlan.savingsContribution || 0)}/sem
            </span>
          </h3>

          {savedPlan.savingsPlan.length > 0 ? (
            <div className="space-y-2">
              {savedPlan.savingsPlan.map(goal => (
                <div key={goal.goalId} className="bg-green-900/30 rounded-lg p-3 border border-green-500/30 text-sm text-green-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{goal.goalName}</span>
                    <span className="text-green-300 font-semibold">{formatCurrency(goal.suggestedContribution)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-200">
                    <span>Prioridad: {goal.priority === 'essential' ? 'Esencial' : goal.priority === 'important' ? 'Importante' : 'Deseable'}</span>
                    <span>Restante: {formatCurrency(goal.remainingAmount)}</span>
                  </div>
                  {goal.deadline && (
                    <div className="text-xs text-green-300 mt-1">
                      Meta {new Date(goal.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-green-100 bg-green-900/30 rounded-lg p-3 border border-green-500/30">
              <i className="ri-information-line mr-2"></i>
              No hay objetivos de ahorro activos aún.
            </div>
          )}
        </div>

        {/* Proyección de finalización */}
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30 mb-6">
          <h3 className="font-medium text-blue-300 mb-2 flex items-center">
            <i className="ri-calendar-check-line mr-2"></i>
            Proyección de Finalización
          </h3>
          <p className="text-blue-200 text-sm">
            {currentIncome >= savedPlan.weeklyIncome ? (
              <>
                ¡Excelente! Al ritmo actual, completarás todas tus deudas aproximadamente el{' '}
                <span className="font-semibold">
                  {new Date(savedPlan.progress.projectedCompletion).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </>
            ) : (
              <>
                Con tus ingresos actuales, necesitarás más tiempo del planificado. Considera aumentar tus ingresos o reducir gastos para mantener el cronograma original.
              </>
            )}
          </p>
        </div>

        {/* Recomendaciones personalizadas */}
        {savedPlan.progress.recommendations.length > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 mb-6">
            <h3 className="font-medium text-white mb-3 flex items-center">
              <i className="ri-lightbulb-line mr-2 text-yellow-400"></i>
              Recomendaciones Personalizadas
            </h3>
            <div className="space-y-2">
              {savedPlan.progress.recommendations.map((rec, index) => (
                <div key={index} className="text-sm text-yellow-200 bg-yellow-900/20 rounded px-3 py-2 border border-yellow-500/30">
                  <i className="ri-arrow-right-line mr-2"></i>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
          >
            <i className="ri-check-line mr-2"></i>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

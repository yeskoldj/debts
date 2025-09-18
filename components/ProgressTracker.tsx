'use client';

import { useState, useEffect } from 'react';
import { Debt } from '@/lib/types';
import { getDebts } from '@/lib/storage';
import { getDaysUntilDue } from '@/lib/utils';

interface ProgressTrackerProps {
  onClose: () => void;
}

interface DebtProgress {
  debt: Debt;
  remainingAmount: number;
  daysLeft: number;
  weeklyNeeded: number;
  status: 'onTrack' | 'behind' | 'ahead' | 'urgent';
  recommendation: string;
}

export default function ProgressTracker({ onClose }: ProgressTrackerProps) {
  const [debtProgress, setDebtProgress] = useState<DebtProgress[]>([]);
  const [totalBehind, setTotalBehind] = useState(0);

  useEffect(() => {
    calculateProgress();
  }, []);

  const calculateProgress = () => {
    const debts = getDebts();
    const activeDebts = debts.filter(debt => {
      if (debt.kind === 'recurring') {
        return false;
      }

      const principalPaid = debt.payments.filter(p => p.type === 'principal').reduce((sum, p) => sum + p.amount, 0);
      return debt.totalAmount - principalPaid > 0;
    });

    let behindAmount = 0;
    
    const progress = activeDebts.map(debt => {
      const principalPaid = debt.payments.filter(p => p.type === 'principal').reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = debt.totalAmount - principalPaid;
      const daysLeft = debt.dueDate ? getDaysUntilDue(debt.dueDate) : 999;
      
      // Calcular cuánto se debería haber pagado hasta ahora si se distribuyera uniformemente
      const totalDays = debt.dueDate ? getDaysUntilDue(debt.dueDate) + Math.abs(new Date(debt.dueDate).getTime() - new Date(debt.startDate).getTime()) / (1000 * 60 * 60 * 24) : 365;
      const daysPassed = totalDays - daysLeft;
      const expectedPaid = (debt.totalAmount * daysPassed) / totalDays;
      const actuallyBehind = Math.max(0, expectedPaid - principalPaid);
      
      if (actuallyBehind > 10) {
        behindAmount += actuallyBehind;
      }

      const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
      const weeklyNeeded = remainingAmount / weeksLeft;

      let status: 'onTrack' | 'behind' | 'ahead' | 'urgent' = 'onTrack';
      let recommendation = '';

      if (daysLeft < 0) {
        status = 'urgent';
        recommendation = `¡URGENTE! Está ${Math.abs(daysLeft)} días vencida. Necesitas $${weeklyNeeded.toFixed(2)} semanales para ponerte al día.`;
      } else if (daysLeft <= 7) {
        status = 'urgent';
        recommendation = `¡CRÍTICO! Solo quedan ${daysLeft} días. Necesitas pagar $${remainingAmount.toFixed(2)} inmediatamente.`;
      } else if (actuallyBehind > 10) {
        status = 'behind';
        recommendation = `Estás $${actuallyBehind.toFixed(2)} atrasado. Aumenta tu pago semanal a $${(weeklyNeeded + actuallyBehind/weeksLeft).toFixed(2)} para recuperarte.`;
      } else if (principalPaid > expectedPaid * 1.1) {
        status = 'ahead';
        recommendation = `¡Excelente! Vas adelantado. Puedes reducir a $${(weeklyNeeded * 0.8).toFixed(2)} semanales o enfocarte en otras deudas.`;
      } else {
        status = 'onTrack';
        recommendation = `Mantén el ritmo con $${weeklyNeeded.toFixed(2)} semanales para llegar a tiempo.`;
      }

      return {
        debt,
        remainingAmount,
        daysLeft,
        weeklyNeeded,
        status,
        recommendation
      };
    });

    setDebtProgress(progress.sort((a, b) => a.daysLeft - b.daysLeft));
    setTotalBehind(behindAmount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'behind': return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
      case 'onTrack': return 'text-blue-400 bg-blue-900/30 border-blue-500/50';
      case 'ahead': return 'text-green-400 bg-green-900/30 border-green-500/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'urgent': return 'ri-alarm-warning-line';
      case 'behind': return 'ri-arrow-down-circle-line';
      case 'onTrack': return 'ri-check-circle-line';
      case 'ahead': return 'ri-arrow-up-circle-line';
      default: return 'ri-information-line';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'urgent': return 'URGENTE';
      case 'behind': return 'ATRASADO';
      case 'onTrack': return 'A TIEMPO';
      case 'ahead': return 'ADELANTADO';
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-2xl rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <i className="ri-line-chart-line mr-2 text-purple-400"></i>
            Seguimiento de Progreso
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Resumen general */}
        {totalBehind > 0 && (
          <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-500/30 mb-6">
            <h3 className="font-medium text-orange-300 mb-2 flex items-center">
              <i className="ri-alert-line mr-2"></i>
              Resumen de Atrasos
            </h3>
            <p className="text-orange-200 text-sm">
              Tienes un total de <span className="font-semibold">${totalBehind.toFixed(2)}</span> en atrasos acumulados. 
              Considera aumentar tus pagos semanales o usar dinero extra para ponerte al día.
            </p>
          </div>
        )}

        {/* Lista de progreso por deuda */}
        <div className="space-y-4">
          {debtProgress.map((progress) => (
            <div key={progress.debt.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h3 className="font-medium text-white">{progress.debt.name}</h3>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs border flex items-center ${getStatusColor(progress.status)}`}>
                    <i className={`${getStatusIcon(progress.status)} mr-1`}></i>
                    {getStatusLabel(progress.status)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    ${progress.remainingAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {progress.daysLeft >= 0 ? `${progress.daysLeft} días` : `${Math.abs(progress.daysLeft)} días vencida`}
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                <div className="text-sm text-gray-300 mb-2 flex items-center">
                  <i className="ri-calendar-check-line mr-2 text-blue-400"></i>
                  Pago semanal necesario: 
                  <span className="ml-1 font-semibold text-blue-400">
                    ${progress.weeklyNeeded.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {progress.recommendation}
                </div>
              </div>

              {/* Barra de progreso visual */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Pagado</span>
                  <span>
                    {((progress.debt.totalAmount - progress.remainingAmount) / progress.debt.totalAmount * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      progress.status === 'urgent' ? 'bg-red-500' :
                      progress.status === 'behind' ? 'bg-orange-500' :
                      progress.status === 'ahead' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (progress.debt.totalAmount - progress.remainingAmount) / progress.debt.totalAmount * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {debtProgress.length === 0 && (
            <div className="text-center py-8">
              <i className="ri-trophy-line text-4xl text-green-500 mb-4"></i>
              <p className="text-green-300 font-medium mb-2">¡Felicidades!</p>
              <p className="text-gray-300">No tienes deudas activas para seguir.</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
          >
            <i className="ri-check-line mr-2"></i>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
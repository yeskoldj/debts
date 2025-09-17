
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Debt } from '@/lib/types';
import { deleteDebt } from '@/lib/storage';
import { formatCurrency, formatDate, getDaysUntilDue } from '@/lib/utils';

interface DebtCardProps {
  debt: Debt;
  onUpdate: () => void;
}

export default function DebtCard({ debt, onUpdate }: DebtCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const principalPayments = debt.payments.filter(p => p.type === 'principal');
  const totalPrincipalPaid = principalPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = Math.max(0, debt.totalAmount - totalPrincipalPaid);
  const progressPercentage = debt.totalAmount > 0 ? (totalPrincipalPaid / debt.totalAmount) * 100 : 0;
  const isPaid = remainingAmount <= 0;

  const daysUntilDue = debt.dueDate ? getDaysUntilDue(debt.dueDate) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta deuda?')) {
      deleteDebt(debt.id);
      onUpdate();
    }
  };

  const getKindConfig = () => {
    switch (debt.kind) {
      case 'recurring':
        return { label: 'Recurrente', chipClass: 'bg-blue-900/40 text-blue-300 border border-blue-500/50', icon: 'ri-repeat-line' };
      case 'installment':
        return { label: 'Plazos', chipClass: 'bg-purple-900/40 text-purple-300 border border-purple-500/50', icon: 'ri-calendar-schedule-line' };
      case 'credit_card':
        return { label: 'Crédito', chipClass: 'bg-amber-900/40 text-amber-300 border border-amber-500/50', icon: 'ri-bank-card-line' };
      case 'loan':
        return { label: 'Préstamo', chipClass: 'bg-green-900/40 text-green-300 border border-green-500/50', icon: 'ri-hand-coin-line' };
      default:
        return { label: 'Otro', chipClass: 'bg-gray-900/40 text-gray-300 border border-gray-500/50', icon: 'ri-checkbox-blank-circle-line' };
    }
  };

  const kindConfig = getKindConfig();
  const showRecurringInfo = debt.kind === 'recurring' && debt.recurringAmount;
  const showInstallmentInfo = debt.kind === 'installment' && debt.installmentAmount && debt.totalInstallments;

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-4 relative hover:bg-gray-800/90 transition-all duration-200">
      {/* Menú desplegable */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
        >
          <i className="ri-more-line"></i>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-32 z-10">
            <Link
              href={`/debt/${debt.id}/edit`}
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setShowMenu(false)}
            >
              <i className="ri-edit-line mr-2"></i>
              Editar
            </Link>
            <button
              onClick={handleDelete}
              className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Estado de vencimiento */}
      {isOverdue && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700/50">
            <i className="ri-alert-line mr-1"></i>
            Vencida
          </span>
        </div>
      )}

      {isDueSoon && !isPaid && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-900/50 text-orange-300 border border-orange-700/50">
            <i className="ri-time-line mr-1"></i>
            Vence en {daysUntilDue} día{daysUntilDue !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {isPaid && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700/50">
            <i className="ri-check-line mr-1"></i>
            Pagada
          </span>
        </div>
      )}

      <Link href={`/debt/${debt.id}`}>
        <div className="cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white pr-3 truncate">{debt.name}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${kindConfig.chipClass}`}>
              <i className={`${kindConfig.icon}`}></i>
              {kindConfig.label}
            </span>
          </div>

          {debt.description && (
            <p className="text-xs text-gray-400 mb-3 pr-8 line-clamp-2">{debt.description}</p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total:</span>
              <span className="font-medium text-gray-200">{formatCurrency(debt.totalAmount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Restante:</span>
              <span className={`font-medium ${isPaid ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>

            {showRecurringInfo && (
              <div className="flex justify-between items-center text-xs text-blue-300">
                <span className="uppercase tracking-wide">Pago {debt.recurringFrequency === 'weekly' ? 'semanal' : debt.recurringFrequency === 'biweekly' ? 'quincenal' : 'mensual'}</span>
                <span>{formatCurrency(debt.recurringAmount ?? 0)}</span>
              </div>
            )}

            {showInstallmentInfo && (
              <div className="flex justify-between items-center text-xs text-purple-300">
                <span className="uppercase tracking-wide">Cuota</span>
                <span>{formatCurrency(debt.installmentAmount ?? 0)} · {debt.completedInstallments ?? 0}/{debt.totalInstallments}</span>
              </div>
            )}

            {debt.interestRate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Interés:</span>
                <span className="text-sm text-gray-200">{debt.interestRate}% anual</span>
              </div>
            )}

            {debt.dueDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Vencimiento:</span>
                <span className="text-sm text-gray-200">{formatDate(debt.dueDate)}</span>
              </div>
            )}
          </div>

          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">Progreso del Capital</span>
              <span className="text-xs font-medium text-gray-200">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isPaid ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
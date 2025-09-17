
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Debt, Payment } from '@/lib/types';
import { getDebts, addPayment, deletePayment } from '@/lib/storage';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';
import AddPaymentModal from '@/components/AddPaymentModal';

interface DebtDetailProps {
  debtId: string;
}

export default function DebtDetail({ debtId }: DebtDetailProps) {
  const router = useRouter();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const computeCompletedInstallments = (currentDebt: Debt, payments: Payment[]) => {
    if (currentDebt.kind !== 'installment' || !currentDebt.installmentAmount) {
      return currentDebt.completedInstallments ?? 0;
    }

    const principalPaid = payments
      .filter(payment => payment.type === 'principal')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const totalInstallments = currentDebt.totalInstallments ?? Number.POSITIVE_INFINITY;
    return Math.min(totalInstallments, Math.floor(principalPaid / currentDebt.installmentAmount));
  };

  useEffect(() => {
    const debts = getDebts();
    const foundDebt = debts.find((d) => d.id === debtId);
    if (foundDebt) {
      setDebt(foundDebt);
    } else {
      router.push('/');
    }
  }, [debtId, router]);

  const handleAddPayment = (paymentData: Omit<Payment, 'id'>) => {
    if (!debt) return;

    const newPayment: Payment = {
      ...paymentData,
      id: generateId(),
    };

    addPayment(debt.id, newPayment);

    // Actualizar estado local
    const updatedPayments = [...debt.payments, newPayment];

    setDebt({
      ...debt,
      payments: updatedPayments,
      completedInstallments: computeCompletedInstallments(debt, updatedPayments)
    });

    setShowAddPayment(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!debt) return;

    if (confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      deletePayment(debt.id, paymentId);

      // Actualizar estado local
      const updatedPayments = debt.payments.filter((p) => p.id !== paymentId);
      setDebt({
        ...debt,
        payments: updatedPayments,
        completedInstallments: computeCompletedInstallments(debt, updatedPayments)
      });
    }
  };

  if (!debt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-red-500 animate-spin mb-4"></i>
          <p className="text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  const principalPayments = debt.payments.filter((p) => p.type === 'principal');
  const interestPayments = debt.payments.filter((p) => p.type === 'interest');
  const feePayments = debt.payments.filter((p) => p.type === 'fee');

  const totalPrincipalPaid = principalPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalInterestPaid = interestPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalFeesPaid = feePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaid = totalPrincipalPaid + totalInterestPaid + totalFeesPaid;

  const remainingAmount = Math.max(0, debt.totalAmount - totalPrincipalPaid);
  const progressPercentage = debt.totalAmount > 0 ? (totalPrincipalPaid / debt.totalAmount) * 100 : 0;
  const isPaid = remainingAmount <= 0;

  const getPaymentTypeLabel = (type: Payment['type']) => {
    switch (type) {
      case 'principal':
        return 'Capital';
      case 'interest':
        return 'Interés';
      case 'fee':
        return 'Fee';
      default:
        return type;
    }
  };

  const getPaymentTypeColor = (type: Payment['type']) => {
    switch (type) {
      case 'principal':
        return 'text-green-300 bg-green-900/30 border-green-700/50';
      case 'interest':
        return 'text-orange-300 bg-orange-900/30 border-orange-700/50';
      case 'fee':
        return 'text-red-300 bg-red-900/30 border-red-700/50';
      default:
        return 'text-gray-300 bg-gray-700/50 border-gray-600/50';
    }
  };

  const getKindLabel = () => {
    switch (debt.kind) {
      case 'recurring':
        return 'Gasto recurrente';
      case 'installment':
        return 'Plan a plazos';
      case 'credit_card':
        return 'Tarjeta de crédito';
      case 'loan':
        return 'Préstamo';
      default:
        return 'Otro tipo';
    }
  };

  const paymentLimit = debt.kind === 'recurring' ? undefined : remainingAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors mr-3"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </Link>
          <h1 className="text-lg font-semibold text-white flex-1 truncate">
            {debt.name}
          </h1>
          <Link
            href={`/debt/${debt.id}/edit`}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
          >
            <i className="ri-edit-line text-xl"></i>
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Resumen de la deuda */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-white mb-1">
              {formatCurrency(remainingAmount)}
            </div>
            <div className="text-sm text-gray-300">
              de {formatCurrency(debt.totalAmount)} restante
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-200 border border-blue-500/40">
              <i className="ri-shield-check-line mr-1"></i>
              {getKindLabel()}
            </span>
            {debt.kind === 'recurring' && debt.recurringAmount && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-100 border border-blue-500/30">
                Pago {debt.recurringFrequency === 'weekly' ? 'semanal' : debt.recurringFrequency === 'biweekly' ? 'quincenal' : 'mensual'}: {formatCurrency(debt.recurringAmount)}
              </span>
            )}
            {debt.kind === 'installment' && debt.installmentAmount && debt.totalInstallments && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-900/20 text-purple-100 border border-purple-500/30">
                Cuota: {formatCurrency(debt.installmentAmount)} · {debt.completedInstallments ?? 0}/{debt.totalInstallments}
              </span>
            )}
          </div>

          {/* Descripción */}
          {debt.description && (
            <div className="mb-4 p-3 bg-red-900/20 rounded-lg border border-red-700/30">
              <p className="text-sm text-red-300">{debt.description}</p>
            </div>
          )}

          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Progreso del Capital</span>
              <span className="text-sm font-medium text-white">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  isPaid ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Resumen de pagos */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-green-900/30 rounded-lg border border-green-700/50">
              <div className="text-sm font-medium text-green-300">{formatCurrency(totalPrincipalPaid)}</div>
              <div className="text-xs text-green-400">Capital</div>
            </div>
            <div className="text-center p-3 bg-orange-900/30 rounded-lg border border-orange-700/50">
              <div className="text-sm font-medium text-orange-300">{formatCurrency(totalInterestPaid)}</div>
              <div className="text-xs text-orange-400">Intereses</div>
            </div>
            <div className="text-center p-3 bg-red-900/30 rounded-lg border border-red-700/50">
              <div className="text-sm font-medium text-red-300">{formatCurrency(totalFeesPaid)}</div>
              <div className="text-xs text-red-400">Fees</div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Fecha de inicio:</span>
              <span className="text-gray-200">{formatDate(debt.startDate)}</span>
            </div>
            {debt.dueDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha de vencimiento:</span>
                <span className="text-gray-200">{formatDate(debt.dueDate)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Tipo:</span>
              <span className="text-gray-200">{getKindLabel()}</span>
            </div>
            {debt.interestRate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Tasa de interés:</span>
                <span className="text-gray-200">{debt.interestRate}% anual</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Total pagado:</span>
              <span className="text-green-400 font-medium">{formatCurrency(totalPaid)}</span>
            </div>
          </div>
        </div>

        {/* Historial de pagos */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Historial de Pagos</h2>
            <span className="text-sm text-gray-400">{debt.payments.length} pago{debt.payments.length !== 1 ? 's' : ''}</span>
          </div>

          {debt.payments.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-money-dollar-circle-line text-4xl text-gray-500 mb-4"></i>
              <p className="text-gray-400">No hay pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debt.payments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-white">{formatCurrency(payment.amount)}</div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPaymentTypeColor(payment.type)}`}>
                          {getPaymentTypeLabel(payment.type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">{formatDate(payment.date)}</div>
                      {payment.note && (
                        <div className="text-sm text-gray-300 mt-1">{payment.note}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante para agregar pago */}
      <button
        onClick={() => setShowAddPayment(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105"
      >
        <i className="ri-add-line text-2xl"></i>
      </button>

      {/* Modal para agregar pago */}
      {showAddPayment && (
        <AddPaymentModal
          maxAmount={paymentLimit}
          onSave={handleAddPayment}
          onClose={() => setShowAddPayment(false)}
        />
      )}
    </div>
  );
}

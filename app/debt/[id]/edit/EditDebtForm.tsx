
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Debt, DebtKind, RecurringFrequency } from '@/lib/types';
import { getDebts, saveDebt, deleteDebt } from '@/lib/storage';

interface EditDebtFormProps {
  debtId: string;
}

export default function EditDebtForm({ debtId }: EditDebtFormProps) {
  const router = useRouter();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalAmount: '',
    interestRate: '',
    startDate: '',
    dueDate: '',
    kind: 'loan' as DebtKind,
    recurringAmount: '',
    recurringFrequency: 'monthly' as RecurringFrequency,
    installmentAmount: '',
    totalInstallments: ''
  });

  useEffect(() => {
    const debts = getDebts();
    const foundDebt = debts.find(d => d.id === debtId);
    if (foundDebt) {
      setDebt(foundDebt);
      setFormData({
        name: foundDebt.name,
        description: foundDebt.description || '',
        totalAmount: foundDebt.totalAmount.toString(),
        interestRate: foundDebt.interestRate?.toString() || '',
        startDate: foundDebt.startDate,
        dueDate: foundDebt.dueDate || '',
        kind: foundDebt.kind,
        recurringAmount: foundDebt.recurringAmount?.toString() || '',
        recurringFrequency: foundDebt.recurringFrequency || 'monthly',
        installmentAmount: foundDebt.installmentAmount?.toString() || '',
        totalInstallments: foundDebt.totalInstallments?.toString() || ''
      });
    } else {
      router.push('/');
    }
  }, [debtId, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!debt || !formData.name.trim() || !formData.totalAmount) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const amount = parseFloat(formData.totalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('El monto debe ser un número válido mayor a 0');
      return;
    }

    const interestRate = formData.interestRate ? parseFloat(formData.interestRate) : undefined;
    if (interestRate !== undefined && (isNaN(interestRate) || interestRate < 0)) {
      alert('La tasa de interés debe ser un número válido mayor o igual a 0');
      return;
    }

    if (formData.dueDate && formData.dueDate < formData.startDate) {
      alert('La fecha de vencimiento debe ser igual o posterior a la fecha de inicio.');
      return;
    }

    let recurringAmount: number | undefined;
    if (formData.kind === 'recurring') {
      recurringAmount = parseFloat(formData.recurringAmount);
      if (isNaN(recurringAmount) || recurringAmount <= 0) {
        alert('Para una deuda recurrente necesitas definir el monto del ciclo de pago.');
        return;
      }
    }

    let installmentAmount: number | undefined;
    let totalInstallments: number | undefined;
    if (formData.kind === 'installment') {
      installmentAmount = parseFloat(formData.installmentAmount);
      totalInstallments = parseInt(formData.totalInstallments || '0', 10);

      if (isNaN(installmentAmount) || installmentAmount <= 0) {
        alert('Para un plan a plazos el pago por cuota debe ser mayor a 0.');
        return;
      }

      if (isNaN(totalInstallments) || totalInstallments <= 0) {
        alert('Indica cuántos pagos se requieren para completar el plan.');
        return;
      }
    }

    const updatedDebt: Debt = {
      ...debt,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      totalAmount: amount,
      interestRate,
      startDate: formData.startDate,
      dueDate: formData.dueDate || null,
      kind: formData.kind,
      recurringAmount: formData.kind === 'recurring' ? recurringAmount : undefined,
      recurringFrequency: formData.kind === 'recurring' ? formData.recurringFrequency : undefined,
      installmentAmount: formData.kind === 'installment' ? installmentAmount : undefined,
      totalInstallments: formData.kind === 'installment' ? totalInstallments : undefined,
      completedInstallments: formData.kind === 'installment'
        ? Math.min(totalInstallments ?? Number.POSITIVE_INFINITY, debt.completedInstallments ?? 0)
        : undefined
    };

    saveDebt(updatedDebt);
    router.push(`/debt/${debt.id}`);
  };

  const handleDelete = () => {
    if (!debt) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar esta deuda? Esta acción no se puede deshacer.')) {
      deleteDebt(debt.id);
      router.push('/');
    }
  };

  if (!debt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin mb-4"></i>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link 
            href={`/debt/${debt?.id}`}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors mr-3"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 flex-1">
            Editar Deuda
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la deuda *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ej: Tarjeta de crédito, Préstamo..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Detalles adicionales sobre la deuda..."
                rows={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de obligación
              </label>
              <select
                value={formData.kind}
                onChange={(e) => setFormData({ ...formData, kind: e.target.value as DebtKind })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="loan">Préstamo / Deuda fija</option>
                <option value="installment">Plan a plazos</option>
                <option value="credit_card">Tarjeta de crédito</option>
                <option value="recurring">Gasto recurrente</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto total *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0.00"
                required
              />
            </div>

            {formData.kind === 'recurring' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pago por ciclo *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.recurringAmount}
                    onChange={(e) => setFormData({ ...formData, recurringAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ej: 850.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia
                  </label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as RecurringFrequency })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
              </div>
            )}

            {formData.kind === 'installment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pago por cuota *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.installmentAmount}
                    onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ej: 350.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de cuotas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalInstallments}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ej: 12"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de interés anual (%) (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ej: 15.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de vencimiento (opcional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Eliminar
              </button>
              <div className="flex-1 flex gap-3">
                <Link
                  href={`/debt/${debt?.id}`}
                  className="flex-1 px-4 py-2 text-center text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { Debt, DebtKind, RecurringFrequency } from '@/lib/types';

interface AddDebtModalProps {
  onSave: (debt: Omit<Debt, 'id' | 'payments' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function AddDebtModal({ onSave, onClose }: AddDebtModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalAmount: '',
    interestRate: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    kind: 'loan' as DebtKind,
    recurringAmount: '',
    recurringFrequency: 'monthly',
    installmentAmount: '',
    totalInstallments: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.totalAmount) {
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
        alert('Para un plan a plazos el pago por plazo debe ser mayor a 0.');
        return;
      }

      if (isNaN(totalInstallments) || totalInstallments <= 0) {
        alert('Indica cuántos pagos se requieren para completar el plan.');
        return;
      }
    }

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      totalAmount: amount,
      interestRate,
      startDate: formData.startDate,
      dueDate: formData.dueDate || null,
      kind: formData.kind,
      recurringAmount,
      recurringFrequency: formData.kind === 'recurring' ? formData.recurringFrequency : undefined,
      installmentAmount,
      totalInstallments,
      completedInstallments: formData.kind === 'installment' ? 0 : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Nueva Deuda</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de la deuda *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
              placeholder="Ej: Tarjeta de crédito, Préstamo..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-white placeholder-gray-400"
              placeholder="Detalles adicionales sobre la deuda..."
              rows={3}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de obligación
            </label>
            <select
              value={formData.kind}
              onChange={(e) => setFormData({ ...formData, kind: e.target.value as DebtKind })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white"
            >
              <option value="loan">Préstamo / Deuda fija</option>
              <option value="installment">Plan a plazos</option>
              <option value="credit_card">Tarjeta de crédito</option>
              <option value="recurring">Gasto recurrente</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monto total *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
              placeholder="0.00"
              required
            />
          </div>

          {formData.kind === 'recurring' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pago por ciclo *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.recurringAmount}
                  onChange={(e) => setFormData({ ...formData, recurringAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
                  placeholder="Ej: 850.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frecuencia
                </label>
                <select
                  value={formData.recurringFrequency}
                  onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as RecurringFrequency })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pago por cuota *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.installmentAmount}
                  onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
                  placeholder="Ej: 350.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número de cuotas *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalInstallments}
                  onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
                  placeholder="Ej: 12"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tasa de interés anual (%) (opcional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
              placeholder="Ej: 15.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de vencimiento (opcional)
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white"
            />
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
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
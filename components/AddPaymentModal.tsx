
'use client';

import { useState } from 'react';
import { Payment } from '@/lib/types';

interface AddPaymentModalProps {
  maxAmount: number;
  onSave: (payment: Omit<Payment, 'id'>) => void;
  onClose: () => void;
}

export default function AddPaymentModal({ maxAmount, onSave, onClose }: AddPaymentModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    type: 'principal' as Payment['type']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount) {
      alert('Por favor ingresa el monto del pago');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('El monto debe ser un número válido mayor a 0');
      return;
    }

    // Solo validar el límite para pagos de capital
    if (formData.type === 'principal' && amount > maxAmount) {
      alert(`El pago de capital no puede ser mayor al saldo pendiente ($${maxAmount.toFixed(2)})`);
      return;
    }

    onSave({
      amount,
      date: formData.date,
      note: formData.note.trim() || undefined,
      type: formData.type
    });
  };

  const getPaymentTypeLabel = (type: Payment['type']) => {
    switch (type) {
      case 'principal': return 'Capital';
      case 'interest': return 'Interés';
      case 'fee': return 'Fee/Comisión';
      default: return type;
    }
  };

  const getPaymentTypeIcon = (type: Payment['type']) => {
    switch (type) {
      case 'principal': return 'ri-money-dollar-circle-line';
      case 'interest': return 'ri-percent-line';
      case 'fee': return 'ri-receipt-line';
      default: return 'ri-money-dollar-circle-line';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Registrar Pago</h2>
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
              Tipo de pago *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['principal', 'interest', 'fee'] as Payment['type'][]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    formData.type === type
                      ? 'border-red-500 bg-red-900/30 text-red-300'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <i className={`${getPaymentTypeIcon(type)} text-lg mb-1 block`}></i>
                  <div className="text-xs font-medium">{getPaymentTypeLabel(type)}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monto del pago *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
              placeholder="0.00"
              required
            />
            {formData.type === 'principal' && (
              <p className="text-xs text-gray-400 mt-1">
                Saldo pendiente: ${maxAmount.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha del pago
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nota (opcional)
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
              placeholder="Ej: Pago mensual, abono extra..."
              maxLength={100}
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
            >
              Registrar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
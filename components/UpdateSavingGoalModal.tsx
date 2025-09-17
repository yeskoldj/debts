'use client';

import { useState } from 'react';
import { SavingGoal } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface UpdateSavingGoalModalProps {
  goal: SavingGoal;
  onContribute: (amount: number, note?: string) => void;
  onClose: () => void;
}

export default function UpdateSavingGoalModal({ goal, onContribute, onClose }: UpdateSavingGoalModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!amount) {
      alert('Ingresa cuánto deseas aportar a este objetivo.');
      return;
    }

    const contribution = parseFloat(amount);
    if (isNaN(contribution) || contribution <= 0) {
      alert('El aporte debe ser mayor a 0.');
      return;
    }

    onContribute(contribution, note.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <i className="ri-funds-box-line mr-2 text-green-400"></i>
            Aportar a {goal.name}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-700/40 border border-gray-600/40 rounded-lg p-4 text-sm text-gray-200">
            <div className="flex justify-between mb-2">
              <span>Ahorro actual</span>
              <span>{formatCurrency(goal.currentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Restante para la meta</span>
              <span className="text-green-300 font-semibold">{formatCurrency(remaining)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monto del aporte *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remaining || undefined}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
              placeholder="0.00"
              required
            />
            {remaining > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Puedes aportar hasta {formatCurrency(remaining)}.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nota (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
              placeholder="Ej: ingreso extra, ahorro semanal..."
              maxLength={120}
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
              Registrar aporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

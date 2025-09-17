'use client';

import { useState } from 'react';
import { SavingGoal } from '@/lib/types';

interface AddSavingGoalModalProps {
  onSave: (goal: Omit<SavingGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export default function AddSavingGoalModal({ onSave, onClose }: AddSavingGoalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    priority: 'important' as SavingGoal['priority'],
    notes: ''
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.targetAmount) {
      alert('Por favor completa el nombre y la meta de ahorro.');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      alert('La meta de ahorro debe ser un monto mayor a 0.');
      return;
    }

    const currentAmount = formData.currentAmount ? parseFloat(formData.currentAmount) : 0;
    if (isNaN(currentAmount) || currentAmount < 0) {
      alert('El ahorro inicial no puede ser negativo.');
      return;
    }

    if (currentAmount > targetAmount) {
      alert('El ahorro inicial no puede superar la meta.');
      return;
    }

    onSave({
      name: formData.name.trim(),
      targetAmount,
      currentAmount,
      deadline: formData.deadline || null,
      priority: formData.priority,
      notes: formData.notes.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <i className="ri-piggy-bank-line mr-2 text-green-400"></i>
            Nuevo objetivo de ahorro
          </h2>
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
              Nombre del objetivo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
              placeholder="Ej: Fondo de emergencia, viaje, inversión..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta total *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.targetAmount}
                onChange={(event) => setFormData({ ...formData, targetAmount: event.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ahorro actual
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.currentAmount}
                onChange={(event) => setFormData({ ...formData, currentAmount: event.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(event) => setFormData({ ...formData, priority: event.target.value as SavingGoal['priority'] })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white"
              >
                <option value="essential">Esencial</option>
                <option value="important">Importante</option>
                <option value="nice_to_have">Deseable</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha objetivo (opcional)
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(event) => setFormData({ ...formData, deadline: event.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none text-white placeholder-gray-400"
              placeholder="¿Por qué es importante este ahorro?"
              rows={3}
              maxLength={250}
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
              Guardar objetivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

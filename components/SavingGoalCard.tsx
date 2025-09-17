'use client';

import { useMemo } from 'react';
import { SavingGoal } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SavingGoalCardProps {
  goal: SavingGoal;
  onContribute: (goal: SavingGoal) => void;
  onDelete: (goalId: string) => void;
}

export default function SavingGoalCard({ goal, onContribute, onDelete }: SavingGoalCardProps) {
  const progress = useMemo(() => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  }, [goal]);

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const getPriorityConfig = () => {
    switch (goal.priority) {
      case 'essential':
        return { label: 'Esencial', className: 'bg-red-900/30 text-red-300 border border-red-600/40' };
      case 'important':
        return { label: 'Importante', className: 'bg-yellow-900/30 text-yellow-200 border border-yellow-600/40' };
      default:
        return { label: 'Deseable', className: 'bg-blue-900/30 text-blue-200 border border-blue-600/40' };
    }
  };

  const priority = getPriorityConfig();
  const isCompleted = remaining <= 0;

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-5 hover:bg-gray-800/90 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-base">{goal.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${priority.className}`}>
              {priority.label}
            </span>
          </div>
          {goal.deadline && (
            <div className="text-xs text-gray-400">
              <i className="ri-calendar-event-line mr-1"></i>
              Meta: {formatDate(goal.deadline)}
            </div>
          )}
          {goal.notes && (
            <p className="text-xs text-gray-300 mt-2 leading-snug">{goal.notes}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
        >
          <i className="ri-delete-bin-line"></i>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="bg-gray-700/40 rounded-lg p-3 border border-gray-600/40">
          <div className="text-gray-400 text-xs">Meta</div>
          <div className="text-white font-semibold">{formatCurrency(goal.targetAmount)}</div>
        </div>
        <div className="bg-gray-700/40 rounded-lg p-3 border border-gray-600/40 text-right">
          <div className="text-gray-400 text-xs">Ahorro actual</div>
          <div className="text-green-300 font-semibold">{formatCurrency(goal.currentAmount)}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progreso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {!isCompleted && (
          <div className="text-xs text-gray-400 mt-1">
            Restan {formatCurrency(remaining)} para alcanzar la meta.
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => !isCompleted && onContribute(goal)}
          disabled={isCompleted}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isCompleted
              ? 'bg-green-900/40 text-green-200 border border-green-500/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
          }`}
        >
          <i className="ri-money-dollar-circle-line mr-1"></i>
          {isCompleted ? 'Ahorro cumplido' : 'Aportar' }
        </button>
        {isCompleted && (
          <span className="px-3 py-2 bg-green-900/30 text-green-200 text-xs rounded-lg border border-green-600/40 flex items-center">
            <i className="ri-star-smile-line mr-1"></i>
            ¡Meta alcanzada!
          </span>
        )}
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';

interface DailyIncome {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

interface WeeklyTotal {
  weekStart: string;
  weekEnd: string;
  total: number;
  days: DailyIncome[];
}

interface MonthlyTotal {
  month: string;
  total: number;
  daysCount: number;
  average: number;
}

interface DailyIncomeTrackerProps {
  onClose: () => void;
}

export default function DailyIncomeTracker({ onClose }: DailyIncomeTrackerProps) {
  const [dailyIncomes, setDailyIncomes] = useState<DailyIncome[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIncome, setNewIncome] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadDailyIncomes();
  }, []);

  const loadDailyIncomes = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('dailyIncomes');
      if (stored) {
        setDailyIncomes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading daily incomes:', error);
    }
  };

  const saveDailyIncomes = (incomes: DailyIncome[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('dailyIncomes', JSON.stringify(incomes));
      setDailyIncomes(incomes);
    } catch (error) {
      console.error('Error saving daily incomes:', error);
    }
  };

  const handleAddIncome = () => {
    const amount = parseFloat(newIncome.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    // Verificar si ya existe un registro para esta fecha
    const existingIndex = dailyIncomes.findIndex(income => income.date === newIncome.date);

    const income: DailyIncome = {
      id: generateId(),
      date: newIncome.date,
      amount,
      note: newIncome.note.trim() || undefined
    };

    let updatedIncomes;
    if (existingIndex >= 0) {
      // Actualizar registro existente
      updatedIncomes = [...dailyIncomes];
      updatedIncomes[existingIndex] = {
        ...updatedIncomes[existingIndex],
        amount: updatedIncomes[existingIndex].amount + amount,
        note: income.note
      };
    } else {
      // Agregar nuevo registro
      updatedIncomes = [...dailyIncomes, income];
    }

    saveDailyIncomes(updatedIncomes);

    setNewIncome({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowAddForm(false);
  };

  const handleDeleteIncome = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      const updatedIncomes = dailyIncomes.filter(income => income.id !== id);
      saveDailyIncomes(updatedIncomes);
    }
  };

  const getWeeklyTotals = (): WeeklyTotal[] => {
    const sortedIncomes = [...dailyIncomes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const weeks: { [key: string]: DailyIncome[] } = {};

    sortedIncomes.forEach(income => {
      const date = new Date(income.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Domingo como primer día de la semana
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(income);
    });

    return Object.entries(weeks)
      .map(([weekStart, days]) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return {
          weekStart,
          weekEnd: weekEnd.toISOString().split('T')[0],
          total: days.reduce((sum, day) => sum + day.amount, 0),
          days: days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
      })
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
  };

  const getMonthlyTotals = (): MonthlyTotal[] => {
    const months: { [key: string]: DailyIncome[] } = {};

    dailyIncomes.forEach(income => {
      const date = new Date(income.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(income);
    });

    return Object.entries(months)
      .map(([monthKey, days]) => ({
        month: monthKey,
        total: days.reduce((sum, day) => sum + day.amount, 0),
        daysCount: days.length,
        average: days.reduce((sum, day) => sum + day.amount, 0) / days.length
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  };

  const getTodayTotal = () => {
    const today = new Date().toISOString().split('T')[0];
    return dailyIncomes
      .filter(income => income.date === today)
      .reduce((sum, income) => sum + income.amount, 0);
  };

  const getThisWeekTotal = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return dailyIncomes
      .filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= weekStart;
      })
      .reduce((sum, income) => sum + income.amount, 0);
  };

  const getThisMonthTotal = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return dailyIncomes
      .filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= monthStart;
      })
      .reduce((sum, income) => sum + income.amount, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-2xl rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <i className="ri-money-dollar-circle-line mr-2 text-green-400"></i>
            Registro de Ingresos Diarios
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30 text-center">
            <div className="text-lg font-semibold text-green-400">{formatCurrency(getTodayTotal())}</div>
            <div className="text-xs text-green-300">Hoy</div>
          </div>
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30 text-center">
            <div className="text-lg font-semibold text-blue-400">{formatCurrency(getThisWeekTotal())}</div>
            <div className="text-xs text-blue-300">Esta Semana</div>
          </div>
          <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30 text-center">
            <div className="text-lg font-semibold text-purple-400">{formatCurrency(getThisMonthTotal())}</div>
            <div className="text-xs text-purple-300">Este Mes</div>
          </div>
        </div>

        {/* Navegación de vistas */}
        <div className="flex rounded-lg bg-gray-700/50 p-1 mb-6">
          {[
            { key: 'daily', label: 'Diario', icon: 'ri-calendar-line' },
            { key: 'weekly', label: 'Semanal', icon: 'ri-calendar-week-line' },
            { key: 'monthly', label: 'Mensual', icon: 'ri-calendar-month-line' }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setCurrentView(view.key as any)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                currentView === view.key
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              <i className={`${view.icon} mr-1`}></i>
              {view.label}
            </button>
          ))}
        </div>

        {/* Vista Diaria */}
        {currentView === 'daily' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Ingresos por Día</h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
              >
                <i className="ri-add-line mr-2"></i>
                Agregar
              </button>
            </div>

            {showAddForm && (
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fecha</label>
                    <input
                      type="date"
                      value={newIncome.date}
                      onChange={e => setNewIncome({ ...newIncome, date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Monto *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newIncome.amount}
                      onChange={e => setNewIncome({ ...newIncome, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nota (opcional)</label>
                  <input
                    type="text"
                    value={newIncome.note}
                    onChange={e => setNewIncome({ ...newIncome, note: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-white placeholder-gray-400"
                    placeholder="Ej: Trabajo, ventas, freelance..."
                    maxLength={100}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddIncome}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {[...dailyIncomes]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(income => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-green-400">{formatCurrency(income.amount)}</div>
                        <div className="text-sm text-gray-400">{formatDate(income.date)}</div>
                      </div>
                      {income.note && <div className="text-sm text-gray-300">{income.note}</div>}
                    </div>
                    <button
                      onClick={() => handleDeleteIncome(income.id)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                ))}

              {dailyIncomes.length === 0 && (
                <div className="text-center py-8">
                  <i className="ri-money-dollar-circle-line text-4xl text-gray-500 mb-4"></i>
                  <p className="text-gray-400">No hay ingresos registrados</p>
                  <p className="text-gray-500 text-sm">Agrega tu primer ingreso diario</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista Semanal */}
        {currentView === 'weekly' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Totales por Semana</h3>
            <div className="space-y-3">
              {getWeeklyTotals().map(week => (
                <div key={week.weekStart} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-medium text-white">
                        {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                      </div>
                      <div className="text-sm text-gray-400">{week.days.length} días trabajados</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-400">{formatCurrency(week.total)}</div>
                      <div className="text-sm text-gray-400">
                        Promedio: {formatCurrency(week.total / week.days.length)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {week.days.map(day => `${formatDate(day.date)}: ${formatCurrency(day.amount)}`).join(' • ')}
                  </div>
                </div>
              ))}

              {getWeeklyTotals().length === 0 && (
                <div className="text-center py-8">
                  <i className="ri-calendar-week-line text-4xl text-gray-500 mb-4"></i>
                  <p className="text-gray-400">No hay datos semanales</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista Mensual */}
        {currentView === 'monthly' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Totales por Mes</h3>
            <div className="space-y-3">
              {getMonthlyTotals().map(month => (
                <div key={month.month} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white">
                        {new Date(month.month + '-01').toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </div>
                      <div className="text-sm text-gray-400">{month.daysCount} días trabajados</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-400">{formatCurrency(month.total)}</div>
                      <div className="text-sm text-gray-400">
                        Promedio: {formatCurrency(month.average)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {getMonthlyTotals().length === 0 && (
                <div className="text-center py-8">
                  <i className="ri-calendar-month-line text-4xl text-gray-500 mb-4"></i>
                  <p className="text-gray-400">No hay datos mensuales</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

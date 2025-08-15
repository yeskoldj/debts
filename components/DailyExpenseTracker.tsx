'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DailyExpense {
  id: string;
  date: string;
  foodAmount: number;
  gasAmount: number;
  otherAmount: number;
  note?: string;
}

interface WeeklyExpenseTotal {
  weekStart: string;
  weekEnd: string;
  foodTotal: number;
  gasTotal: number;
  otherTotal: number;
  total: number;
  days: DailyExpense[];
}

interface MonthlyExpenseTotal {
  month: string;
  foodTotal: number;
  gasTotal: number;
  otherTotal: number;
  total: number;
  daysCount: number;
  foodAverage: number;
  gasAverage: number;
  otherAverage: number;
}

interface DailyExpenseTrackerProps {
  onClose: () => void;
}

export default function DailyExpenseTracker({ onClose }: DailyExpenseTrackerProps) {
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    foodAmount: '',
    gasAmount: '',
    otherAmount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadDailyExpenses();
  }, []);

  const loadDailyExpenses = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('dailyExpenses');
      if (stored) {
        setDailyExpenses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading daily expenses:', error);
    }
  };

  const saveDailyExpenses = (expenses: DailyExpense[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('dailyExpenses', JSON.stringify(expenses));
      setDailyExpenses(expenses);
    } catch (error) {
      console.error('Error saving daily expenses:', error);
    }
  };

  const handleAddExpense = () => {
    const foodAmount = parseFloat(newExpense.foodAmount) || 0;
    const gasAmount = parseFloat(newExpense.gasAmount) || 0;
    const otherAmount = parseFloat(newExpense.otherAmount) || 0;

    if (foodAmount + gasAmount + otherAmount <= 0) {
      alert('Por favor ingresa al menos un gasto válido');
      return;
    }

    // Verificar si ya existe un registro para esta fecha
    const existingIndex = dailyExpenses.findIndex(expense => expense.date === newExpense.date);

    const expense: DailyExpense = {
      id: Date.now().toString(),
      date: newExpense.date,
      foodAmount,
      gasAmount,
      otherAmount,
      note: newExpense.note.trim() || undefined
    };

    let updatedExpenses;
    if (existingIndex >= 0) {
      // Actualizar registro existente
      updatedExpenses = [...dailyExpenses];
      updatedExpenses[existingIndex] = {
        ...updatedExpenses[existingIndex],
        foodAmount: updatedExpenses[existingIndex].foodAmount + foodAmount,
        gasAmount: updatedExpenses[existingIndex].gasAmount + gasAmount,
        otherAmount: updatedExpenses[existingIndex].otherAmount + otherAmount,
        note: expense.note
      };
    } else {
      // Agregar nuevo registro
      updatedExpenses = [...dailyExpenses, expense];
    }

    saveDailyExpenses(updatedExpenses);

    setNewExpense({
      foodAmount: '',
      gasAmount: '',
      otherAmount: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowAddForm(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      const updatedExpenses = dailyExpenses.filter(expense => expense.id !== id);
      saveDailyExpenses(updatedExpenses);
    }
  };

  const getWeeklyTotals = (): WeeklyExpenseTotal[] => {
    const sortedExpenses = [...dailyExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const weeks: { [key: string]: DailyExpense[] } = {};

    sortedExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(expense);
    });

    return Object.entries(weeks)
      .map(([weekStart, days]) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return {
          weekStart,
          weekEnd: weekEnd.toISOString().split('T')[0],
          foodTotal: days.reduce((sum, day) => sum + day.foodAmount, 0),
          gasTotal: days.reduce((sum, day) => sum + day.gasAmount, 0),
          otherTotal: days.reduce((sum, day) => sum + day.otherAmount, 0),
          total: days.reduce((sum, day) => sum + day.foodAmount + day.gasAmount + day.otherAmount, 0),
          days: days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
      })
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
  };

  const getMonthlyTotals = (): MonthlyExpenseTotal[] => {
    const months: { [key: string]: DailyExpense[] } = {};

    dailyExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(expense);
    });

    return Object.entries(months)
      .map(([monthKey, days]) => {
        const foodTotal = days.reduce((sum, day) => sum + day.foodAmount, 0);
        const gasTotal = days.reduce((sum, day) => sum + day.gasAmount, 0);
        const otherTotal = days.reduce((sum, day) => sum + day.otherAmount, 0);
        
        return {
          month: monthKey,
          foodTotal,
          gasTotal,
          otherTotal,
          total: foodTotal + gasTotal + otherTotal,
          daysCount: days.length,
          foodAverage: foodTotal / days.length,
          gasAverage: gasTotal / days.length,
          otherAverage: otherTotal / days.length
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));
  };

  const getTodayTotal = () => {
    const today = new Date().toISOString().split('T')[0];
    return dailyExpenses
      .filter(expense => expense.date === today)
      .reduce((sum, expense) => sum + expense.foodAmount + expense.gasAmount + expense.otherAmount, 0);
  };

  const getThisWeekTotal = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return dailyExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= weekStart;
      })
      .reduce((sum, expense) => sum + expense.foodAmount + expense.gasAmount + expense.otherAmount, 0);
  };

  const getThisMonthTotal = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return dailyExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart;
      })
      .reduce((sum, expense) => sum + expense.foodAmount + expense.gasAmount + expense.otherAmount, 0);
  };

  const getRealWeeklyExpenses = () => {
    if (typeof window === 'undefined') return { food: 0, gas: 0, other: 0 };
    
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    return dailyExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= sevenDaysAgo && expenseDate <= today;
      })
      .reduce((totals, expense) => ({
        food: totals.food + expense.foodAmount,
        gas: totals.gas + expense.gasAmount,
        other: totals.other + expense.otherAmount
      }), { food: 0, gas: 0, other: 0 });
  };

  // Hacer disponible la función para el planificador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).getRealWeeklyExpenses = getRealWeeklyExpenses;
    }
  }, [dailyExpenses]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-2xl rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <i className="ri-shopping-cart-line mr-2 text-red-400"></i>
            Registro de Gastos Diarios
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
          <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30 text-center">
            <div className="text-lg font-semibold text-red-400">{formatCurrency(getTodayTotal())}</div>
            <div className="text-xs text-red-300">Hoy</div>
          </div>
          <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-500/30 text-center">
            <div className="text-lg font-semibold text-orange-400">{formatCurrency(getThisWeekTotal())}</div>
            <div className="text-xs text-orange-300">Esta Semana</div>
          </div>
          <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30 text-center">
            <div className="text-lg font-semibold text-yellow-400">{formatCurrency(getThisMonthTotal())}</div>
            <div className="text-xs text-yellow-300">Este Mes</div>
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
                  ? 'bg-red-600 text-white'
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
              <h3 className="text-lg font-medium text-white">Gastos por Día</h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
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
                      value={newExpense.date}
                      onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <i className="ri-restaurant-line mr-1 text-orange-400"></i>
                      Comida
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newExpense.foodAmount}
                      onChange={e => setNewExpense({ ...newExpense, foodAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <i className="ri-gas-station-line mr-1 text-blue-400"></i>
                      Gasolina
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newExpense.gasAmount}
                      onChange={e => setNewExpense({ ...newExpense, gasAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <i className="ri-shopping-bag-line mr-1 text-purple-400"></i>
                      Otros Gastos
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newExpense.otherAmount}
                      onChange={e => setNewExpense({ ...newExpense, otherAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nota (opcional)</label>
                  <input
                    type="text"
                    value={newExpense.note}
                    onChange={e => setNewExpense({ ...newExpense, note: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder-gray-400"
                    placeholder="Ej: Supermercado, gasolinera, cine..."
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
                    onClick={handleAddExpense}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {[...dailyExpenses]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(expense => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-red-400">
                          {formatCurrency(expense.foodAmount + expense.gasAmount + expense.otherAmount)}
                        </div>
                        <div className="text-sm text-gray-400">{formatDate(expense.date)}</div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        {expense.foodAmount > 0 && (
                          <span className="text-orange-400">
                            <i className="ri-restaurant-line mr-1"></i>
                            {formatCurrency(expense.foodAmount)}
                          </span>
                        )}
                        {expense.gasAmount > 0 && (
                          <span className="text-blue-400">
                            <i className="ri-gas-station-line mr-1"></i>
                            {formatCurrency(expense.gasAmount)}
                          </span>
                        )}
                        {expense.otherAmount > 0 && (
                          <span className="text-purple-400">
                            <i className="ri-shopping-bag-line mr-1"></i>
                            {formatCurrency(expense.otherAmount)}
                          </span>
                        )}
                      </div>
                      {expense.note && <div className="text-sm text-gray-300 mt-1">{expense.note}</div>}
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                ))}

              {dailyExpenses.length === 0 && (
                <div className="text-center py-8">
                  <i className="ri-shopping-cart-line text-4xl text-gray-500 mb-4"></i>
                  <p className="text-gray-400">No hay gastos registrados</p>
                  <p className="text-gray-500 text-sm">Agrega tu primer gasto diario</p>
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
                      <div className="text-sm text-gray-400">{week.days.length} días con gastos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-400">{formatCurrency(week.total)}</div>
                      <div className="text-sm text-gray-400">
                        Promedio: {formatCurrency(week.total / week.days.length)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-orange-400">
                      <i className="ri-restaurant-line mr-1"></i>
                      Comida: {formatCurrency(week.foodTotal)}
                    </div>
                    <div className="text-blue-400">
                      <i className="ri-gas-station-line mr-1"></i>
                      Gas: {formatCurrency(week.gasTotal)}
                    </div>
                    <div className="text-purple-400">
                      <i className="ri-shopping-bag-line mr-1"></i>
                      Otros: {formatCurrency(week.otherTotal)}
                    </div>
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
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-medium text-white">
                        {new Date(month.month + '-01').toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </div>
                      <div className="text-sm text-gray-400">{month.daysCount} días con gastos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-400">{formatCurrency(month.total)}</div>
                      <div className="text-sm text-gray-400">
                        Promedio diario: {formatCurrency(month.total / month.daysCount)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-orange-400">
                      <i className="ri-restaurant-line mr-1"></i>
                      Comida: {formatCurrency(month.foodTotal)}
                      <div className="text-gray-500">Prom: {formatCurrency(month.foodAverage)}</div>
                    </div>
                    <div className="text-blue-400">
                      <i className="ri-gas-station-line mr-1"></i>
                      Gas: {formatCurrency(month.gasTotal)}
                      <div className="text-gray-500">Prom: {formatCurrency(month.gasAverage)}</div>
                    </div>
                    <div className="text-purple-400">
                      <i className="ri-shopping-bag-line mr-1"></i>
                      Otros: {formatCurrency(month.otherTotal)}
                      <div className="text-gray-500">Prom: {formatCurrency(month.otherAverage)}</div>
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
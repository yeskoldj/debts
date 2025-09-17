export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    if (typeof crypto.getRandomValues === 'function') {
      const array = new Uint32Array(4);
      crypto.getRandomValues(array);
      return Array.from(array, value => value.toString(16).padStart(8, '0')).join('');
    }
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const getDaysUntilDue = (dueDateString: string): number => {
  const today = new Date();
  const dueDate = new Date(dueDateString);
  
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getWeeklyIncome = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem('dailyIncomes');
    if (!stored) return 0;

    const dailyIncomes = JSON.parse(stored);
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    return dailyIncomes
      .filter((income: any) => {
        const incomeDate = new Date(income.date);
        return incomeDate >= sevenDaysAgo && incomeDate <= today;
      })
      .reduce((sum: number, income: any) => sum + income.amount, 0);
  } catch {
    return 0;
  }
};

export const getWeeklyExpenses = (): { food: number; gas: number; other: number; total: number } => {
  if (typeof window === 'undefined') return { food: 0, gas: 0, other: 0, total: 0 };
  try {
    const stored = localStorage.getItem('dailyExpenses');
    if (!stored) return { food: 0, gas: 0, other: 0, total: 0 };

    const dailyExpenses = JSON.parse(stored);
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    return dailyExpenses
      .filter((expense: any) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= sevenDaysAgo && expenseDate <= today;
      })
      .reduce((totals: any, expense: any) => ({
        food: totals.food + expense.foodAmount,
        gas: totals.gas + expense.gasAmount,
        other: totals.other + expense.otherAmount,
        total: totals.total + expense.foodAmount + expense.gasAmount + expense.otherAmount
      }), { food: 0, gas: 0, other: 0, total: 0 });
  } catch {
    return { food: 0, gas: 0, other: 0, total: 0 };
  }
};

export const getUpcomingDueDates = (): Array<{ debt: any, daysLeft: number }> => {
  // Esta función se usará para las notificaciones
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('debts');
    const debts = stored ? JSON.parse(stored) : [];
    
    return debts
      .filter((debt: any) => {
        if (!debt.dueDate) return false;
        const totalPaid = debt.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
        const remainingAmount = debt.totalAmount - totalPaid;
        return remainingAmount > 0; // Solo deudas activas
      })
      .map((debt: any) => ({
        debt,
        daysLeft: getDaysUntilDue(debt.dueDate)
      }))
      .filter((item: any) => item.daysLeft >= -1 && item.daysLeft <= 3) // 3 días antes hasta 1 día después
      .sort((a: any, b: any) => a.daysLeft - b.daysLeft);
  } catch {
    return [];
  }
};
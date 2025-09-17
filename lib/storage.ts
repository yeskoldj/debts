import { Debt, Payment, SavingGoal } from '@/lib/types';

const DEBTS_KEY = 'debts';
const SAVINGS_KEY = 'savingGoals';

const normalizeDebt = (debt: any): Debt => {
  const kind = debt.kind ?? 'loan';

  return {
    ...debt,
    kind,
    recurringAmount:
      kind === 'recurring'
        ? Number(debt.recurringAmount ?? debt.totalAmount ?? 0)
        : debt.recurringAmount,
    recurringFrequency:
      kind === 'recurring'
        ? debt.recurringFrequency ?? 'monthly'
        : debt.recurringFrequency,
    installmentAmount:
      kind === 'installment'
        ? Number(debt.installmentAmount ?? debt.totalAmount ?? 0)
        : debt.installmentAmount,
    totalInstallments:
      kind === 'installment'
        ? debt.totalInstallments ?? undefined
        : debt.totalInstallments,
    completedInstallments:
      kind === 'installment'
        ? debt.completedInstallments ?? 0
        : debt.completedInstallments ?? 0,
    payments: Array.isArray(debt.payments) ? debt.payments : [],
    createdAt: debt.createdAt ?? new Date().toISOString(),
  } as Debt;
};

export const getDebts = (): Debt[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(DEBTS_KEY);
    const debts = stored ? JSON.parse(stored) : [];
    return debts.map(normalizeDebt);
  } catch {
    return [];
  }
};

export const saveDebt = (debt: Debt): void => {
  if (typeof window === 'undefined') return;

  const debts = getDebts();
  const normalizedDebt = normalizeDebt(debt);
  const existingIndex = debts.findIndex(d => d.id === debt.id);

  if (existingIndex >= 0) {
    debts[existingIndex] = { ...debts[existingIndex], ...normalizedDebt };
  } else {
    debts.push(normalizedDebt);
  }

  localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
};

export const deleteDebt = (debtId: string): void => {
  if (typeof window === 'undefined') return;
  
  const debts = getDebts().filter(debt => debt.id !== debtId);
  localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
};

export const addPayment = (debtId: string, payment: Payment): void => {
  if (typeof window === 'undefined') return;

  const debts = getDebts();
  const debt = debts.find(d => d.id === debtId);

  if (debt) {
    debt.payments.push(payment);
    if (debt.kind === 'installment' && debt.installmentAmount) {
      const principalPaid = debt.payments
        .filter(p => p.type === 'principal')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalInstallments = debt.totalInstallments ?? Number.POSITIVE_INFINITY;
      debt.completedInstallments = Math.min(
        totalInstallments,
        Math.floor(principalPaid / debt.installmentAmount)
      );
    }
    localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
  }
};

export const deletePayment = (debtId: string, paymentId: string): void => {
  if (typeof window === 'undefined') return;

  const debts = getDebts();
  const debt = debts.find(d => d.id === debtId);

  if (debt) {
    debt.payments = debt.payments.filter(p => p.id !== paymentId);
    if (debt.kind === 'installment' && debt.installmentAmount) {
      const principalPaid = debt.payments
        .filter(p => p.type === 'principal')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalInstallments = debt.totalInstallments ?? Number.POSITIVE_INFINITY;
      debt.completedInstallments = Math.min(
        totalInstallments,
        Math.floor(principalPaid / debt.installmentAmount)
      );
    }
    localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
  }
};

export const exportDebts = (): void => {
  const debts = getDebts();
  const dataStr = JSON.stringify(debts, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `mis-deudas-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

export const importDebts = (jsonData: string): boolean => {
  try {
    const debts = JSON.parse(jsonData);
    
    if (!Array.isArray(debts)) return false;
    
    // Validar estructura básica
    const isValid = debts.every(debt => 
      debt.id && debt.name && typeof debt.totalAmount === 'number' && 
      debt.startDate && Array.isArray(debt.payments)
    );
    
    if (!isValid) return false;
    
    localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
    return true;
  } catch {
    return false;
  }
};

export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEBTS_KEY);
};

export const loadSampleDebts = (): void => {
  if (typeof window === 'undefined') return;

  const sampleDebts: Debt[] = [
    {
      id: 'debt-1',
      name: 'Gold_old_pastdue',
      description: 'Deuda vencida pendiente de pago urgente',
      totalAmount: 418.0,
      interestRate: 24.99,
      startDate: '2025-01-01',
      dueDate: '2025-01-07',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'credit_card'
    },
    {
      id: 'debt-2',
      name: 'TM',
      description: 'Pago mensual de servicios',
      totalAmount: 200.0,
      startDate: '2025-01-01',
      dueDate: '2025-08-13',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'recurring',
      recurringAmount: 200,
      recurringFrequency: 'monthly'
    },
    {
      id: 'debt-3',
      name: 'Acura',
      description: 'Financiamiento del vehículo',
      totalAmount: 595.0,
      interestRate: 8.5,
      startDate: '2025-01-01',
      dueDate: '2025-08-18',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'installment',
      installmentAmount: 595 / 12,
      totalInstallments: 12,
      completedInstallments: 0
    },
    {
      id: 'debt-4',
      name: 'Xfinity',
      description: 'Servicio de internet y cable',
      totalAmount: 30.0,
      startDate: '2025-01-01',
      dueDate: '2025-08-18',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'recurring',
      recurringAmount: 30,
      recurringFrequency: 'monthly'
    },
    {
      id: 'debt-5',
      name: 'Cp1CC',
      description: 'Tarjeta de crédito Capital One',
      totalAmount: 25.0,
      interestRate: 19.99,
      startDate: '2025-01-01',
      dueDate: '2025-08-27',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'credit_card'
    },
    {
      id: 'debt-6',
      name: 'Geico',
      description: 'Seguro de auto mensual',
      totalAmount: 537.0,
      startDate: '2025-01-01',
      dueDate: '2025-09-01',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'recurring',
      recurringAmount: 537,
      recurringFrequency: 'monthly'
    },
    {
      id: 'debt-7',
      name: 'Home',
      description: 'Pagos de hipoteca',
      totalAmount: 750.0,
      interestRate: 6.25,
      startDate: '2025-01-01',
      dueDate: '2025-09-05',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'loan'
    },
    {
      id: 'debt-8',
      name: 'Tickets',
      description: 'Multas de tráfico pendientes',
      totalAmount: 200.0,
      startDate: '2025-01-01',
      dueDate: '2025-10-01',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'other'
    },
    {
      id: 'debt-9',
      name: 'GoldCubanBalance',
      description: 'Balance pendiente de cuenta oro',
      totalAmount: 1200.0,
      interestRate: 15.0,
      startDate: '2025-01-01',
      dueDate: '2025-10-04',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'credit_card'
    },
    {
      id: 'debt-10',
      name: 'Gold_cuban_tax',
      description: 'Impuestos sobre cuenta oro',
      totalAmount: 166.0,
      startDate: '2025-01-01',
      dueDate: '2025-10-05',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'other'
    },
    {
      id: 'debt-11',
      name: 'GoldSolidCubanBalance',
      description: 'Balance de cuenta oro sólida',
      totalAmount: 800.0,
      interestRate: 12.5,
      startDate: '2025-01-01',
      dueDate: '2025-10-11',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'loan'
    },
    {
      id: 'debt-12',
      name: 'Gold_balance_old',
      description: 'Balance antiguo de cuenta oro',
      totalAmount: 1510.0,
      interestRate: 18.99,
      startDate: '2025-01-01',
      dueDate: '2025-10-15',
      payments: [],
      createdAt: new Date().toISOString(),
      kind: 'credit_card'
    }
  ];

  localStorage.setItem(DEBTS_KEY, JSON.stringify(sampleDebts.map(normalizeDebt)));
};

export const getSavingGoals = (): SavingGoal[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(SAVINGS_KEY);
    if (!stored) return [];
    const goals = JSON.parse(stored) as SavingGoal[];
    return goals.map(goal => ({
      ...goal,
      priority: goal.priority ?? 'important',
      deadline: goal.deadline ?? null,
      notes: goal.notes ?? undefined,
      updatedAt: goal.updatedAt ?? goal.createdAt ?? new Date().toISOString(),
      lastContributionAt: goal.lastContributionAt ?? goal.updatedAt ?? null,
      lastContributionNote: goal.lastContributionNote ?? undefined,
    }));
  } catch {
    return [];
  }
};

export const saveSavingGoal = (goal: SavingGoal): void => {
  if (typeof window === 'undefined') return;

  const goals = getSavingGoals();
  const index = goals.findIndex(g => g.id === goal.id);
  const normalizedGoal: SavingGoal = {
    ...goal,
    deadline: goal.deadline ?? null,
    notes: goal.notes?.trim() ? goal.notes : undefined,
    priority: goal.priority ?? 'important',
    updatedAt: new Date().toISOString(),
    lastContributionAt: goal.lastContributionAt ?? null,
    lastContributionNote: goal.lastContributionNote ?? undefined,
  };

  if (index >= 0) {
    goals[index] = { ...goals[index], ...normalizedGoal };
  } else {
    goals.push(normalizedGoal);
  }

  localStorage.setItem(SAVINGS_KEY, JSON.stringify(goals));
};

export const deleteSavingGoal = (goalId: string): void => {
  if (typeof window === 'undefined') return;

  const goals = getSavingGoals().filter(goal => goal.id !== goalId);
  localStorage.setItem(SAVINGS_KEY, JSON.stringify(goals));
};

export const recordSavingContribution = (goalId: string, amount: number, note?: string): SavingGoal | null => {
  if (typeof window === 'undefined') return null;

  const goals = getSavingGoals();
  const goal = goals.find(g => g.id === goalId);

  if (!goal) return null;

  const updatedGoal: SavingGoal = {
    ...goal,
    currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount),
    updatedAt: new Date().toISOString(),
    lastContributionAt: new Date().toISOString(),
  };

  if (note) {
    updatedGoal.lastContributionNote = note;
  }

  saveSavingGoal(updatedGoal);
  return updatedGoal;
};

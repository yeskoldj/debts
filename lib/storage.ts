import { Debt, DebtKind, Payment, RecurringFrequency, SavingGoal } from '@/lib/types';
import { generateId } from '@/lib/utils';

const DEBTS_KEY = 'debts';
const SAVINGS_KEY = 'savingGoals';

const validKinds: DebtKind[] = ['recurring', 'installment', 'loan', 'credit_card', 'other'];
const validFrequencies: RecurringFrequency[] = ['weekly', 'biweekly', 'monthly'];
const validPaymentTypes: Payment['type'][] = ['principal', 'interest', 'fee'];

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toNonNegativeNumber = (value: unknown): number | undefined => {
  const parsed = toNumber(value);
  if (parsed === undefined) return undefined;
  return parsed >= 0 ? parsed : undefined;
};

const toPositiveNumber = (value: unknown): number | undefined => {
  const parsed = toNumber(value);
  if (parsed === undefined) return undefined;
  return parsed > 0 ? parsed : undefined;
};

const toPositiveInteger = (value: unknown): number | undefined => {
  const parsed = toNumber(value);
  if (parsed === undefined) return undefined;
  const intValue = Math.floor(parsed);
  return intValue > 0 ? intValue : undefined;
};

const toNonNegativeInteger = (value: unknown): number | undefined => {
  const parsed = toNumber(value);
  if (parsed === undefined) return undefined;
  const intValue = Math.floor(parsed);
  return intValue >= 0 ? intValue : undefined;
};

const sanitizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const sanitizeDate = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeKind = (value: unknown): DebtKind => {
  if (typeof value === 'string' && validKinds.includes(value as DebtKind)) {
    return value as DebtKind;
  }
  return 'loan';
};

const sanitizeFrequency = (value: unknown): RecurringFrequency | undefined => {
  if (typeof value === 'string' && validFrequencies.includes(value as RecurringFrequency)) {
    return value as RecurringFrequency;
  }
  return undefined;
};

const sanitizePayments = (value: unknown): Payment[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((payment: any) => {
      if (!payment || typeof payment !== 'object') return null;

      const amount = toNonNegativeNumber(payment.amount) ?? 0;
      const rawType = typeof payment.type === 'string' ? payment.type : undefined;
      const type = rawType && validPaymentTypes.includes(rawType as Payment['type'])
        ? (rawType as Payment['type'])
        : 'principal';
      const note = sanitizeText(payment.note);

      const id = typeof payment.id === 'string' && payment.id.trim().length > 0
        ? payment.id
        : generateId();

      const date = typeof payment.date === 'string' && payment.date.trim().length > 0
        ? payment.date
        : new Date().toISOString();

      return {
        id,
        amount,
        date,
        note,
        type,
      } satisfies Payment;
    })
    .filter((payment): payment is Payment => payment !== null);
};

const normalizeDebt = (debt: any): Debt => {
  const kind = sanitizeKind(debt?.kind);
  const totalAmount = toPositiveNumber(debt?.totalAmount) ?? 0;
  const interestRate = toNonNegativeNumber(debt?.interestRate);
  const description = sanitizeText(debt?.description);

  const payments = sanitizePayments(debt?.payments);
  const createdAt = typeof debt?.createdAt === 'string' && debt.createdAt
    ? debt.createdAt
    : new Date().toISOString();
  const startDate = typeof debt?.startDate === 'string' && debt.startDate
    ? debt.startDate
    : new Date().toISOString().split('T')[0];
  const dueDate = sanitizeDate(debt?.dueDate);

  const recurringAmount = kind === 'recurring'
    ? toPositiveNumber(debt?.recurringAmount)
    : undefined;
  const recurringFrequency = kind === 'recurring'
    ? sanitizeFrequency(debt?.recurringFrequency) ?? 'monthly'
    : undefined;

  const installmentAmount = kind === 'installment'
    ? toPositiveNumber(debt?.installmentAmount)
    : undefined;
  const totalInstallments = kind === 'installment'
    ? toPositiveInteger(debt?.totalInstallments)
    : undefined;
  const completedInstallments = kind === 'installment'
    ? Math.min(
        totalInstallments ?? Number.POSITIVE_INFINITY,
        toNonNegativeInteger(debt?.completedInstallments) ?? 0
      )
    : undefined;

  const id = typeof debt?.id === 'string' && debt.id.trim().length > 0
    ? debt.id
    : generateId();
  const name = typeof debt?.name === 'string' && debt.name.trim().length > 0
    ? debt.name.trim()
    : 'Deuda sin nombre';

  const normalizedDebt: Debt = {
    id,
    name,
    totalAmount,
    startDate,
    dueDate,
    payments,
    createdAt,
    kind,
  };

  if (description) {
    normalizedDebt.description = description;
  }

  if (interestRate !== undefined) {
    normalizedDebt.interestRate = interestRate;
  }

  if (recurringAmount !== undefined) {
    normalizedDebt.recurringAmount = recurringAmount;
    normalizedDebt.recurringFrequency = recurringFrequency ?? 'monthly';
  }

  if (installmentAmount !== undefined) {
    normalizedDebt.installmentAmount = installmentAmount;
  }

  if (totalInstallments !== undefined) {
    normalizedDebt.totalInstallments = totalInstallments;
  }

  if (completedInstallments !== undefined) {
    normalizedDebt.completedInstallments = completedInstallments;
  }

  return normalizedDebt;
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
    } else if (debt.kind === 'recurring') {
      const paymentDate = new Date(payment.date);
      if (!Number.isNaN(paymentDate.getTime())) {
        const nextDue = new Date(paymentDate);
        const daysToAdd = debt.recurringFrequency === 'weekly'
          ? 7
          : debt.recurringFrequency === 'biweekly'
            ? 15
            : 30;
        nextDue.setDate(nextDue.getDate() + daysToAdd);
        debt.dueDate = nextDue.toISOString().split('T')[0];
      }
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
      totalAmount: 0,
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
      totalAmount: 0,
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
      totalAmount: 0,
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

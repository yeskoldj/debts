
export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  type: 'principal' | 'interest' | 'fee';
}

export type DebtKind =
  | 'recurring'
  | 'installment'
  | 'loan'
  | 'credit_card'
  | 'other';

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface Debt {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  interestRate?: number;
  startDate: string;
  dueDate: string | null;
  payments: Payment[];
  createdAt: string;
  kind: DebtKind;
  recurringAmount?: number;
  recurringFrequency?: RecurringFrequency;
  installmentAmount?: number;
  totalInstallments?: number;
  completedInstallments?: number;
}

export type DebtFilter = 'all' | 'active' | 'paid';

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  priority: 'essential' | 'important' | 'nice_to_have';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastContributionAt?: string | null;
  lastContributionNote?: string;
}

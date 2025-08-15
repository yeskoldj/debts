
export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  type: 'principal' | 'interest' | 'fee';
}

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
}

export type DebtFilter = 'all' | 'active' | 'paid';

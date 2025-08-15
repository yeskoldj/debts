import { Debt, Payment } from '@/lib/types';

const DEBTS_KEY = 'debts';

export const getDebts = (): Debt[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(DEBTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveDebt = (debt: Debt): void => {
  if (typeof window === 'undefined') return;
  
  const debts = getDebts();
  const existingIndex = debts.findIndex(d => d.id === debt.id);
  
  if (existingIndex >= 0) {
    debts[existingIndex] = debt;
  } else {
    debts.push(debt);
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
    localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
  }
};

export const deletePayment = (debtId: string, paymentId: string): void => {
  if (typeof window === 'undefined') return;
  
  const debts = getDebts();
  const debt = debts.find(d => d.id === debtId);
  
  if (debt) {
    debt.payments = debt.payments.filter(p => p.id !== paymentId);
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'debt-2',
      name: 'TM',
      description: 'Pago mensual de servicios',
      totalAmount: 200.0,
      startDate: '2025-01-01',
      dueDate: '2025-08-13',
      payments: [],
      createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'debt-4',
      name: 'Xfinity',
      description: 'Servicio de internet y cable',
      totalAmount: 30.0,
      startDate: '2025-01-01',
      dueDate: '2025-08-18',
      payments: [],
      createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'debt-6',
      name: 'Geico',
      description: 'Seguro de auto mensual',
      totalAmount: 537.0,
      startDate: '2025-01-01',
      dueDate: '2025-09-01',
      payments: [],
      createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'debt-8',
      name: 'Tickets',
      description: 'Multas de tráfico pendientes',
      totalAmount: 200.0,
      startDate: '2025-01-01',
      dueDate: '2025-10-01',
      payments: [],
      createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'debt-10',
      name: 'Gold_cuban_tax',
      description: 'Impuestos sobre cuenta oro',
      totalAmount: 166.0,
      startDate: '2025-01-01',
      dueDate: '2025-10-05',
      payments: [],
      createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    }
  ];
  
  localStorage.setItem(DEBTS_KEY, JSON.stringify(sampleDebts));
};
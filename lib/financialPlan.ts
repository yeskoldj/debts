
import { Debt } from '@/lib/types';
import { getDebts } from '@/lib/storage';
import { getDaysUntilDue } from '@/lib/utils';

export interface SavedFinancialPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  weeklyIncome: number;
  essentialExpenses: number;
  otherExpenses: number;
  availableForDebts: number;
  weeklyTarget: number;
  recommendations: DebtRecommendation[];
  progress: PlanProgress;
  status: 'active' | 'completed' | 'needs_update';
}

export interface DebtRecommendation {
  debtId: string;
  debtName: string;
  currentAmount: number;
  suggestedPayment: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  daysLeft: number;
  reason: string;
  weeksPaid: number;
  totalWeeksNeeded: number;
}

export interface PlanProgress {
  weeksCompleted: number;
  totalAmountPaid: number;
  onTrackDebts: number;
  behindDebts: number;
  completedDebts: number;
  projectedCompletion: string;
  incomeGap: number; // Cuánto falta para cumplir el plan
  recommendations: string[];
}

const PLAN_STORAGE_KEY = 'savedFinancialPlan';

export const saveFinancialPlan = (plan: Omit<SavedFinancialPlan, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'status'>): SavedFinancialPlan => {
  const now = new Date().toISOString();
  const progress = calculatePlanProgress(plan.recommendations);
  
  const savedPlan: SavedFinancialPlan = {
    ...plan,
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now,
    progress,
    status: 'active'
  };

  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(savedPlan));
  return savedPlan;
};

export const getSavedFinancialPlan = (): SavedFinancialPlan | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!stored) return null;
    
    const plan: SavedFinancialPlan = JSON.parse(stored);
    
    // Actualizar progreso cada vez que se obtiene el plan
    const updatedProgress = calculatePlanProgress(plan.recommendations);
    const updatedPlan = {
      ...plan,
      progress: updatedProgress,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(updatedPlan));
    return updatedPlan;
  } catch {
    return null;
  }
};

export const updateFinancialPlan = (updates: Partial<SavedFinancialPlan>): SavedFinancialPlan | null => {
  const currentPlan = getSavedFinancialPlan();
  if (!currentPlan) return null;
  
  const updatedPlan: SavedFinancialPlan = {
    ...currentPlan,
    ...updates,
    updatedAt: new Date().toISOString(),
    progress: calculatePlanProgress(updates.recommendations || currentPlan.recommendations)
  };
  
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(updatedPlan));
  return updatedPlan;
};

export const calculatePlanProgress = (recommendations: DebtRecommendation[]): PlanProgress => {
  const debts = getDebts();
  const planCreated = getSavedFinancialPlan()?.createdAt;
  
  if (!planCreated) {
    return {
      weeksCompleted: 0,
      totalAmountPaid: 0,
      onTrackDebts: 0,
      behindDebts: 0,
      completedDebts: 0,
      projectedCompletion: new Date().toISOString(),
      incomeGap: 0,
      recommendations: []
    };
  }
  
  const planStartDate = new Date(planCreated);
  const now = new Date();
  const weeksCompleted = Math.floor((now.getTime() - planStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  let totalAmountPaid = 0;
  let onTrackDebts = 0;
  let behindDebts = 0;
  let completedDebts = 0;
  const progressRecommendations: string[] = [];
  
  recommendations.forEach(rec => {
    const debt = debts.find(d => d.id === rec.debtId);
    if (!debt) return;
    
    const principalPaid = debt.payments
      .filter(p => p.type === 'principal' && new Date(p.date) >= planStartDate)
      .reduce((sum, p) => sum + p.amount, 0);
    
    totalAmountPaid += principalPaid;
    
    const expectedPaid = rec.suggestedPayment * weeksCompleted;
    const remainingAmount = debt.totalAmount - debt.payments
      .filter(p => p.type === 'principal')
      .reduce((sum, p) => sum + p.amount, 0);
    
    if (remainingAmount <= 0) {
      completedDebts++;
    } else if (principalPaid >= expectedPaid * 0.9) {
      onTrackDebts++;
    } else {
      behindDebts++;
      const deficit = expectedPaid - principalPaid;
      progressRecommendations.push(
        `${debt.name}: Necesitas $${deficit.toFixed(2)} adicionales para ponerte al día`
      );
    }
  });
  
  // Calcular proyección de finalización
  const totalWeeklyTarget = recommendations.reduce((sum, rec) => sum + rec.suggestedPayment, 0);
  const remainingAmount = recommendations.reduce((sum, rec) => {
    const debt = debts.find(d => d.id === rec.debtId);
    if (!debt) return sum;
    const paid = debt.payments.filter(p => p.type === 'principal').reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, debt.totalAmount - paid);
  }, 0);
  
  const weeksToComplete = totalWeeklyTarget > 0 ? Math.ceil(remainingAmount / totalWeeklyTarget) : 0;
  const projectedCompletion = new Date();
  projectedCompletion.setDate(projectedCompletion.getDate() + (weeksToComplete * 7));
  
  // Calcular brecha de ingresos
  const currentPlan = getSavedFinancialPlan();
  const actualWeeklyIncome = getWeeklyIncome();
  const incomeGap = currentPlan ? Math.max(0, currentPlan.weeklyTarget + currentPlan.essentialExpenses + currentPlan.otherExpenses - actualWeeklyIncome) : 0;
  
  if (incomeGap > 0) {
    progressRecommendations.push(
      `Necesitas generar $${incomeGap.toFixed(2)} más por semana para cumplir tu plan`
    );
  }
  
  return {
    weeksCompleted,
    totalAmountPaid,
    onTrackDebts,
    behindDebts,
    completedDebts,
    projectedCompletion: projectedCompletion.toISOString(),
    incomeGap,
    recommendations: progressRecommendations
  };
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

export const deleteSavedPlan = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PLAN_STORAGE_KEY);
  }
};

export const generateRecommendations = (debts: Debt[], availableMoney: number): DebtRecommendation[] => {
  const debtAnalysis = debts.map(debt => {
    const principalPaid = debt.payments.filter(p => p.type === 'principal').reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = debt.totalAmount - principalPaid;
    const daysLeft = debt.dueDate ? getDaysUntilDue(debt.dueDate) : 999;

    let priority: 'urgent' | 'high' | 'medium' | 'low' = 'low';
    let reason = '';

    if (daysLeft < 0) {
      priority = 'urgent';
      reason = `¡VENCIDA! ${Math.abs(daysLeft)} días de retraso`;
    } else if (daysLeft <= 7) {
      priority = 'urgent';
      reason = `Vence en ${daysLeft} días`;
    } else if (daysLeft <= 30) {
      priority = 'high';
      reason = `Vence en ${daysLeft} días`;
    } else if (daysLeft <= 60) {
      priority = 'medium';
      reason = `Vence en ${daysLeft} días`;
    } else {
      priority = 'low';
      reason = `Vence en ${daysLeft} días`;
    }

    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
    const minimumWeeklyPayment = remainingAmount / weeksLeft;

    return {
      debt,
      remainingAmount,
      daysLeft,
      priority,
      reason,
      minimumWeeklyPayment,
      urgencyScore: daysLeft < 0 ? 1000 : (100 - daysLeft),
      weeksLeft
    };
  });

  debtAnalysis.sort((a, b) => b.urgencyScore - a.urgencyScore);

  let remainingMoney = availableMoney;
  const recommendations: DebtRecommendation[] = [];

  for (const analysis of debtAnalysis) {
    if (analysis.priority === 'urgent' && remainingMoney > 0) {
      const suggestedPayment = Math.min(
        analysis.minimumWeeklyPayment * 1.5,
        analysis.remainingAmount,
        remainingMoney
      );

      recommendations.push({
        debtId: analysis.debt.id,
        debtName: analysis.debt.name,
        currentAmount: analysis.remainingAmount,
        suggestedPayment: Math.round(suggestedPayment * 100) / 100,
        priority: analysis.priority,
        daysLeft: analysis.daysLeft,
        reason: analysis.reason,
        weeksPaid: 0,
        totalWeeksNeeded: Math.ceil(analysis.remainingAmount / suggestedPayment)
      });

      remainingMoney -= suggestedPayment;
    }
  }

  for (const analysis of debtAnalysis) {
    if (analysis.priority !== 'urgent' && remainingMoney > 10) {
      const existingRec = recommendations.find(r => r.debtId === analysis.debt.id);
      if (existingRec) continue;

      const suggestedPayment = Math.min(
        analysis.minimumWeeklyPayment,
        analysis.remainingAmount,
        remainingMoney * (analysis.priority === 'high' ? 0.4 : analysis.priority === 'medium' ? 0.3 : 0.2)
      );

      if (suggestedPayment >= 5) {
        recommendations.push({
          debtId: analysis.debt.id,
          debtName: analysis.debt.name,
          currentAmount: analysis.remainingAmount,
          suggestedPayment: Math.round(suggestedPayment * 100) / 100,
          priority: analysis.priority,
          daysLeft: analysis.daysLeft,
          reason: analysis.reason,
          weeksPaid: 0,
          totalWeeksNeeded: Math.ceil(analysis.remainingAmount / suggestedPayment)
        });

        remainingMoney -= suggestedPayment;
      }
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

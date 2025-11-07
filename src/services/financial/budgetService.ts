import { supabase } from '@/integrations/supabase/client';

export interface Budget {
  id: string;
  category: string;
  budget_amount: number;
  period_type: 'monthly' | 'yearly';
  year: number;
  month?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetAnalysis {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'on_track' | 'near_limit' | 'exceeded';
}

export const getBudgets = async (year?: number, month?: number): Promise<Budget[]> => {
  try {
    let query = supabase
      .from('financial_budgets')
      .select('*')
      .order('category');

    if (year) {
      query = query.eq('year', year);
    }

    if (month) {
      query = query.eq('month', month);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }

    return data as Budget[];
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
};

export const addBudget = async (
  category: string,
  budget_amount: number,
  period_type: 'monthly' | 'yearly',
  year: number,
  month?: number
): Promise<Budget | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('financial_budgets')
      .insert({
        category,
        budget_amount,
        period_type,
        year,
        month,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as Budget;
  } catch (error) {
    console.error('Error adding budget:', error);
    return null;
  }
};

export const updateBudget = async (
  id: string,
  updates: Partial<Budget>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('financial_budgets')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating budget:', error);
    return false;
  }
};

export const deleteBudget = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('financial_budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting budget:', error);
    return false;
  }
};

export const analyzeBudget = async (budget: Budget): Promise<BudgetAnalysis> => {
  try {
    const { data: entries, error } = await supabase
      .from('farm_ledger')
      .select('amount, transaction_type')
      .eq('category', budget.category)
      .eq('transaction_type', 'expense');

    if (error) throw error;

    // Filter by period
    let filteredEntries = entries || [];
    if (budget.period_type === 'monthly' && budget.month) {
      const startDate = new Date(budget.year, budget.month - 1, 1);
      const endDate = new Date(budget.year, budget.month, 0);
      // Additional date filtering would be needed here
    }

    const spent = filteredEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
    const remaining = budget.budget_amount - spent;
    const percentage = (spent / budget.budget_amount) * 100;

    let status: 'on_track' | 'near_limit' | 'exceeded' = 'on_track';
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= 80) {
      status = 'near_limit';
    }

    return {
      budget,
      spent,
      remaining,
      percentage,
      status
    };
  } catch (error) {
    console.error('Error analyzing budget:', error);
    return {
      budget,
      spent: 0,
      remaining: budget.budget_amount,
      percentage: 0,
      status: 'on_track'
    };
  }
};

import { supabase } from '@/integrations/supabase/client';

export interface FarmLedgerEntry {
  id: string;
  transaction_type: 'sale' | 'payment' | 'expense' | 'income';
  reference_id?: string;
  reference_type?: string;
  amount: number;
  description: string;
  transaction_date: string;
  user_id: string;
  metadata?: any;
  created_at: string;
}

export interface LedgerSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalSales: number;
  totalPayments: number;
  outstandingAmount: number;
}

// Get all ledger entries
export const getLedgerEntries = async (dateRange?: { start: string; end: string }): Promise<FarmLedgerEntry[]> => {
  try {
    let query = supabase
      .from('farm_ledger')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (dateRange) {
      query = query
        .gte('transaction_date', dateRange.start)
        .lte('transaction_date', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ledger entries:', error);
      return [];
    }

    return data as FarmLedgerEntry[];
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    return [];
  }
};

// Get ledger summary
export const getLedgerSummary = async (dateRange?: { start: string; end: string }): Promise<LedgerSummary> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const entries = await getLedgerEntries(dateRange);
    
    // Calculate expenses from ledger
    let totalExpenses = 0;
    entries.forEach(entry => {
      if (entry.transaction_type === 'expense') {
        totalExpenses += Math.abs(entry.amount); // Ensure positive
      }
    });
    
    // Get actual payments received from sale_payments table
    let paymentsQuery = supabase
      .from('sale_payments')
      .select('amount, payment_date');
    
    if (dateRange) {
      paymentsQuery = paymentsQuery
        .gte('payment_date', dateRange.start)
        .lte('payment_date', dateRange.end);
    }
    
    const { data: paymentsData } = await paymentsQuery;
    const totalPayments = paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    
    // Get sales summary
    let salesQuery = supabase
      .from('animal_sales')
      .select('total_amount, sale_date');
    
    if (dateRange) {
      salesQuery = salesQuery
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end);
    }
    
    const { data: salesData } = await salesQuery;
    const totalSales = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
    
    // Calculate outstanding amount
    const outstandingAmount = totalSales - totalPayments;
    
    // Revenue is only actual payments received
    const totalRevenue = totalPayments;
    const netIncome = totalRevenue - totalExpenses;
    
    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      totalSales,
      totalPayments,
      outstandingAmount
    };
  } catch (error) {
    console.error('Error calculating ledger summary:', error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      totalSales: 0,
      totalPayments: 0,
      outstandingAmount: 0
    };
  }
};

// Add ledger entry
export const addLedgerEntry = async (entry: Omit<FarmLedgerEntry, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('farm_ledger')
      .insert({
        ...entry,
        user_id: user.id
      });

    if (error) {
      console.error('Error adding ledger entry:', error);
      throw new Error('Failed to add ledger entry');
    }

    return true;
  } catch (error) {
    console.error('Error adding ledger entry:', error);
    throw error;
  }
};

// Get revenue by month
export const getMonthlyRevenue = async (year: number): Promise<Array<{ month: number; revenue: number; expenses: number }>> => {
  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const entries = await getLedgerEntries({ start: startDate, end: endDate });
    
    const monthlyData: Array<{ month: number; revenue: number; expenses: number }> = [];
    
    for (let month = 1; month <= 12; month++) {
      const monthEntries = entries.filter(entry => {
        const entryMonth = new Date(entry.transaction_date).getMonth() + 1;
        return entryMonth === month;
      });
      
      const revenue = monthEntries
        .filter(entry => ['sale', 'income'].includes(entry.transaction_type))
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const expenses = monthEntries
        .filter(entry => entry.transaction_type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      monthlyData.push({ month, revenue, expenses });
    }
    
    return monthlyData;
  } catch (error) {
    console.error('Error getting monthly revenue:', error);
    return [];
  }
};

// Get sales analytics
export const getSalesAnalytics = async (dateRange?: { start: string; end: string }) => {
  try {
    const { data: salesData, error } = await supabase
      .from('animal_sales')
      .select(`
        *,
        animal:animals(species, breed)
      `)
      .gte('sale_date', dateRange?.start || '2020-01-01')
      .lte('sale_date', dateRange?.end || '2030-12-31')
      .order('sale_date', { ascending: false });

    if (error) {
      console.error('Error fetching sales analytics:', error);
      return {
        totalSales: 0,
        totalRevenue: 0,
        averageSalePrice: 0,
        salesBySpecies: {},
        salesByMonth: {},
        outstandingPayments: 0
      };
    }

    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
    const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;
    const outstandingPayments = salesData.reduce((sum, sale) => sum + (sale.total_amount - sale.amount_paid), 0);

    // Group by species
    const salesBySpecies: Record<string, { count: number; revenue: number }> = {};
    salesData.forEach(sale => {
      const species = (sale.animal as any)?.species || 'Unknown';
      if (!salesBySpecies[species]) {
        salesBySpecies[species] = { count: 0, revenue: 0 };
      }
      salesBySpecies[species].count++;
      salesBySpecies[species].revenue += sale.total_amount;
    });

    // Group by month
    const salesByMonth: Record<string, { count: number; revenue: number }> = {};
    salesData.forEach(sale => {
      const month = sale.sale_date.substring(0, 7); // YYYY-MM
      if (!salesByMonth[month]) {
        salesByMonth[month] = { count: 0, revenue: 0 };
      }
      salesByMonth[month].count++;
      salesByMonth[month].revenue += sale.total_amount;
    });

    return {
      totalSales,
      totalRevenue,
      averageSalePrice,
      salesBySpecies,
      salesByMonth,
      outstandingPayments
    };
  } catch (error) {
    console.error('Error calculating sales analytics:', error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageSalePrice: 0,
      salesBySpecies: {},
      salesByMonth: {},
      outstandingPayments: 0
    };
  }
};
import { supabase } from '@/integrations/supabase/client';
import type { Animal } from '@/stores/animalStore';

export interface AnimalSale {
  id: string;
  animal_id: string;
  sale_date: string;
  sale_price: number;
  buyer_name: string;
  buyer_contact?: string;
  buyer_email?: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
  payment_status: 'paid' | 'partial' | 'pending';
  sale_notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export interface SaleFormData {
  sale_date: string;
  sale_price: number;
  buyer_name: string;
  buyer_contact?: string;
  buyer_email?: string;
  payment_method: string;
  amount_paid?: number;
  sale_notes?: string;
}

export interface PaymentFormData {
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

// Declare animal sold
export const declareAnimalSold = async (animalId: string, saleData: SaleFormData): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Validate sale data
    if (!saleData.sale_date || !saleData.sale_price || !saleData.buyer_name || !saleData.payment_method) {
      throw new Error('Missing required sale information');
    }

    if (saleData.sale_price <= 0) {
      throw new Error('Sale price must be greater than 0');
    }

    const amountPaid = saleData.amount_paid || 0;
    if (amountPaid < 0 || amountPaid > saleData.sale_price) {
      throw new Error('Invalid payment amount');
    }

    // Start transaction
    const { data: saleRecord, error: saleError } = await supabase
      .from('animal_sales')
      .insert({
        animal_id: animalId,
        sale_date: saleData.sale_date,
        sale_price: saleData.sale_price,
        buyer_name: saleData.buyer_name,
        buyer_contact: saleData.buyer_contact || null,
        buyer_email: saleData.buyer_email || null,
        payment_method: saleData.payment_method,
        total_amount: saleData.sale_price,
        amount_paid: amountPaid,
        payment_status: amountPaid >= saleData.sale_price ? 'paid' : amountPaid > 0 ? 'partial' : 'pending',
        sale_notes: saleData.sale_notes || null,
        user_id: user.id
      })
      .select()
      .single();

    if (saleError || !saleRecord) {
      console.error('Error creating sale record:', saleError);
      throw new Error('Failed to create sale record');
    }

    // Update animal status and link to sale
    const { error: animalError } = await supabase
      .from('animals')
      .update({
        lifecycle_status: 'sold',
        sale_id: saleRecord.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', animalId);

    if (animalError) {
      console.error('Error updating animal status:', animalError);
      // Rollback sale record
      await supabase.from('animal_sales').delete().eq('id', saleRecord.id);
      throw new Error('Failed to update animal status');
    }

    // Add initial payment if amount was paid
    if (amountPaid > 0) {
      const { error: paymentError } = await supabase
        .from('sale_payments')
        .insert({
          sale_id: saleRecord.id,
          payment_date: saleData.sale_date,
          amount: amountPaid,
          payment_method: saleData.payment_method,
          notes: 'Initial payment',
          user_id: user.id
        });

      if (paymentError) {
        console.error('Error creating initial payment:', paymentError);
        // Continue anyway as the sale is already recorded
      }
    }

    // Record in farm ledger
    await recordSaleInLedger(saleRecord.id, saleData.sale_price, saleData.buyer_name, saleData.sale_date);

    return true;
  } catch (error) {
    console.error('Error declaring animal sold:', error);
    throw error;
  }
};

// Get sale details
export const getSaleDetails = async (saleId: string): Promise<AnimalSale | null> => {
  try {
    const { data, error } = await supabase
      .from('animal_sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (error) {
      console.error('Error fetching sale details:', error);
      return null;
    }

    return data as AnimalSale;
  } catch (error) {
    console.error('Error fetching sale details:', error);
    return null;
  }
};

// Get sales by animal
export const getAnimalSale = async (animalId: string): Promise<AnimalSale | null> => {
  try {
    const { data, error } = await supabase
      .from('animal_sales')
      .select('*')
      .eq('animal_id', animalId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      console.error('Error fetching animal sale:', error);
      return null;
    }

    return data as AnimalSale;
  } catch (error) {
    console.error('Error fetching animal sale:', error);
    return null;
  }
};

// Add payment to sale
export const addPaymentToSale = async (saleId: string, paymentData: PaymentFormData): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Validate payment data
    if (!paymentData.payment_date || !paymentData.amount || !paymentData.payment_method) {
      throw new Error('Missing required payment information');
    }

    if (paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Get current sale details
    const sale = await getSaleDetails(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    // Check if total payments would exceed sale amount
    if (sale.amount_paid + paymentData.amount > sale.total_amount) {
      throw new Error('Payment amount exceeds remaining balance');
    }

    // Add payment record
    const { error: paymentError } = await supabase
      .from('sale_payments')
      .insert({
        sale_id: saleId,
        payment_date: paymentData.payment_date,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes,
        user_id: user.id
      });

    if (paymentError) {
      console.error('Error adding payment:', paymentError);
      throw new Error('Failed to add payment');
    }

    // Record payment in farm ledger
    await recordPaymentInLedger(saleId, paymentData.amount, paymentData.payment_date);

    return true;
  } catch (error) {
    console.error('Error adding payment:', error);
    throw error;
  }
};

// Get payments for sale
export const getSalePayments = async (saleId: string): Promise<SalePayment[]> => {
  try {
    const { data, error } = await supabase
      .from('sale_payments')
      .select('*')
      .eq('sale_id', saleId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching sale payments:', error);
      return [];
    }

    return data as SalePayment[];
  } catch (error) {
    console.error('Error fetching sale payments:', error);
    return [];
  }
};

// Get all sales for user
export const getUserSales = async (dateRange?: { start: string; end: string }): Promise<AnimalSale[]> => {
  try {
    let query = supabase
      .from('animal_sales')
      .select('*')
      .order('sale_date', { ascending: false });

    if (dateRange) {
      query = query
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user sales:', error);
      return [];
    }

    return data as AnimalSale[];
  } catch (error) {
    console.error('Error fetching user sales:', error);
    return [];
  }
};

// Get sales with animal details
export const getSalesWithAnimals = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('animal_sales')
      .select(`
        *,
        animals(*)
      `)
      .order('sale_date', { ascending: false });

    if (error) {
      console.error('Error fetching sales with animals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching sales with animals:', error);
    return [];
  }
};

// Helper function to record sale in farm ledger
const recordSaleInLedger = async (saleId: string, amount: number, buyerName: string, saleDate: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('farm_ledger')
      .insert({
        transaction_type: 'sale',
        reference_id: saleId,
        reference_type: 'animal_sale',
        amount: amount,
        description: `Animal sale to ${buyerName}`,
        transaction_date: saleDate,
        user_id: user.id,
        metadata: { buyer_name: buyerName, type: 'animal_sale' }
      });
  } catch (error) {
    console.error('Error recording sale in ledger:', error);
  }
};

// Helper function to record payment in farm ledger
const recordPaymentInLedger = async (saleId: string, amount: number, paymentDate: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('farm_ledger')
      .insert({
        transaction_type: 'payment',
        reference_id: saleId,
        reference_type: 'animal_sale',
        amount: amount,
        description: `Payment received for animal sale`,
        transaction_date: paymentDate,
        user_id: user.id,
        metadata: { type: 'sale_payment' }
      });
  } catch (error) {
    console.error('Error recording payment in ledger:', error);
  }
};
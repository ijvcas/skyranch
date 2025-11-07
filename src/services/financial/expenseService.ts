import { supabase } from '@/integrations/supabase/client';
import { addLedgerEntry, type FarmLedgerEntry } from '@/services/farmLedgerService';

export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  is_default: boolean;
  user_id?: string;
}

export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data as ExpenseCategory[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const addExpenseCategory = async (
  name: string,
  type: 'income' | 'expense',
  icon?: string,
  color?: string
): Promise<ExpenseCategory | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        name,
        type,
        icon,
        color,
        user_id: user.id,
        is_default: false
      })
      .select()
      .single();

    if (error) throw error;
    return data as ExpenseCategory;
  } catch (error) {
    console.error('Error adding category:', error);
    return null;
  }
};

export const updateExpenseCategory = async (
  id: string,
  updates: Partial<ExpenseCategory>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('expense_categories')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
};

export const deleteExpenseCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

// Upload receipt to Supabase Storage
export const uploadReceipt = async (file: File): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('financial-receipts')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('financial-receipts')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return null;
  }
};

export const deleteReceipt = async (url: string): Promise<boolean> => {
  try {
    const path = url.split('/financial-receipts/')[1];
    const { error } = await supabase.storage
      .from('financial-receipts')
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return false;
  }
};

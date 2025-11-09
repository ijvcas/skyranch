import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryStore, InventoryItem, InventoryTransaction } from '@/stores/inventoryStore';
import { toast } from 'sonner';

export const useInventory = () => {
  const queryClient = useQueryClient();
  const { setItems, addItem, updateItem: updateItemStore, deleteItem: deleteItemStore, setTransactions, addTransaction } = useInventoryStore();

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      const items = (data || []) as InventoryItem[];
      setItems(items);
      return items;
    }
  });

  const { data: transactions } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      const transactions = (data || []) as InventoryTransaction[];
      setTransactions(transactions);
      return transactions;
    }
  });

  const createItemMutation = useMutation({
    mutationFn: async (newItem: Partial<InventoryItem>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{ ...newItem, user_id: user.id } as any])
        .select()
        .single();

      if (error) throw error;
      return data as InventoryItem;
    },
    onSuccess: (data) => {
      addItem(data);
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add item: ' + error.message);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as InventoryItem;
    },
    onSuccess: (data) => {
      updateItemStore(data.id, data);
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update item: ' + error.message);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      deleteItemStore(id);
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete item: ' + error.message);
    }
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transaction: Partial<InventoryTransaction>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create transaction
      const { data: txData, error: txError } = await supabase
        .from('inventory_transactions')
        .insert([{ ...transaction, created_by: user.id } as any])
        .select()
        .single();

      if (txError) throw txError;
      const txn = txData as InventoryTransaction;

      // Update item quantity
      const { data: item } = await supabase
        .from('inventory_items')
        .select('current_quantity')
        .eq('id', transaction.item_id)
        .single();

      if (item) {
        const quantityChange = transaction.transaction_type === 'purchase' ? transaction.quantity! : -transaction.quantity!;
        await supabase
          .from('inventory_items')
          .update({ current_quantity: item.current_quantity + quantityChange })
          .eq('id', transaction.item_id);
      }

      return txn;
    },
    onSuccess: (data) => {
      addTransaction(data);
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Transaction recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record transaction: ' + error.message);
    }
  });

  const recordUsage = async (itemId: string, quantity: number, notes?: string) => {
    await createTransactionMutation.mutateAsync({
      item_id: itemId,
      transaction_type: 'usage',
      quantity,
      notes
    });
  };

  const recordPurchase = async (itemId: string, quantity: number, unitCost?: number, notes?: string) => {
    await createTransactionMutation.mutateAsync({
      item_id: itemId,
      transaction_type: 'purchase',
      quantity,
      unit_cost: unitCost,
      total_cost: unitCost ? unitCost * quantity : undefined,
      notes
    });
  };

  return {
    items: items || [],
    transactions: transactions || [],
    isLoading,
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    createTransaction: createTransactionMutation.mutateAsync,
    recordUsage,
    recordPurchase,
    isCreating: createItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending
  };
};

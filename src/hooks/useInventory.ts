import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: 'feed' | 'medicine' | 'supplement' | 'equipment' | 'other';
  unit: string;
  current_quantity: number;
  min_quantity?: number;
  max_quantity?: number;
  unit_cost?: number;
  barcode?: string;
  supplier?: string;
  storage_location?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useInventory() {
  const { toast } = useToast();
  const { t } = useTranslation('inventory');
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('inventory_items')
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: t('messages.itemAdded'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(item)
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: t('messages.itemUpdated'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: t('messages.itemDeleted'),
      });
    },
  });

  return {
    items,
    isLoading,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
  };
}
import { create } from 'zustand';

export type InventoryCategory = 'feed' | 'medicine' | 'supplement' | 'equipment' | 'other';
export type TransactionType = 'purchase' | 'usage' | 'waste' | 'adjustment';

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity?: number;
  unit_cost?: number;
  supplier?: string;
  barcode?: string;
  storage_location?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: TransactionType;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface InventoryAlert {
  id: string;
  item_id: string;
  alert_type: string;
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

interface InventoryStore {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  alerts: InventoryAlert[];
  lowStockItems: InventoryItem[];
  
  setItems: (items: InventoryItem[]) => void;
  addItem: (item: InventoryItem) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  
  setTransactions: (transactions: InventoryTransaction[]) => void;
  addTransaction: (transaction: InventoryTransaction) => void;
  
  setAlerts: (alerts: InventoryAlert[]) => void;
  acknowledgeAlert: (id: string) => void;
  
  updateLowStockItems: () => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  transactions: [],
  alerts: [],
  lowStockItems: [],
  
  setItems: (items) => {
    set({ items });
    get().updateLowStockItems();
  },
  
  addItem: (item) => set((state) => ({
    items: [item, ...state.items]
  })),
  
  updateItem: (id, updates) => {
    set((state) => ({
      items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
    }));
    get().updateLowStockItems();
  },
  
  deleteItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  
  setTransactions: (transactions) => set({ transactions }),
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  })),
  
  setAlerts: (alerts) => set({ alerts }),
  
  acknowledgeAlert: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a)
  })),
  
  updateLowStockItems: () => {
    const { items } = get();
    const lowStock = items.filter(item => item.current_quantity <= item.min_quantity);
    set({ lowStockItems: lowStock });
  }
}));

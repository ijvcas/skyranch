export type SubscriptionTier = 'free' | 'pro' | 'team';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  apple_transaction_id?: string;
  apple_original_transaction_id?: string;
  expires_at?: string;
  trial_ends_at?: string;
  auto_renew_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  id: string;
  user_id: string;
  animals_count: number;
  users_count: number;
  last_updated: string;
}

export interface SubscriptionLimits {
  maxAnimals: number;
  maxUsers: number;
  features: string[];
}

export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxAnimals: 10,
    maxUsers: 2,
    features: ['basic_animals', 'basic_health', 'basic_breeding', 'sales']
  },
  pro: {
    maxAnimals: 25,
    maxUsers: 5,
    features: [
      'basic_animals', 'basic_health', 'basic_breeding', 'sales',
      'calendar_sync', 'ai_chat_basic', 'auto_backup', 'production_tracking', 'financial_reports'
    ]
  },
  team: {
    maxAnimals: Infinity,
    maxUsers: Infinity,
    features: [
      'basic_animals', 'basic_health', 'basic_breeding', 'sales',
      'calendar_sync', 'ai_chat_advanced', 'auto_backup', 'production_tracking', 'financial_reports',
      'pedigree_analysis', 'inbreeding_calculator', 'custom_reports', 'priority_support', 'csv_export', 'pdf_export'
    ]
  }
};

export const TIER_PRICES = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 5.99, yearly: 59.99 },
  team: { monthly: 14.99, yearly: 149.99 }
};

export const IAP_PRODUCT_IDS = {
  pro_monthly: 'app.farmika.manager.pro.monthly',
  team_monthly: 'app.farmika.manager.team.monthly'
} as const;

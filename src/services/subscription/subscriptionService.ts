import { supabase } from '@/integrations/supabase/client';
import { TIER_LIMITS, type Subscription, type SubscriptionUsage, type SubscriptionTier } from './types';

export class SubscriptionService {
  
  /**
   * Get current user's subscription
   */
  static async getSubscription(): Promise<Subscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data as Subscription;
  }

  /**
   * Get current user's usage statistics
   */
  static async getUsage(): Promise<SubscriptionUsage | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching usage:', error);
      return null;
    }

    return data;
  }

  /**
   * Update usage counts
   */
  static async updateUsage(animalsCount?: number, usersCount?: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updates: any = { last_updated: new Date().toISOString() };
    if (animalsCount !== undefined) updates.animals_count = animalsCount;
    if (usersCount !== undefined) updates.users_count = usersCount;

    const { error } = await supabase
      .from('subscription_usage')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating usage:', error);
      return false;
    }

    return true;
  }

  /**
   * Check if user can add more animals
   */
  static async canAddAnimal(): Promise<{ allowed: boolean; message?: string; currentCount?: number; limit?: number }> {
    const subscription = await this.getSubscription();
    const usage = await this.getUsage();

    if (!subscription || !usage) {
      return { allowed: false, message: 'No se pudo verificar la suscripción' };
    }

    const limits = TIER_LIMITS[subscription.tier];
    const currentCount = usage.animals_count;

    if (currentCount >= limits.maxAnimals) {
      return {
        allowed: false,
        message: `Has alcanzado el límite de ${limits.maxAnimals} animales para el plan ${subscription.tier.toUpperCase()}`,
        currentCount,
        limit: limits.maxAnimals
      };
    }

    return { allowed: true, currentCount, limit: limits.maxAnimals };
  }

  /**
   * Check if user can add more users
   */
  static async canAddUser(): Promise<{ allowed: boolean; message?: string; currentCount?: number; limit?: number }> {
    const subscription = await this.getSubscription();
    const usage = await this.getUsage();

    if (!subscription || !usage) {
      return { allowed: false, message: 'No se pudo verificar la suscripción' };
    }

    const limits = TIER_LIMITS[subscription.tier];
    const currentCount = usage.users_count;

    if (currentCount >= limits.maxUsers) {
      return {
        allowed: false,
        message: `Has alcanzado el límite de ${limits.maxUsers} usuarios para el plan ${subscription.tier.toUpperCase()}`,
        currentCount,
        limit: limits.maxUsers
      };
    }

    return { allowed: true, currentCount, limit: limits.maxUsers };
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(feature: string): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (!subscription) return false;

    const limits = TIER_LIMITS[subscription.tier];
    return limits.features.includes(feature);
  }

  /**
   * Get tier name in Spanish
   */
  static getTierName(tier: SubscriptionTier): string {
    const names = {
      free: 'Gratis',
      pro: 'Pro',
      team: 'Equipo'
    };
    return names[tier];
  }

  /**
   * Check if subscription is active (not expired)
   */
  static isSubscriptionActive(subscription: Subscription): boolean {
    if (subscription.tier === 'free') return true;
    if (subscription.status !== 'active') return false;
    if (!subscription.expires_at) return true;
    
    const expiresAt = new Date(subscription.expires_at);
    return expiresAt > new Date();
  }
}

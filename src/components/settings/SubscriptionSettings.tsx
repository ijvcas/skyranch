import { useState, useEffect } from 'react';
import { SubscriptionService, type Subscription, type SubscriptionUsage } from '@/services/subscription';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import UsageMeter from '@/components/subscription/UsageMeter';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SubscriptionSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation('settings');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sub, use] = await Promise.all([
        SubscriptionService.getSubscription(),
        SubscriptionService.getUsage()
      ]);
      setSubscription(sub);
      setUsage(use);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscription || !usage) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">{t('messages.error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <SubscriptionCard subscription={subscription} />
        <UsageMeter usage={usage} tier={subscription.tier} />
      </div>

      {subscription.tier === 'free' && (
        <div className="bg-accent/50 border border-primary/20 rounded-lg p-6 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">{t('subscription.upgrade')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('subscription.limits')}
          </p>
          <Button onClick={() => navigate('/pricing')} size="lg">
            {t('subscription.upgrade')}
          </Button>
        </div>
      )}
    </div>
  );
}

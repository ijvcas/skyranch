import { useState, useEffect } from 'react';
import { SubscriptionService, type Subscription, type SubscriptionUsage } from '@/services/subscription';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import UsageMeter from '@/components/subscription/UsageMeter';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SubscriptionSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('settings');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sub, use, owner] = await Promise.all([
        SubscriptionService.getSubscription(),
        SubscriptionService.getUsage(),
        SubscriptionService.isOwner()
      ]);
      setSubscription(sub);
      setUsage(use);
      setIsOwner(owner);
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
        <>
          {!isOwner && (
            <Alert>
              <Lock className="w-4 h-4" />
              <AlertDescription>
                {t('subscription.onlyOwnerCanUpgrade')}
              </AlertDescription>
            </Alert>
          )}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20 p-6">
            <div className="flex items-start gap-4">
              <Crown className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{t('subscription.upgradePro')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('subscription.upgradeDescription')}
                </p>
                <Button 
                  onClick={() => navigate('/pricing')} 
                  disabled={!isOwner}
                  className="gap-2"
                >
                  <Crown className="w-4 h-4" />
                  {t('subscription.viewPlans')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

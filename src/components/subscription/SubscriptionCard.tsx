import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import { SubscriptionService, type Subscription, TIER_PRICES } from '@/services/subscription';
import { IAPService } from '@/services/subscription/iapService';
import { format } from 'date-fns';
import { es, enUS, ptBR, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface SubscriptionCardProps {
  subscription: Subscription;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { t, i18n } = useTranslation('settings');
  const tierName = SubscriptionService.getTierName(subscription.tier);
  const price = TIER_PRICES[subscription.tier].monthly;
  const isActive = SubscriptionService.isSubscriptionActive(subscription);
  
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'pt': return ptBR;
      case 'fr': return fr;
      default: return es;
    }
  };
  
  const handleManageSubscription = async () => {
    await IAPService.manageSubscriptions();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {subscription.tier !== 'free' && <Crown className="h-5 w-5 text-primary" />}
            <CardTitle>{t('subscription.plan')} {tierName}</CardTitle>
          </div>
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? t('subscription.active') : t('subscription.expired')}
          </Badge>
        </div>
        <CardDescription>
          {subscription.tier === 'free' 
            ? t('subscription.freeDescription')
            : `€${price}/mes`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.tier !== 'free' && (
          <>
            {subscription.expires_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {t('subscription.renewal')}: {format(new Date(subscription.expires_at), 'dd MMM yyyy', { locale: getDateLocale() })}
                </span>
              </div>
            )}
            
            {subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date() && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {t('subscription.trialEnds')}: {format(new Date(subscription.trial_ends_at), 'dd MMM yyyy', { locale: getDateLocale() })}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t('subscription.autoRenewal')}: {subscription.auto_renew_status ? t('subscription.enabled') : t('subscription.disabled')}</span>
            </div>

            <Button onClick={handleManageSubscription} variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('subscription.manage')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

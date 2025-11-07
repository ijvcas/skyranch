import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import { SubscriptionService, type Subscription, TIER_PRICES } from '@/services/subscription';
import { IAPService } from '@/services/subscription/iapService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionCardProps {
  subscription: Subscription;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const tierName = SubscriptionService.getTierName(subscription.tier);
  const price = TIER_PRICES[subscription.tier].monthly;
  const isActive = SubscriptionService.isSubscriptionActive(subscription);
  
  const handleManageSubscription = async () => {
    await IAPService.manageSubscriptions();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {subscription.tier !== 'free' && <Crown className="h-5 w-5 text-primary" />}
            <CardTitle>Plan {tierName}</CardTitle>
          </div>
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? 'Activo' : 'Expirado'}
          </Badge>
        </div>
        <CardDescription>
          {subscription.tier === 'free' 
            ? 'Plan gratuito básico'
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
                  Renovación: {format(new Date(subscription.expires_at), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
            )}
            
            {subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date() && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Prueba termina: {format(new Date(subscription.trial_ends_at), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Auto-renovación: {subscription.auto_renew_status ? 'Activada' : 'Desactivada'}</span>
            </div>

            <Button onClick={handleManageSubscription} variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Gestionar Suscripción
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

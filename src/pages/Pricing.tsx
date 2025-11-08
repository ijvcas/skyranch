import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Crown, ArrowLeft } from 'lucide-react';
import { SubscriptionService, IAPService, TIER_PRICES, IAP_PRODUCT_IDS, type Subscription } from '@/services/subscription';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Pricing() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation('pricing');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    const sub = await SubscriptionService.getSubscription();
    setSubscription(sub);
  };

  const handlePurchase = async (productId: string) => {
    setPurchasing(true);
    try {
      const result = await IAPService.purchaseProduct(productId);
      
      if (result.success) {
        toast({
          title: '¡Suscripción activada!',
          description: 'Ya puedes disfrutar de todas las funciones premium.',
        });
        await loadSubscription();
        navigate('/settings?tab=subscription');
      } else {
        toast({
          title: 'Error al procesar la compra',
          description: result.error || 'Inténtalo de nuevo más tarde',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar la compra',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const currentTier = subscription?.tier || 'free';

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common:back', { defaultValue: 'Back' })}
        </Button>
      </div>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="border rounded-lg p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-xl">{t('free.name')}</h3>
            <p className="text-3xl font-bold mt-2">{t('free.price')}<span className="text-base font-normal text-muted-foreground">{t('free.perMonth')}</span></p>
          </div>
          
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('free.users')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('free.animals')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('free.basicRecords')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('free.healthTracking')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('free.reproductionControl')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('free.salesRegistry')}</span>
            </li>
          </ul>

          <Button variant="outline" className="w-full" disabled={currentTier === 'free'}>
            {currentTier === 'free' ? t('free.currentPlan') : t('free.freePlan')}
          </Button>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-primary rounded-lg p-6 space-y-6 relative">
          <div className="absolute -top-3 right-4">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
              {t('pro.trial')}
            </span>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-xl">{t('pro.name')}</h3>
            </div>
            <p className="text-3xl font-bold mt-2">
              €{TIER_PRICES.pro.monthly}<span className="text-base font-normal text-muted-foreground">{t('free.perMonth')}</span>
            </p>
          </div>
          
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span><strong>{t('pro.users')}</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span><strong>{t('pro.animals')}</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('pro.allFree')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('pro.calendarSync')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('pro.aiChat')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('pro.autoBackup')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('pro.productionTracking')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('pro.financialReports')}</span>
            </li>
          </ul>

          <Button 
            onClick={() => handlePurchase(IAP_PRODUCT_IDS.pro_monthly)}
            disabled={purchasing || currentTier === 'pro'}
            className="w-full"
          >
            {currentTier === 'pro' ? t('free.currentPlan') : purchasing ? t('pro.processing') : t('pro.subscribe')}
          </Button>
        </div>

        {/* Team Plan */}
        <div className="border rounded-lg p-6 space-y-6 bg-accent/20">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-xl">{t('team.name')}</h3>
            </div>
            <p className="text-3xl font-bold mt-2">
              €{TIER_PRICES.team.monthly}<span className="text-base font-normal text-muted-foreground">{t('free.perMonth')}</span>
            </p>
          </div>
          
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span><strong>{t('team.users')}</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span><strong>{t('team.animals')}</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('team.allPro')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('team.advancedAI')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('team.pedigreeAnalysis')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('team.inbreedingCalc')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('team.customReports')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('team.exportCSV')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('team.prioritySupport')}</span>
            </li>
          </ul>

          <Button 
            onClick={() => handlePurchase(IAP_PRODUCT_IDS.team_monthly)}
            disabled={purchasing || currentTier === 'team'}
            className="w-full"
            variant="default"
          >
            {currentTier === 'team' ? t('free.currentPlan') : purchasing ? t('pro.processing') : t('team.subscribe')}
          </Button>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>{t('footer.billingInfo')}</p>
        <p className="mt-2">{t('footer.appStoreInfo')}</p>
      </div>
    </div>
  );
}

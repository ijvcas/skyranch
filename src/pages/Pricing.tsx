import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Crown } from 'lucide-react';
import { SubscriptionService, IAPService, TIER_PRICES, IAP_PRODUCT_IDS, type Subscription } from '@/services/subscription';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Elige tu Plan</h1>
        <p className="text-xl text-muted-foreground">
          Escala tu operación con las herramientas que necesitas
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="border rounded-lg p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-xl">Gratis</h3>
            <p className="text-3xl font-bold mt-2">€0<span className="text-base font-normal text-muted-foreground">/mes</span></p>
          </div>
          
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>2 usuarios</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>10 animales</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Registros básicos</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Seguimiento de salud</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Control de reproducción</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Registro de ventas</span>
            </li>
          </ul>

          <Button variant="outline" className="w-full" disabled={currentTier === 'free'}>
            {currentTier === 'free' ? 'Plan Actual' : 'Plan Gratis'}
          </Button>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-primary rounded-lg p-6 space-y-6 relative">
          <div className="absolute -top-3 right-4">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
              14 días gratis
            </span>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-xl">Pro</h3>
            </div>
            <p className="text-3xl font-bold mt-2">
              €{TIER_PRICES.pro.monthly}<span className="text-base font-normal text-muted-foreground">/mes</span>
            </p>
          </div>
          
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span><strong>5 usuarios</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span><strong>25 animales</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Todo de Gratis +</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Sincronización de calendario iOS</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Chat AI básico</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Respaldo automático</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Seguimiento de producción</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Reportes financieros</span>
            </li>
          </ul>

          <Button 
            onClick={() => handlePurchase(IAP_PRODUCT_IDS.pro_monthly)}
            disabled={purchasing || currentTier === 'pro'}
            className="w-full"
          >
            {currentTier === 'pro' ? 'Plan Actual' : purchasing ? 'Procesando...' : 'Suscribirse a Pro'}
          </Button>
        </div>

        {/* Team Plan */}
        <div className="border rounded-lg p-6 space-y-6 bg-accent/20">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-xl">Equipo</h3>
            </div>
            <p className="text-3xl font-bold mt-2">
              €{TIER_PRICES.team.monthly}<span className="text-base font-normal text-muted-foreground">/mes</span>
            </p>
          </div>
          
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span><strong>Usuarios ilimitados</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span><strong>Animales ilimitados</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Todo de Pro +</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Chat AI avanzado</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Análisis de pedigree (5 gen)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Calculadora de consanguinidad</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Reportes personalizados</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Exportar CSV/PDF</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Soporte prioritario</span>
            </li>
          </ul>

          <Button 
            onClick={() => handlePurchase(IAP_PRODUCT_IDS.team_monthly)}
            disabled={purchasing || currentTier === 'team'}
            className="w-full"
            variant="default"
          >
            {currentTier === 'team' ? 'Plan Actual' : purchasing ? 'Procesando...' : 'Suscribirse a Equipo'}
          </Button>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Todos los planes se facturan mensualmente. Cancela en cualquier momento.</p>
        <p className="mt-2">Las compras se procesan a través de App Store de Apple.</p>
      </div>
    </div>
  );
}

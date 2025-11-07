import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check } from 'lucide-react';
import { IAPService } from '@/services/subscription/iapService';
import { IAP_PRODUCT_IDS, TIER_PRICES } from '@/services/subscription';
import { useToast } from '@/hooks/use-toast';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
  suggestedTier?: 'pro' | 'team';
}

export default function UpgradeDialog({ open, onOpenChange, reason, suggestedTier = 'pro' }: UpgradeDialogProps) {
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (productId: string) => {
    setPurchasing(true);
    try {
      const result = await IAPService.purchaseProduct(productId);
      
      if (result.success) {
        toast({
          title: '¡Suscripción activada!',
          description: 'Ya puedes disfrutar de todas las funciones premium.',
        });
        onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Actualiza tu Plan
          </DialogTitle>
          <DialogDescription>
            {reason || 'Desbloquea más funciones y aumenta tus límites'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Pro Plan */}
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Plan Pro</h3>
              <p className="text-2xl font-bold mt-2">€{TIER_PRICES.pro.monthly}/mes</p>
            </div>
            
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>5 usuarios</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>25 animales</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Sincronización de calendario</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Chat AI básico</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Respaldo automático</span>
              </li>
            </ul>

            <Button 
              onClick={() => handlePurchase(IAP_PRODUCT_IDS.pro_monthly)}
              disabled={purchasing}
              className="w-full"
              variant={suggestedTier === 'pro' ? 'default' : 'outline'}
            >
              {purchasing ? 'Procesando...' : 'Suscribirse a Pro'}
            </Button>
          </div>

          {/* Team Plan */}
          <div className="border-2 border-primary rounded-lg p-6 space-y-4 relative">
            <div className="absolute -top-3 right-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                Más popular
              </span>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">Plan Equipo</h3>
              <p className="text-2xl font-bold mt-2">€{TIER_PRICES.team.monthly}/mes</p>
            </div>
            
            <ul className="space-y-2 text-sm">
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
                <span>Análisis de pedigree</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Calculadora de consanguinidad</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Soporte prioritario</span>
              </li>
            </ul>

            <Button 
              onClick={() => handlePurchase(IAP_PRODUCT_IDS.team_monthly)}
              disabled={purchasing}
              className="w-full"
              variant={suggestedTier === 'team' ? 'default' : 'outline'}
            >
              {purchasing ? 'Procesando...' : 'Suscribirse a Equipo'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          14 días de prueba gratis en Plan Pro. Cancela cuando quieras.
        </p>
      </DialogContent>
    </Dialog>
  );
}

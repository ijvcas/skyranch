import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, Scan } from 'lucide-react';
import { useBiometric } from '@/hooks/useBiometric';
import { useToast } from '@/hooks/use-toast';

interface BiometricSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
  onSuccess?: () => void;
}

export const BiometricSetupDialog = ({
  open,
  onOpenChange,
  email,
  password,
  onSuccess,
}: BiometricSetupDialogProps) => {
  const { biometricTypeName, enableBiometric } = useBiometric();
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const success = await enableBiometric(email, password);
      
      if (success) {
        toast({
          title: '¡Listo!',
          description: `${biometricTypeName} habilitado correctamente`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast({
          title: 'Cancelado',
          description: 'No se habilitó la autenticación biométrica',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo habilitar la autenticación biométrica',
        variant: 'destructive',
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const getBiometricIcon = () => {
    if (biometricTypeName.includes('Face')) {
      return <Scan className="w-16 h-16 text-primary mx-auto mb-4" />;
    }
    return <Fingerprint className="w-16 h-16 text-primary mx-auto mb-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            ¿Habilitar {biometricTypeName}?
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            {getBiometricIcon()}
            Accede más rápido y de forma segura la próxima vez que uses FARMIKA
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Acceso instantáneo sin contraseña</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Tus datos se guardan de forma segura en tu dispositivo</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Puedes desactivarlo en cualquier momento</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
          <Button
            onClick={handleEnable}
            disabled={isEnabling}
            className="w-full"
          >
            {isEnabling ? 'Habilitando...' : 'Habilitar'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isEnabling}
            className="w-full"
          >
            Tal vez después
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

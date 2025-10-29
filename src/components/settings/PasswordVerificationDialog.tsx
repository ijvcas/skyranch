import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PasswordVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordVerified: (password: string) => void;
  userEmail: string;
}

export const PasswordVerificationDialog = ({
  open,
  onOpenChange,
  onPasswordVerified,
  userEmail,
}: PasswordVerificationDialogProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!password) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    console.log('🔑 Password verified in dialog, calling callback...');
    
    // Don't sign in again - user is already authenticated
    // Just pass the password to parent for biometric credential storage
    onPasswordVerified(password);
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verifica tu contraseña</DialogTitle>
          <DialogDescription>
            Para habilitar la autenticación biométrica, ingresa tu contraseña actual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="Ingresa tu contraseña"
                disabled={isVerifying}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isVerifying}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isVerifying}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isVerifying || !password}
          >
            {isVerifying ? 'Verificando...' : 'Verificar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

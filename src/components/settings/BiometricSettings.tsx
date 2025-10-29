import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Fingerprint, Scan, Shield, AlertCircle } from 'lucide-react';
import { useBiometric } from '@/hooks/useBiometric';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordVerificationDialog } from './PasswordVerificationDialog';

export const BiometricSettings = () => {
  const {
    isAvailable,
    biometricType,
    biometricTypeName,
    isEnabled,
    loading,
    enableBiometric,
    disableBiometric,
    testBiometric,
    refresh,
  } = useBiometric();
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDisabling, setIsDisabling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      // Disable biometric
      setIsDisabling(true);
      try {
        await disableBiometric();
        toast({
          title: 'Deshabilitado',
          description: 'La autenticación biométrica ha sido desactivada',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo desactivar la autenticación biométrica',
          variant: 'destructive',
        });
      } finally {
        setIsDisabling(false);
      }
    } else {
      // Enable biometric - open password dialog
      setShowPasswordDialog(true);
    }
  };

  const handlePasswordVerified = async (password: string) => {
    const email = user?.email;
    if (!email) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener el email del usuario',
        variant: 'destructive',
      });
      throw new Error('No user email');
    }

    setIsDisabling(true);
    try {
      console.log('🔐 [BiometricSettings] Starting biometric enablement...');
      const success = await enableBiometric(email, password);
      
      if (success) {
        console.log('✅ [BiometricSettings] Enable successful!');
        
        toast({
          title: "Biométrico activado",
          description: `${biometricTypeName} configurado correctamente`,
        });
        
        setShowPasswordDialog(false);
        
        // Single refresh with small delay to allow native storage to settle
        setTimeout(async () => {
          console.log('🔄 [BiometricSettings] Refreshing status...');
          await refresh();
        }, 800);
      } else {
        console.log('❌ [BiometricSettings] Enable failed or cancelled');
        toast({
          title: 'Cancelado',
          description: 'La autenticación biométrica fue cancelada',
        });
        throw new Error('Biometric enable cancelled');
      }
    } catch (error) {
      console.error('❌ [BiometricSettings] Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo habilitar la autenticación biométrica',
        variant: 'destructive',
      });
      throw error; // Re-throw to trigger dialog error handling
    } finally {
      setIsDisabling(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const success = await testBiometric();
      if (success) {
        toast({
          title: '¡Éxito!',
          description: 'La autenticación biométrica funciona correctamente',
        });
      } else {
        toast({
          title: 'Cancelado',
          description: 'La autenticación fue cancelada',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'La prueba de autenticación falló',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getBiometricIcon = () => {
    if (biometricType.includes('face') || biometricType.includes('Face')) {
      return <Scan className="w-6 h-6" />;
    }
    return <Fingerprint className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Autenticación Biométrica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Autenticación Biométrica
          </CardTitle>
          <CardDescription>
            Acceso rápido y seguro con tu huella digital o Face ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              La autenticación biométrica no está disponible en este dispositivo.
              {biometricType === 'none' && (
                <span className="block mt-2">
                  Asegúrate de tener configurado Face ID, Touch ID o huella digital en la configuración de tu dispositivo.
                </span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Autenticación Biométrica
        </CardTitle>
        <CardDescription>
          Acceso rápido y seguro con {biometricTypeName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {getBiometricIcon()}
            <div>
              <p className="font-medium">Estado</p>
              <p className="text-sm text-muted-foreground">
                {biometricTypeName} {isEnabled ? 'habilitado' : 'disponible'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEnabled && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Activo
              </span>
            )}
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="biometric-toggle">
              Habilitar {biometricTypeName}
            </Label>
            <p className="text-sm text-muted-foreground">
              Usa {biometricTypeName} para iniciar sesión
            </p>
          </div>
          <Switch
            id="biometric-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isDisabling}
          />
        </div>

        {/* Test Button */}
        {isEnabled && (
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? 'Probando...' : `Probar ${biometricTypeName}`}
          </Button>
        )}

        {/* Security Info */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Información de Seguridad</p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Tus credenciales se almacenan de forma segura en el llavero de tu dispositivo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Los datos biométricos nunca salen de tu dispositivo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Puedes desactivar esta función en cualquier momento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Si cambias tu contraseña, deberás reactivar la autenticación biométrica</span>
            </li>
          </ul>
        </div>
      </CardContent>

      <PasswordVerificationDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onPasswordVerified={handlePasswordVerified}
        userEmail={user?.email || ''}
      />
    </Card>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasValidTokens, setHasValidTokens] = useState(false);
  const [isProcessingTokens, setIsProcessingTokens] = useState(true);

  useEffect(() => {
    const handlePasswordRecovery = async () => {
      console.log('🔍 Checking for password recovery tokens...');
      
      // Check for recovery tokens in URL
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      console.log('🔑 Recovery tokens found:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
        type 
      });
      
      if (!accessToken || !refreshToken || type !== 'recovery') {
        console.log('❌ Invalid or missing recovery tokens');
        toast({
          title: "Link Inválido",
          description: "Este link de reset no es válido o ha expirado. Por favor, solicita un nuevo reset de contraseña.",
          variant: "destructive"
        });
        setIsProcessingTokens(false);
        setTimeout(() => navigate('/forgot-password'), 3000);
        return;
      }

      try {
        console.log('🔄 Setting session for password recovery...');
        
        // Set the session with recovery tokens
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError || !sessionData.session) {
          console.error('❌ Failed to set recovery session:', sessionError);
          throw new Error('No se pudo establecer la sesión de recuperación');
        }
        
        console.log('✅ Recovery session established successfully');
        setHasValidTokens(true);
        setIsProcessingTokens(false);
        
        toast({
          title: "Link Válido",
          description: "Ahora puedes cambiar tu contraseña.",
        });
        
      } catch (error) {
        console.error('❌ Error setting recovery session:', error);
        toast({
          title: "Error de Sesión",
          description: "Error al procesar el link de reset. Por favor, solicita un nuevo link.",
          variant: "destructive"
        });
        setIsProcessingTokens(false);
        setTimeout(() => navigate('/forgot-password'), 3000);
      }
    };

    handlePasswordRecovery();
  }, [searchParams, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "Las contraseñas ingresadas no son iguales.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔑 Updating password...');
      
      const { error } = await updatePassword(password);
      
      if (error) {
        console.error('❌ Password update error:', error);
        toast({
          title: "Error",
          description: `Error al actualizar contraseña: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Password updated successfully');
        
        // Sign out to clear the recovery session
        await supabase.auth.signOut();
        
        toast({
          title: "¡Contraseña Actualizada!",
          description: "Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión.",
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Password update error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al actualizar contraseña.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProcessingTokens) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="text-center p-6">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Procesando link de reset...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasValidTokens) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="text-center p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Link Inválido</h3>
            <p className="text-gray-600 mb-4">
              Este link de reset no es válido o ha expirado.
            </p>
            <Button 
              onClick={() => navigate('/forgot-password')}
              className="bg-green-600 hover:bg-green-700"
            >
              Solicitar Nuevo Reset
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Cambiar Contraseña
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Ingresa tu nueva contraseña
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password" className="text-base font-medium">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="mt-2 h-12 text-base"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword" className="text-base font-medium">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="mt-2 h-12 text-base"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold mt-8"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Actualizando...
                </div>
              ) : (
                "Actualizar Contraseña"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Link válido confirmado</p>
                <p>Tu sesión de reset está activa. Cambia tu contraseña y podrás hacer login normalmente.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;


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
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [recoveryMethod, setRecoveryMethod] = useState<'otp' | 'session' | null>(null);

  useEffect(() => {
    const handlePasswordRecovery = async () => {
      console.log('🔍 [RESET PASSWORD] Starting token processing...');
      
      // Log all URL parameters for debugging
      const allParams = {};
      for (const [key, value] of searchParams.entries()) {
        allParams[key] = value;
      }
      console.log('🔍 [RESET PASSWORD] All URL parameters:', allParams);
      
      // Check for new recovery format (token_hash + type)
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      // Check for legacy format (access_token + refresh_token)
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      console.log('🔑 [RESET PASSWORD] Token analysis:', { 
        hasTokenHash: !!tokenHash,
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
        type,
        tokenHashLength: tokenHash?.length,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length,
        fullURL: window.location.href
      });
      
      setTokenInfo({
        tokenHash: tokenHash ? `${tokenHash.substring(0, 20)}...` : null,
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
        type,
        urlLength: window.location.href.length,
        method: tokenHash ? 'OTP (token_hash)' : accessToken ? 'Session (access_token)' : 'Unknown'
      });

      try {
        // Handle new OTP-based recovery (recommended approach)
        if (tokenHash && type === 'recovery') {
          console.log('🔄 [RESET PASSWORD] Using OTP recovery method with token_hash');
          setRecoveryMethod('otp');
          
          // Verify the OTP token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          });
          
          console.log('🔄 [RESET PASSWORD] OTP verification result:', {
            hasSession: !!data.session,
            hasUser: !!data.user,
            userEmail: data.user?.email,
            error: error?.message
          });
          
          if (error) {
            console.error('❌ [RESET PASSWORD] OTP verification error:', error);
            throw new Error(`OTP verification failed: ${error.message}`);
          }
          
          if (!data.session || !data.user) {
            console.error('❌ [RESET PASSWORD] No session or user from OTP verification');
            throw new Error('Invalid recovery token - no session established');
          }
          
          console.log('✅ [RESET PASSWORD] OTP verification successful');
          console.log('✅ [RESET PASSWORD] Recovery session established for:', data.user.email);
          
          setHasValidTokens(true);
          setIsProcessingTokens(false);
          
          toast({
            title: "Link Válido",
            description: "Token de recuperación verificado. Ahora puedes cambiar tu contraseña.",
          });
          
          return;
        }
        
        // Handle legacy session-based recovery (fallback)
        if (accessToken && refreshToken) {
          console.log('🔄 [RESET PASSWORD] Using legacy session recovery method');
          setRecoveryMethod('session');
          
          // Validate token format
          if (accessToken.length < 20 || refreshToken.length < 20) {
            console.log('❌ [RESET PASSWORD] Tokens appear to be too short');
            throw new Error('Tokens appear to be invalid (too short)');
          }
          
          // Set the session with recovery tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          console.log('🔄 [RESET PASSWORD] Session establishment result:', {
            hasSession: !!sessionData.session,
            hasUser: !!sessionData.session?.user,
            userEmail: sessionData.session?.user?.email,
            sessionError: sessionError?.message
          });
          
          if (sessionError) {
            console.error('❌ [RESET PASSWORD] Session error:', sessionError);
            throw new Error(`Failed to establish recovery session: ${sessionError.message}`);
          }
          
          if (!sessionData.session) {
            console.error('❌ [RESET PASSWORD] No session data returned');
            throw new Error('No session data returned from Supabase');
          }
          
          console.log('✅ [RESET PASSWORD] Legacy recovery session established successfully');
          console.log('✅ [RESET PASSWORD] User authenticated:', sessionData.session.user.email);
          
          setHasValidTokens(true);
          setIsProcessingTokens(false);
          
          toast({
            title: "Link Válido",
            description: "Sesión de recuperación establecida. Ahora puedes cambiar tu contraseña.",
          });
          
          return;
        }
        
        // No valid tokens found
        console.log('❌ [RESET PASSWORD] No valid recovery tokens found');
        console.log('❌ [RESET PASSWORD] Expected: token_hash + type=recovery OR access_token + refresh_token');
        console.log('❌ [RESET PASSWORD] Received:', { 
          tokenHash: !!tokenHash, 
          type, 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken 
        });
        
        throw new Error('No valid recovery tokens found in URL');
        
      } catch (error) {
        console.error('❌ [RESET PASSWORD] Recovery processing failed:', {
          errorMessage: error.message,
          errorName: error.name,
          tokenHash: !!tokenHash,
          type,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          urlParams: Object.fromEntries(searchParams.entries())
        });
        
        toast({
          title: "Link Inválido",
          description: `Error al procesar el link de reset: ${error.message}`,
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
      console.log('🔑 [RESET PASSWORD] Updating password using method:', recoveryMethod);
      
      const { error } = await updatePassword(password);
      
      if (error) {
        console.error('❌ [RESET PASSWORD] Password update error:', error);
        toast({
          title: "Error",
          description: `Error al actualizar contraseña: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log('✅ [RESET PASSWORD] Password updated successfully');
        
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
      console.error('❌ [RESET PASSWORD] Password update error:', error);
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
            <p className="text-gray-600 mb-2">Procesando link de reset...</p>
            {tokenInfo && (
              <div className="text-xs text-gray-500 text-left bg-gray-50 p-2 rounded">
                <p>🔍 Token Analysis:</p>
                <p>Method: {tokenInfo.method}</p>
                <p>Token Hash: {tokenInfo.tokenHash || 'Not present'}</p>
                <p>Access Token: {tokenInfo.accessToken || 'Not present'}</p>
                <p>Type: {tokenInfo.type || 'Not specified'}</p>
                <p>URL Length: {tokenInfo.urlLength}</p>
              </div>
            )}
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
            
            {tokenInfo && (
              <div className="text-xs text-gray-500 text-left bg-red-50 p-2 rounded mb-4">
                <p>🔍 Token Debug Info:</p>
                <p>Method: {tokenInfo.method}</p>
                <p>Token Hash: {tokenInfo.tokenHash || 'Missing'}</p>
                <p>Access Token: {tokenInfo.accessToken || 'Missing'}</p>
                <p>Refresh Token: {tokenInfo.refreshToken || 'Missing'}</p>
                <p>Type: {tokenInfo.type || 'Not specified'}</p>
              </div>
            )}
            
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
                <p>Token de recuperación verificado usando método: <strong>{recoveryMethod === 'otp' ? 'OTP (Recomendado)' : 'Session (Legacy)'}</strong></p>
              </div>
            </div>
          </div>
          
          {tokenInfo && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-2">🔍 Recovery Debug Info:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>✅ Method: {tokenInfo.method}</p>
                {tokenInfo.tokenHash && <p>✅ Token Hash: Present ({tokenInfo.tokenHash})</p>}
                {tokenInfo.accessToken && <p>✅ Access Token: Present ({tokenInfo.accessToken})</p>}
                <p>✅ Type: {tokenInfo.type || 'recovery'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

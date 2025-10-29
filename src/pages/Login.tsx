
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, AlertCircle, Eye, EyeOff, Fingerprint, Scan } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVersionManager } from '@/services/version-management';
import { useBiometric } from '@/hooks/useBiometric';
import { BiometricSetupDialog } from '@/components/BiometricSetupDialog';
import { cn } from '@/lib/utils';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signInWithBiometric, user, loading } = useAuth();
  const { isAvailable, biometricType, biometricTypeName, isEnabled, refresh } = useBiometric();
  
  // Force refresh biometric status when Login page mounts
  useEffect(() => {
    refresh();
  }, [refresh]);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricSubmitting, setIsBiometricSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{ version: string; buildNumber: number; releaseDate?: string } | null>(null);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [lastLoginCredentials, setLastLoginCredentials] = useState<{ email: string; password: string } | null>(null);

  // Load version info
  useEffect(() => {
    const loadVersion = async () => {
      try {
        const currentVersion = await unifiedVersionManager.getCurrentVersion();
        if (currentVersion) {
          setVersionInfo({
            version: currentVersion.version,
            buildNumber: currentVersion.buildNumber,
            releaseDate: currentVersion.releaseDate
          });
        }
      } catch (error) {
        console.error('Error loading version info:', error);
      }
    };
    
    loadVersion();
  }, []);

  // Load saved email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('skyranch-remember-email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberEmail(true);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log('✅ User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleBiometricLogin = async () => {
    // If not enabled, try to enable it (if user is logged in)
    if (!isEnabled) {
      if (!user) {
        toast({
          title: "Inicia sesión primero",
          description: "Debes iniciar sesión con tu contraseña primero para configurar Face ID",
        });
        return;
      }
      
      // Enable biometric with current session
      setIsBiometricSubmitting(true);
      try {
        const { BiometricService } = await import('@/services/biometricService');
        const authenticated = await BiometricService.authenticate(
          "Habilitar Face ID para iniciar sesión"
        );
        
        if (authenticated && user.email && lastLoginCredentials?.password) {
          await BiometricService.saveCredentials(user.email, lastLoginCredentials.password);
          await refresh();
          toast({
            title: "¡Face ID activado!",
            description: "Ahora puedes iniciar sesión con Face ID",
          });
        }
      } catch (error) {
        console.error('❌ Enable biometric error:', error);
        toast({
          title: "Error",
          description: "No se pudo activar Face ID",
          variant: "destructive",
        });
      } finally {
        setIsBiometricSubmitting(false);
      }
      return;
    }
    
    // Biometric is enabled, login with it
    setIsBiometricSubmitting(true);
    try {
      const { error } = await signInWithBiometric();
      if (error) {
        toast({
          title: "Error",
          description: "No se pudo autenticar con Face ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Biometric login error:', error);
      toast({
        title: "Error",
        description: "Error con autenticación biométrica",
        variant: "destructive",
      });
    } finally {
      setIsBiometricSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa tu email y contraseña.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔐 Attempting login for:', formData.email);
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        console.error('❌ Login error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          email: formData.email
        });
        
        let errorMessage = "Ocurrió un error inesperado. Intenta de nuevo.";
        
        if (error.message === 'Invalid login credentials') {
          errorMessage = "Email o contraseña incorrectos. Verifica tus credenciales.";
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = "Por favor confirma tu email antes de iniciar sesión.";
        } else if (error.message?.includes('network')) {
          errorMessage = "Error de conexión. Verifica tu internet.";
        }
        
        toast({
          title: "Error de inicio de sesión",
          description: errorMessage,
          variant: "destructive",
          duration: 6000
        });
      } else {
        console.log('✅ Login successful');

        // Save or remove email based on "Remember Me" checkbox
        if (rememberEmail) {
          localStorage.setItem('skyranch-remember-email', formData.email);
        } else {
          localStorage.removeItem('skyranch-remember-email');
        }

        // Store credentials for biometric setup
        setLastLoginCredentials({ email: formData.email, password: formData.password });

        // Show biometric setup dialog if available and not already enabled
        if (isAvailable && !isEnabled) {
          setTimeout(() => setShowBiometricSetup(true), 500);
        }

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });
        // Navigation will happen automatically via useEffect when user state updates
      }
    } catch (error) {
      console.error('❌ Unexpected login error:', error);
      toast({
        title: "Error",
        description: "Error inesperado. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show loading while checking authentication state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <img 
              src="/farmika-logo.png" 
              alt="FARMIKA Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
            FARMIKA
          </CardTitle>
          <p className="text-sm text-gray-600">Gestión de Finca</p>
          {versionInfo && (
            <div className="text-xs text-gray-500 mt-2">
              <p>v{versionInfo.version} • Build #{versionInfo.buildNumber}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          {/* Biometric Login Button - Always visible when available */}
          {isAvailable && (
            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isBiometricSubmitting || isSubmitting}
                className={cn(
                  "transition-all",
                  isEnabled 
                    ? "opacity-100 hover:scale-105" 
                    : "opacity-40"
                )}
              >
                {isBiometricSubmitting ? (
                  <div className="flex items-center justify-center w-12 h-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <img 
                    src="/faceid-logo.png" 
                    alt="Face ID" 
                    className="w-12 h-12"
                  />
                )}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@correo.com"
                required
                className="h-11"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  className="h-11 pr-12"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Email Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember-email"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
              />
              <Label 
                htmlFor="remember-email" 
                className="text-sm font-medium cursor-pointer select-none"
              >
                Recordar mi correo electrónico
              </Label>
            </div>

            <Button
              type="submit"
              variant="farmika"
              disabled={isSubmitting}
              className="w-full h-11 font-semibold mt-6"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/forgot-password')}
              className="text-gray-600 hover:text-green-600 text-sm"
              disabled={isSubmitting}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </div>

          <div className="mt-2 text-center">
            <p className="text-base text-gray-600">
              ¿No tienes cuenta?{' '}
              <Button 
                variant="link" 
                className="p-0 text-green-600 text-base font-semibold"
                onClick={() => navigate('/register')}
                disabled={isSubmitting}
              >
                Registrarse
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Biometric Setup Dialog */}
      {lastLoginCredentials && (
        <BiometricSetupDialog
          open={showBiometricSetup}
          onOpenChange={setShowBiometricSetup}
          email={lastLoginCredentials.email}
          password={lastLoginCredentials.password}
          onSuccess={() => {
            setLastLoginCredentials(null);
          }}
        />
      )}
    </div>
  );
};

export default Login;

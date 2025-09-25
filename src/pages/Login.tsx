
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVersionManager } from '@/services/version-management';
import { farmProfileService } from '@/services/farmProfileService';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{ version: string; buildNumber: number; releaseDate?: string } | null>(null);
  const [farmLogoUrl, setFarmLogoUrl] = useState<string | null>(null);

  // Load version info and farm logo
  useEffect(() => {
    const loadAppData = async () => {
      try {
        // Load version info
        const currentVersion = await unifiedVersionManager.getCurrentVersion();
        if (currentVersion) {
          setVersionInfo({
            version: currentVersion.version,
            buildNumber: currentVersion.buildNumber,
            releaseDate: currentVersion.releaseDate
          });
        }

        // Load farm logo
        const farmProfile = await farmProfileService.getFarmProfile();
        console.log('Farm profile loaded:', farmProfile);
        if (farmProfile?.logo_url) {
          console.log('Setting farm logo URL:', farmProfile.logo_url);
          setFarmLogoUrl(farmProfile.logo_url);
        }
      } catch (error) {
        console.error('Error loading app data:', error);
      }
    };
    
    loadAppData();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log('✅ User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

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
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden bg-white">
            {farmLogoUrl ? (
              <img 
                src={farmLogoUrl} 
                alt="SKYRANCH Logo" 
                className="w-full h-full object-contain"
                onError={() => setFarmLogoUrl(null)}
              />
            ) : (
              <div className="w-full h-full bg-green-600 rounded-lg flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            SKYRANCH
          </CardTitle>
          {versionInfo && (
            <div className="text-xs text-gray-500 mb-3">
              <p>Versión v{versionInfo.version} • Build #{versionInfo.buildNumber}</p>
              {versionInfo.releaseDate && (
                <p>{new Date(versionInfo.releaseDate).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-base font-medium">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@correo.com"
                required
                className="mt-2 h-12 text-base"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-base font-medium">Contraseña</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  className="h-12 text-base pr-12"
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white h-12 text-base font-semibold mt-8"
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


          <div className="mt-6 text-center">
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
    </div>
  );
};

export default Login;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, AlertCircle, Eye, EyeOff, Fingerprint, Scan } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useBiometric } from '@/hooks/useBiometric';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { BiometricService } from '@/services/biometricService';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signInWithBiometric, user, loading } = useAuth();
  const { isAvailable, biometricType, biometricTypeName, isEnabled, refresh } = useBiometric();
  const { t } = useTranslation('auth');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricSubmitting, setIsBiometricSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{ version: string; buildNumber: number; releaseDate?: string } | null>(null);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [enableFaceId, setEnableFaceId] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  // Check if credentials exist on mount (separate from isEnabled)
  useEffect(() => {
    const checkCredentials = async () => {
      const exists = await BiometricService.hasStoredCredentials();
      setHasCredentials(exists);
    };
    checkCredentials();
  }, []);

  // Sync checkbox with actual biometric status
  useEffect(() => {
    setEnableFaceId(isEnabled);
  }, [isEnabled]);

  // Load version info from Capacitor native app
  useEffect(() => {
    const loadVersion = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const info = await App.getInfo();
          setVersionInfo({
            version: info.version,
            buildNumber: parseInt(info.build),
            releaseDate: undefined
          });
        } else {
          // Web fallback - use package.json version
          setVersionInfo({
            version: '1.0.0',
            buildNumber: 1,
            releaseDate: undefined
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
    if (!isAvailable || !isEnabled) {
      toast({
        variant: "destructive",
        title: t('biometric.notAvailable'),
        description: t('biometric.notAvailableDesc'),
      });
      return;
    }

    setIsBiometricSubmitting(true);

    try {
      console.log('🔐 Starting biometric login...');
      
      // THIS MUST SUCCEED BEFORE WE GET CREDENTIALS
      const authenticated = await BiometricService.authenticate();
      
      if (!authenticated) {
        console.error('❌ Biometric authentication failed or was cancelled');
        toast({
          variant: "destructive",
          title: t('biometric.cancelled'),
          description: t('biometric.cancelledDesc'),
        });
        setIsBiometricSubmitting(false);
        return; // STOP HERE - don't proceed to get credentials
      }
      
      console.log('✅ Biometric authentication succeeded, getting credentials...');
      
      // Only NOW can we get the credentials
      const credentials = await BiometricService.getCredentials();
      if (!credentials) {
        throw new Error('No credentials found');
      }
      
      // Sign in with the credentials
      const { error } = await signIn(credentials.email, credentials.password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: t('messages.loginError'),
          description: error.message,
        });
        setIsBiometricSubmitting(false);
        return;
      }

      toast({
        title: t('messages.welcome'),
        description: t('messages.loginSuccess'),
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Biometric login error:', error);
      toast({
        variant: "destructive",
        title: t('biometric.error'),
        description: t('biometric.errorDesc'),
      });
    } finally {
      setIsBiometricSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: t('messages.fieldsRequired'),
        description: t('messages.fieldsRequiredDesc'),
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
        
        let errorMessage = t('messages.unexpectedError');
        
        if (error.message === 'Invalid login credentials') {
          errorMessage = t('messages.invalidCredentials');
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = t('messages.emailNotConfirmed');
        } else if (error.message?.includes('network')) {
          errorMessage = t('messages.networkError');
        }
        
        toast({
          title: t('messages.loginError'),
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

        // Save credentials for auto-login if checkbox was checked
        if (enableFaceId && isAvailable && !isEnabled) {
          try {
            await BiometricService.saveCredentials(formData.email, formData.password);
            await refresh();
            toast({
              title: t('biometric.saved'),
              description: t('biometric.savedDesc'),
            });
          } catch (error) {
            console.error('Error saving credentials:', error);
          }
        }

        toast({
          title: t('messages.welcome'),
          description: t('messages.loginSuccess'),
        });
        // Navigation will happen automatically via useEffect when user state updates
      }
    } catch (error) {
      console.error('❌ Unexpected login error:', error);
      toast({
        title: t('biometric.error'),
        description: t('messages.unexpectedError'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFaceIdToggle = async (checked: boolean) => {
    if (!checked && isEnabled) {
      // User is turning OFF Face ID - disable immediately
      try {
        const { BiometricService } = await import('@/services/biometricService');
        await BiometricService.deleteCredentials();
        await refresh();
        toast({
          title: t('biometric.disabled'),
          description: t('biometric.disabledDesc'),
        });
      } catch (error) {
        console.error('Error disabling Face ID:', error);
        toast({
          variant: "destructive",
          title: t('biometric.error'),
          description: t('biometric.disableError'),
        });
      }
    }
    setEnableFaceId(checked);
  };

  // Show loading while checking authentication state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('login.loading')}</p>
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
              className="h-20 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
            {t('login.title')}
          </CardTitle>
          <p className="text-sm text-gray-600">{t('login.subtitle')}</p>
          {versionInfo && (
            <div className="text-xs text-gray-500 mt-2">
              <p>v{versionInfo.version} • Build #{versionInfo.buildNumber}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          {/* Biometric Login Button - Only show as active if credentials exist */}
          {isAvailable && (
            <div className="flex justify-center mb-1">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={!hasCredentials || isBiometricSubmitting || isSubmitting}
                title={!hasCredentials ? t('biometric.activateFaceId') : t('biometric.loginWithFaceId')}
                className={cn(
                  "transition-all",
                  hasCredentials 
                    ? "opacity-100 hover:scale-105" 
                    : "opacity-40 cursor-not-allowed"
                )}
              >
                {isBiometricSubmitting ? (
                  <div className="flex items-center justify-center w-14 h-14">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <img 
                    src="/faceid-icon-new.png" 
                    alt="Face ID" 
                    className="w-14 h-14"
                  />
                )}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
                className="h-11"
                disabled={isSubmitting}
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('login.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  className="h-11 pr-12"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
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
              <Checkbox
                id="remember-email"
                checked={rememberEmail}
                onCheckedChange={(checked) => setRememberEmail(checked === true)}
                disabled={isSubmitting}
              />
              <Label 
                htmlFor="remember-email" 
                className="text-sm font-medium cursor-pointer select-none"
              >
                {t('login.rememberEmail')}
              </Label>
            </div>

            {/* Enable Face ID Checkbox */}
            {isAvailable && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-faceid"
                  checked={enableFaceId}
                  onCheckedChange={(checked) => handleFaceIdToggle(checked === true)}
                  disabled={isSubmitting}
                />
                <Label 
                  htmlFor="enable-faceid" 
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  {isEnabled ? t('login.enableFaceId') : t('login.enableFaceIdAlt')}
                </Label>
              </div>
            )}

            <Button
              type="submit"
              variant="farmika"
              disabled={isSubmitting}
              className="w-full h-11 font-semibold mt-6"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('login.submitting')}
                </div>
              ) : (
                t('login.submit')
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
              {t('login.forgotPassword')}
            </Button>
          </div>

          {/* Invitation-only message */}
          <div className="mt-4 text-center text-sm text-muted-foreground space-y-1">
            <p className="font-medium">{t('login.invitationOnly')}</p>
            <p>{t('login.contactAdmin')}</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Login;

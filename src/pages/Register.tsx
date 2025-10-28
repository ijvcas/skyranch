
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { validatePasswordStrength } from '@/utils/passwordPolicy';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive"
      });
      return;
    }

    const check = validatePasswordStrength(formData.password, formData.email, formData.fullName);
    if (!check.valid) {
      toast({
        title: "Contraseña débil",
        description: `${check.errors[0]} Requisitos: mínimo 6 caracteres e incluye al menos un número.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      
      if (error) {
        console.error('Registration error:', error);
        toast({
          title: "Error de registro",
          description: error.message === 'User already registered' 
            ? "Este email ya está registrado. Intenta iniciar sesión."
            : error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registro exitoso",
          description: "Cuenta creada correctamente. Bienvenido a FARMIKA.",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 px-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="absolute top-4 left-4 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex justify-center mb-4">
            <img 
              src="/farmika-logo.png" 
              alt="FARMIKA Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Crear Cuenta en FARMIKA
          </CardTitle>
          <p className="text-sm text-gray-600">Sistema de Gestión Ganadera</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
              <Label htmlFor="fullName" className="text-base font-medium">Nombre Completo</Label>
              <Input
                id="fullName"
                name="register-fullname"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Tu nombre completo"
                required
                className="mt-2 h-12 text-base"
                disabled={isLoading}
                autoComplete="name"
                data-1p-ignore
                data-lpignore="true"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-base font-medium">Correo Electrónico</Label>
              <Input
                id="email"
                name="register-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@correo.com"
                required
                className="mt-2 h-12 text-base"
                disabled={isLoading}
                autoComplete="username"
                data-1p-ignore
                data-lpignore="true"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-base font-medium">Contraseña</Label>
              <Input
                id="password"
                name="register-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Mínimo 6 caracteres, incluye al menos un número"
                required
                minLength={6}
                className="mt-2 h-12 text-base"
                disabled={isLoading}
                autoComplete="new-password"
                data-1p-ignore
                data-lpignore="true"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-base font-medium">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="register-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Repite tu contraseña"
                required
                className="mt-2 h-12 text-base"
                disabled={isLoading}
                autoComplete="new-password"
                data-1p-ignore
                data-lpignore="true"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold mt-8"
            >
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-base text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Button 
                variant="link" 
                className="p-0 text-green-600 text-base font-semibold"
                onClick={() => navigate('/login')}
                disabled={isLoading}
              >
                Iniciar Sesión
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

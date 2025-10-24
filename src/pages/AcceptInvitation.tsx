import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface InvitationData {
  email: string;
  role: string;
  farm_name?: string;
  inviter_name?: string;
  status: string;
  expires_at: string;
}

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    if (!token) {
      toast({
        title: 'Token inválido',
        description: 'El enlace de invitación no es válido',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    try {
      const { data: invitationData, error } = await supabase
        .from('user_invitations')
        .select(`
          email,
          role,
          status,
          expires_at,
          invited_by
        `)
        .eq('invitation_token', token)
        .single();

      if (error || !invitationData) {
        throw new Error('Invitación no encontrada');
      }

      // Check if expired
      if (new Date(invitationData.expires_at) < new Date()) {
        throw new Error('La invitación ha expirado');
      }

      // Check if already accepted
      if (invitationData.status === 'accepted') {
        throw new Error('Esta invitación ya fue aceptada');
      }

      // Get farm profile and inviter name
      const { data: farmProfile } = await supabase
        .from('farm_profiles')
        .select('farm_name')
        .single();

      const { data: inviter } = await supabase
        .from('app_users')
        .select('name')
        .eq('id', invitationData.invited_by)
        .single();

      setInvitation({
        ...invitationData,
        farm_name: farmProfile?.farm_name,
        inviter_name: inviter?.name,
      });
    } catch (error: any) {
      console.error('Error validating invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Invitación inválida o expirada',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/login'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 12) {
      setPasswordError('La contraseña debe tener al menos 12 caracteres');
      return false;
    }
    if (!/[a-z]/.test(pwd) || !/[A-Z]/.test(pwd)) {
      setPasswordError('Debe contener mayúsculas y minúsculas');
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      setPasswordError('Debe contener al menos un número');
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(pwd)) {
      setPasswordError('Debe contener al menos un carácter especial');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa tu nombre completo',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation!.email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Create app_users record with invited role
        const { error: appUserError } = await supabase
          .from('app_users')
          .insert({
            id: authData.user.id,
            email: invitation!.email,
            name: fullName,
            role: invitation!.role,
            is_active: true,
            created_by: authData.user.id,
          });

        if (appUserError) {
          console.error('Error creating app user:', appUserError);
        }

        // Mark invitation as accepted
        await supabase
          .from('user_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('invitation_token', token);

        toast({
          title: '¡Cuenta creada!',
          description: 'Tu cuenta ha sido creada exitosamente. Redirigiendo...',
        });

        // Auto sign in and redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la cuenta',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const roleLabels = {
    worker: 'Trabajador',
    manager: 'Encargado',
    admin: 'Administrador',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              <CardTitle>Invitación Inválida</CardTitle>
            </div>
            <CardDescription>
              Esta invitación no es válida o ha expirado. Por favor contacta al administrador de tu finca.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 to-blue-50">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Has sido invitado a {invitation.farm_name}</CardTitle>
          <CardDescription className="text-base">
            <strong>{invitation.inviter_name}</strong> te ha invitado a unirte a su equipo de gestión de finca
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tu rol asignado:</span>
              <span className="text-lg font-bold text-primary">
                {roleLabels[invitation.role as keyof typeof roleLabels] || invitation.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                placeholder="Mínimo 12 caracteres"
                required
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Debe contener: mayúsculas, minúsculas, números y caracteres especiales
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isCreating || !!passwordError}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aceptar y Crear Cuenta
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Al aceptar esta invitación, tu cuenta será creada y tendrás acceso inmediato a todos los datos de la finca
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;

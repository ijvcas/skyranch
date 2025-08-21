
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, RefreshCw, UserCog, Zap, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminPasswordReset = () => {
  const { toast } = useToast();
  const { resetPassword, forcePasswordUpdate, clearCorruptedSession } = useAuth();
  const [email, setEmail] = useState('jvcas@mac.com');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isForcing, setIsForcing] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast({
          title: "Error",
          description: `Error al enviar reset: ${error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Email Enviado",
          description: `Se ha enviado un email de reset a ${email}. El link ahora debería funcionar correctamente.`,
        });
      }
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al resetear contraseña",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleForcePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsForcing(true);
    
    try {
      console.log('🔧 Admin: Force updating password for:', email);
      
      const { error } = await forcePasswordUpdate(email, newPassword);
      
      if (error) {
        toast({
          title: "Error Forzado",
          description: `No se pudo actualizar por fuerza: ${error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Contraseña Forzada!",
          description: `La contraseña para ${email} ha sido actualizada directamente. Ahora intenta hacer login.`,
        });
        setNewPassword('');
      }
    } catch (error) {
      console.error('Force password update error:', error);
      toast({
        title: "Error",
        description: "Error al forzar actualización de contraseña",
        variant: "destructive"
      });
    } finally {
      setIsForcing(false);
    }
  };

  const handleClearSession = async () => {
    setIsClearing(true);
    
    try {
      await clearCorruptedSession();
      
      toast({
        title: "Sesión Limpiada",
        description: "Se ha limpiado toda la data de sesión corrupta. Intenta loguearte de nuevo.",
      });
      
      // Refresh after clearing
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Clear session error:', error);
      toast({
        title: "Error",
        description: "Error al limpiar sesión",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          Admin - Herramientas de Usuario
        </CardTitle>
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          Herramientas especiales para resolver problemas de login
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Reset Method - Fixed */}
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <Label htmlFor="reset-email">Email del Usuario</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={isResetting}
            className="w-full"
          >
            {isResetting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Enviando Reset...
              </div>
            ) : (
              "Enviar Reset (URL Corregida)"
            )}
          </Button>
        </form>

        {/* Force Password Update - Most Powerful */}
        <div className="border-t pt-4">
          <form onSubmit={handleForcePasswordUpdate} className="space-y-4">
            <div>
              <Label htmlFor="force-password">🔥 Forzar Nueva Contraseña</Label>
              <Input
                id="force-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                minLength={6}
              />
            </div>
            
            <Button
              type="submit"
              disabled={isForcing}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isForcing ? (
                <div className="flex items-center">
                  <Zap className="w-4 h-4 animate-pulse mr-2" />
                  Forzando...
                </div>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Forzar Cambio de Contraseña
                </>
              )}
            </Button>
          </form>
          <p className="text-xs text-red-600 mt-2 font-medium">
            ⚡ Método más potente - bypasa el email reset
          </p>
        </div>

        {/* Session Cleanup */}
        <div className="border-t pt-4">
          <Button
            onClick={handleClearSession}
            disabled={isClearing}
            variant="outline"
            className="w-full"
          >
            {isClearing ? (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Limpiando...
              </div>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpiar Sesión Corrupta
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Ejecuta esto primero si el login falla constantemente
          </p>
        </div>

        {/* Instructions */}
        <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">📋 Pasos recomendados:</h4>
          <ol className="text-blue-700 space-y-1">
            <li>1. Limpia la sesión corrupta</li>
            <li>2. Usa "Forzar Cambio" con nueva contraseña</li>
            <li>3. Intenta hacer login con la nueva contraseña</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPasswordReset;

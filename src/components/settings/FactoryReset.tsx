import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Loader2, Shield } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import * as comprehensiveBackupService from '@/services/comprehensiveBackupService';

const FactoryReset = () => {
  const [step, setStep] = useState<'initial' | 'backup' | 'confirm' | 'password'>('initial');
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Only show on iOS
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return null;
  }

  const handleStartReset = () => {
    setStep('backup');
  };

  const handleCreateBackup = async () => {
    try {
      toast({
        title: 'Creando respaldo...',
        description: 'Este proceso puede tardar unos momentos',
      });

      await comprehensiveBackupService.createBackup('icloud');

      toast({
        title: 'Respaldo creado',
        description: 'Respaldo guardado en iCloud exitosamente',
      });

      setStep('confirm');
    } catch (error) {
      toast({
        title: 'Error al crear respaldo',
        description: 'No se puede continuar sin un respaldo',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmText = () => {
    if (confirmText === 'DELETE EVERYTHING') {
      setStep('password');
    } else {
      toast({
        title: 'Texto incorrecto',
        description: 'Debes escribir "DELETE EVERYTHING" exactamente',
        variant: 'destructive',
      });
    }
  };

  const handleFactoryReset = async () => {
    if (!user) return;

    setIsResetting(true);

    try {
      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      });

      if (signInError) {
        throw new Error('Contraseña incorrecta');
      }

      // Execute factory reset
      const { data, error } = await supabase.rpc('perform_factory_reset', {
        reset_user_id: user.id,
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        toast({
          title: 'Reset completado',
          description: 'Todos los datos han sido eliminados. Cerrando sesión...',
        });

        // Sign out and redirect
        setTimeout(async () => {
          await signOut();
        }, 2000);
      } else {
        throw new Error('Error al ejecutar reset');
      }
    } catch (error: any) {
      console.error('Factory reset error:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar el reset',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCancel = () => {
    setStep('initial');
    setConfirmText('');
    setPassword('');
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>Zona de Peligro</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            Acciones permanentes que no se pueden deshacer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-red-900">Factory Reset</h3>
                <p className="text-sm text-gray-700">
                  Elimina <strong>TODOS</strong> los datos de la aplicación:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>Todos los animales y registros</li>
                  <li>Todos los lotes y mapas</li>
                  <li>Todos los usuarios (excepto tú como propietario)</li>
                  <li>Todos los eventos y notificaciones</li>
                  <li>Configuración de la finca</li>
                </ul>
                <p className="text-sm font-bold text-red-600 mt-4">
                  ⚠️ Esta acción es PERMANENTE y NO se puede deshacer
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleStartReset}
              className="w-full"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Iniciar Factory Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Backup Confirmation */}
      <AlertDialog open={step === 'backup'} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paso 1: Crear Respaldo Obligatorio</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Antes de continuar, debes crear un respaldo completo en iCloud.
              </p>
              <p className="text-red-600 font-medium">
                Este respaldo es tu única forma de recuperar los datos si cambias de opinión.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateBackup}>
              Crear Respaldo en iCloud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Type DELETE EVERYTHING */}
      <AlertDialog open={step === 'confirm'} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paso 2: Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Para continuar, escribe exactamente:
              </p>
              <p className="text-center font-mono font-bold text-lg bg-red-100 p-2 rounded">
                DELETE EVERYTHING
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE EVERYTHING"
              className="text-center font-mono"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmText}
              disabled={confirmText !== 'DELETE EVERYTHING'}
              className="bg-red-600 hover:bg-red-700"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 3: Re-enter Password */}
      <AlertDialog open={step === 'password'} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paso 3: Verificar Contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              Por seguridad, vuelve a ingresar tu contraseña para ejecutar el factory reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4 space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFactoryReset}
              disabled={isResetting || !password}
              className="bg-red-600 hover:bg-red-700"
            >
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ejecutar Factory Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FactoryReset;

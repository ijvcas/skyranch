import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Database, Shield, Clock, Users, Image, Building2, Code, Activity } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import UserActivityLogs from './UserActivityLogs';
import DashboardBannerSettings from './DashboardBannerSettings';
import FarmProfileSettings from './FarmProfileSettings';
import DeploymentVersionDisplay from '../app-info/DeploymentVersionDisplay';
import DatabaseVersionDisplay from '../app-info/DatabaseVersionDisplay';

const SystemSettings = () => {
  const queryClient = useQueryClient();

  const handleSystemRefresh = () => {
    // Clear React Query cache before reload to ensure fresh data
    queryClient.clear();
    window.location.reload();
  };

  const handleClearCache = () => {
    // Clear all storage and React Query cache
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Base de Datos</p>
              <p className="text-sm text-muted-foreground">Conexión activa a Supabase</p>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground">
              Conectado
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticación</p>
              <p className="text-sm text-muted-foreground">Sistema de autenticación activo</p>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground">
              Activo
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Última Actualización</p>
              <p className="text-sm text-muted-foreground">Sistema actualizado recientemente</p>
            </div>
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              Hoy
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Mantenimiento del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={handleSystemRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar Sistema
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClearCache}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Limpiar Caché
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Use estas herramientas para mantener el sistema funcionando correctamente. 
              La limpieza de caché puede resolver problemas de carga.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Version Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Información de Versiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeploymentVersionDisplay />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DatabaseVersionDisplay />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Farm Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Configuración de la Finca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FarmProfileSettings />
        </CardContent>
      </Card>

      <Separator />

      {/* Dashboard Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Personalización del Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardBannerSettings />
        </CardContent>
      </Card>

      <Separator />

      {/* User Activity Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Monitoreo de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserActivityLogs />
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
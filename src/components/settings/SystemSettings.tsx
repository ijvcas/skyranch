import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Database, Shield, Users, Image, Building2, Code } from 'lucide-react';
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
      {/* Version Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Sistema de Versionado Automático
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

      <Separator />

      {/* System Maintenance - Moved to bottom */}
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
    </div>
  );
};

export default SystemSettings;
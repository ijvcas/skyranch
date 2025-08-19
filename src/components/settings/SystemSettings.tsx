import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Shield, Clock } from 'lucide-react';

const SystemSettings = () => {
  const handleSystemRefresh = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Base de Datos</p>
              <p className="text-sm text-muted-foreground">Conexión activa a Supabase</p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Conectado
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticación</p>
              <p className="text-sm text-muted-foreground">Sistema de autenticación activo</p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
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
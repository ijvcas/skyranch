
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Settings } from 'lucide-react';

const PermissionsSettings = () => {
  const { userRole, loading } = usePermissions();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos y Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const roleInfo = {
    admin: {
      label: 'Administrador',
      color: 'destructive' as const,
      permissions: ['Gestión de usuarios', 'Configuración del sistema', 'Gestión de animales', 'Registros de salud']
    },
    manager: {
      label: 'Gerente',
      color: 'secondary' as const,
      permissions: ['Gestión de usuarios', 'Gestión de animales', 'Registros de salud']
    },
    worker: {
      label: 'Trabajador',
      color: 'outline' as const,
      permissions: ['Gestión de animales', 'Registros de salud']
    }
  };

  const currentRoleInfo = roleInfo[userRole || 'worker'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tu Rol Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={currentRoleInfo.color}>
              {currentRoleInfo.label}
            </Badge>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium">Permisos incluidos:</h4>
            <div className="grid gap-2">
              {currentRoleInfo.permissions.map((permission, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {permission}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Roles Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(roleInfo).map(([role, info]) => (
              <div key={role} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={info.color}>
                    {info.label}
                  </Badge>
                  {userRole === role && (
                    <span className="text-xs text-muted-foreground">(Tu rol actual)</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="grid gap-1">
                    {info.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {userRole !== 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Solicitar Cambio de Rol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Si necesitas permisos adicionales, contacta con un administrador del sistema.
            </p>
            <div className="text-xs text-muted-foreground">
              Los cambios de rol deben ser aprobados por un administrador por motivos de seguridad.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PermissionsSettings;

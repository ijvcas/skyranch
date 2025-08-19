
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PermissionsSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos y Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">Configuración de permisos disponible próximamente.</p>
          <p className="text-sm text-gray-500 mt-2">
            Esta sección permitirá configurar roles y permisos de usuarios.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionsSettings;

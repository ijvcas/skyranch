
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UserSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">Funcionalidad de gestión de usuarios disponible próximamente.</p>
          <p className="text-sm text-gray-500 mt-2">
            Esta sección permitirá gestionar roles y permisos de usuarios.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSettings;

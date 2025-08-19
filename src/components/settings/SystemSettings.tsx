
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SystemSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">Configuración del sistema disponible próximamente.</p>
          <p className="text-sm text-gray-500 mt-2">
            Esta sección permitirá configurar aspectos generales del sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;

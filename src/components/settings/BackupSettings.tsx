
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BackupSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Respaldo de Datos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">Funcionalidad de respaldo disponible próximamente.</p>
          <p className="text-sm text-gray-500 mt-2">
            Esta sección permitirá exportar e importar datos de la aplicación.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupSettings;

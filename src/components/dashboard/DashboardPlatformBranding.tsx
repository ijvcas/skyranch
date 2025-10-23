import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import farmikaLogo from '@/assets/farmika-logo.png';

const DashboardPlatformBranding = () => {
  return (
    <Card className="mt-8 overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-br from-green-600 to-green-700 p-8">
        <CardContent className="p-0 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={farmikaLogo} 
              alt="FARMIKA Logo" 
              className="h-20 w-auto object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            FARMIKA
          </h2>
          <p className="text-white/90 text-lg font-medium">
            Sistema de Gestión Integral para Fincas
          </p>
        </CardContent>
      </div>
    </Card>
  );
};

export default DashboardPlatformBranding;

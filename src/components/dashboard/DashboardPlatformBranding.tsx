import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import farmikaLogo from '@/assets/farmika-logo.png';

const DashboardPlatformBranding = () => {
  return (
    <div className="flex justify-center py-6">
      <img 
        src={farmikaLogo} 
        alt="FARMIKA - Sistema de Gestión Integral para Fincas" 
        className="h-16 w-auto object-contain"
      />
    </div>
  );
};

export default DashboardPlatformBranding;

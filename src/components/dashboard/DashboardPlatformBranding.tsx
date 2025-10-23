import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import farmikaLogo from '@/assets/farmika-logo.png';

const DashboardPlatformBranding = () => {
  return (
    <div className="flex justify-center py-2">
      <img 
        src={farmikaLogo} 
        alt="FARMIKA - Sistema de Gestión Integral para Fincas" 
        className="h-24 w-auto object-contain opacity-70 saturate-50 contrast-90"
        style={{ filter: 'sepia(0.15) hue-rotate(80deg)' }}
      />
    </div>
  );
};

export default DashboardPlatformBranding;

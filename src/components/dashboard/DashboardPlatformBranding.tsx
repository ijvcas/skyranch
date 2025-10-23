import React from 'react';
import farmikaLogo from '@/assets/logo_FARMIKA.png';
import WeatherWidget from '@/components/weather/WeatherWidget';

const DashboardPlatformBranding = () => {
  return (
    <div className="py-1">
      <div className="flex items-center justify-center gap-2">
        <WeatherWidget />
        <img 
          src={farmikaLogo} 
          alt="FARMIKA - Sistema de Gestión Integral para Fincas" 
          className="h-16 w-auto object-contain"
        />
      </div>
      <p className="text-sm text-muted-foreground text-center mt-1 mb-1">
        28649 Rozas de Puerto Real, Madrid, Spain
      </p>
    </div>
  );
};

export default DashboardPlatformBranding;

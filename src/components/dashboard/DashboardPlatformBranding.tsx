import React from 'react';
import farmikaLogo from '@/assets/logo_FARMIKA.png';
import WeatherWidget from '@/components/weather/WeatherWidget';

const DashboardPlatformBranding = () => {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <WeatherWidget />
      <img 
        src={farmikaLogo} 
        alt="FARMIKA - Sistema de Gestión Integral para Fincas" 
        className="h-16 w-auto object-contain"
      />
    </div>
  );
};

export default DashboardPlatformBranding;

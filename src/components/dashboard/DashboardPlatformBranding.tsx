import React from 'react';
import WeatherWidget from '@/components/weather/WeatherWidget';
import { useFarmBranding } from '@/hooks/useFarmBranding';

const DashboardPlatformBranding = () => {
  const { branding, isLoading } = useFarmBranding();

  return (
    <div className="py-3 pb-1">
      <div className="flex items-center justify-center gap-6">
        <WeatherWidget />
        {branding.farm_logo_url && (
          <img 
            src={branding.farm_logo_url} 
            alt={`${branding.farm_name} - Sistema de Gestión Integral para Fincas`}
            className="h-16 w-auto object-contain"
          />
        )}
        {!branding.farm_logo_url && !isLoading && (
          <h2 className="text-2xl font-bold text-primary">{branding.farm_name}</h2>
        )}
      </div>
    </div>
  );
};

export default DashboardPlatformBranding;

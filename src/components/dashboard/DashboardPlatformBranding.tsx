import React from 'react';
import WeatherWidget from '@/components/weather/WeatherWidget';
import { useFarmBranding } from '@/hooks/useFarmBranding';

const DashboardPlatformBranding = () => {
  const { branding, isLoading } = useFarmBranding();

  return (
    <div className="py-3 pb-1">
      <div className="flex items-center justify-center">
        <WeatherWidget />
      </div>
    </div>
  );
};

export default DashboardPlatformBranding;

import React from 'react';
import WeatherWidget from '@/components/weather/WeatherWidget';
import { useFarmProfile } from '@/hooks/useFarmProfile';
import { MapPin } from 'lucide-react';

const DashboardPlatformBranding = () => {
  const { data: farmProfile, isLoading } = useFarmProfile();

  return (
    <div className="py-3 pb-1">
      <div className="flex items-center justify-between px-4 gap-4">
        <div className="flex-1 flex justify-start">
          <WeatherWidget />
        </div>
        
        {farmProfile?.location_name && (
          <div className="flex-1 flex justify-end items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{farmProfile.location_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPlatformBranding;

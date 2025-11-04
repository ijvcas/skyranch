import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { locationService, LocationCoordinates } from '@/services/mobile/locationService';
import { hapticService } from '@/services/mobile/hapticService';
import { toast } from 'sonner';

interface LocationCaptureProps {
  onLocationCaptured: (location: LocationCoordinates) => void;
  currentLocation?: LocationCoordinates | null;
}

const LocationCapture: React.FC<LocationCaptureProps> = ({ onLocationCaptured, currentLocation }) => {
  const [capturing, setCapturing] = useState(false);

  const handleCaptureLocation = async () => {
    if (!locationService.isAvailable()) {
      toast.error('Geolocalización solo disponible en app móvil');
      return;
    }

    setCapturing(true);
    await hapticService.light();

    try {
      // Check and request permissions
      const perms = await locationService.checkPermissions();
      if (perms.location !== 'granted') {
        const requested = await locationService.requestPermissions();
        if (requested.location !== 'granted') {
          toast.error('Permisos de ubicación denegados');
          setCapturing(false);
          return;
        }
      }

      // Get location
      const location = await locationService.getCurrentLocation();
      if (location) {
        onLocationCaptured(location);
        await hapticService.success();
        toast.success('Ubicación capturada');
      } else {
        toast.error('No se pudo obtener la ubicación');
        await hapticService.error();
      }
    } catch (error) {
      console.error('Error capturing location:', error);
      toast.error('Error al capturar ubicación');
      await hapticService.error();
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleCaptureLocation}
        disabled={capturing}
        className="w-full"
      >
        {capturing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Capturando ubicación...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            {currentLocation ? 'Actualizar ubicación' : 'Capturar ubicación'}
          </>
        )}
      </Button>

      {currentLocation && (
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">Ubicación guardada:</p>
          <p>{locationService.formatLocationForDisplay(currentLocation.latitude, currentLocation.longitude)}</p>
          <p className="text-xs">Precisión: ±{currentLocation.accuracy.toFixed(0)}m</p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => locationService.openInMaps(currentLocation.latitude, currentLocation.longitude)}
            className="p-0 h-auto"
          >
            Ver en Mapas
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationCapture;

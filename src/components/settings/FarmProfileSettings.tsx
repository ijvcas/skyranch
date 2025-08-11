import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFarmProfile } from '@/hooks/useFarmProfile';
import { useWeatherSettings } from '@/hooks/useWeatherSettings';
import { type FarmProfileFormData } from '@/services/farmProfileService';
import { Loader2, Upload, MapPin, Building2, Check } from 'lucide-react';
import { suggestPlaces, getPlaceDetails, type PlacePrediction } from '@/services/placesService';

const farmProfileSchema = z.object({
  farm_name: z.string().min(1, 'El nombre de la finca es requerido'),
  location_name: z.string().optional(),
  location_coordinates: z.string().optional(),
});


const FarmProfileSettings = () => {
  const { toast } = useToast();
  const { 
    data: farmProfile, 
    isLoading, 
    createFarmProfile, 
    updateFarmProfile,
    uploadLogo,
    isCreating,
    isUpdating,
    isUploadingLogo 
  } = useFarmProfile();
  
  const { syncFromFarm } = useWeatherSettings();

  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validatingLocation, setValidatingLocation] = useState(false);
  const [locationValidated, setLocationValidated] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FarmProfileFormData>({
    resolver: zodResolver(farmProfileSchema),
  });

  const locationName = watch('location_name');

  useEffect(() => {
    if (farmProfile) {
      const formData = {
        farm_name: farmProfile.farm_name,
        location_name: farmProfile.location_name || undefined,
        location_coordinates: farmProfile.location_coordinates || undefined,
      };
      reset(formData);
      setLocationValidated(!!farmProfile.location_coordinates);
    }
  }, [farmProfile, reset]);

  const onSubmit = async (data: FarmProfileFormData) => {
    try {
      console.log('🔄 Form submission started with data:', data);
      console.log('🔄 Current form values:', {
        farm_name: watch('farm_name'),
        location_name: watch('location_name'), 
        location_coordinates: watch('location_coordinates')
      });
      
      if (farmProfile) {
        console.log('🔄 Updating existing farm profile:', farmProfile.id);
        const result = await updateFarmProfile({ id: farmProfile.id, data });
        console.log('✅ Update result:', result);
        
        // Sync weather settings after successful update if coordinates are available
        if (data.location_coordinates) {
          console.log('🌍 Syncing weather settings with coordinates:', data.location_coordinates);
          try {
            await syncFromFarm();
            console.log('✅ Weather settings synced with new coordinates');
          } catch (error) {
            console.warn('❌ Failed to sync weather settings:', error);
          }
        } else {
          console.warn('⚠️ No coordinates available for weather sync');
        }
        
        toast({
          title: 'Perfil actualizado',
          description: 'El perfil de la finca se ha actualizado correctamente.',
        });
      } else {
        console.log('🔄 Creating new farm profile');
        const newProfile = await createFarmProfile(data);
        console.log('✅ Creation result:', newProfile);
        
        // Sync weather settings after creation if coordinates are available
        if (data.location_coordinates) {
          console.log('🌍 Syncing weather settings for new profile');
          try {
            await syncFromFarm();
            console.log('✅ Weather settings synced for new profile');
          } catch (error) {
            console.warn('❌ Failed to sync weather settings:', error);
          }
        }
        
        toast({
          title: 'Perfil creado',
          description: 'El perfil de la finca se ha creado correctamente.',
        });
      }
    } catch (error) {
      console.error('❌ Error saving farm profile:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar el perfil de la finca.',
        variant: 'destructive',
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !farmProfile) return;

    try {
      await uploadLogo({ id: farmProfile.id, file });
      toast({
        title: 'Logo actualizado',
        description: 'El logo de la finca se ha actualizado correctamente.',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'Error al subir el logo.',
        variant: 'destructive',
      });
    }
  };


  const handleLocationSearch = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const results = await suggestPlaces(input, 'es');
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationSelect = async (suggestion: PlacePrediction) => {
    setValidatingLocation(true);
    setShowSuggestions(false);

    try {
      const result = await getPlaceDetails(suggestion.place_id, 'es');
      if (result) {
        console.log('Location validated:', result);
        setValue('location_name', result.display_name);
        setValue('location_coordinates', `${result.lat},${result.lng}`);
        setLocationValidated(true);
        
        toast({
          title: 'Ubicación validada',
          description: `${result.display_name} seleccionada correctamente. Guarda el perfil para activar el clima en tiempo real.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo obtener los detalles de la ubicación.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error validating location:', error);
      toast({
        title: 'Error',
        description: 'Error al validar la ubicación.',
        variant: 'destructive',
      });
    } finally {
      setValidatingLocation(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Perfil de la Finca
          </CardTitle>
          <CardDescription>
            Configura la información básica de tu finca, incluyendo logo y ubicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Farm Name */}
            <div>
              <Label htmlFor="farm_name">Nombre de la Finca *</Label>
              <Input
                id="farm_name"
                {...register('farm_name')}
                placeholder="Ej: Finca San José"
              />
              {errors.farm_name && (
                <p className="text-sm text-red-600 mt-1">{errors.farm_name.message}</p>
              )}
            </div>

            {/* Location with Google Maps */}
            <div className="relative">
              <Label htmlFor="location_name">Ubicación</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="location_name"
                    {...register('location_name')}
                    placeholder="Buscar ubicación..."
                    onChange={(e) => {
                      handleLocationSearch(e.target.value);
                      setLocationValidated(false);
                    }}
                    className={locationValidated ? 'pr-10' : ''}
                  />
                  {locationValidated && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                  )}
                  
                  {/* Location Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                          onClick={() => handleLocationSelect(suggestion)}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{suggestion.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {locationValidated && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Ubicación validada con Google Places
                </p>
              )}
              {validatingLocation && (
                <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Validando ubicación...
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isCreating || isUpdating}
              className="w-full"
            >
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {farmProfile ? 'Actualizar Perfil' : 'Crear Perfil'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logo and Picture Upload */}
      {farmProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo de la Finca</CardTitle>
              <CardDescription>
                Sube el logo de tu finca (recomendado: formato cuadrado, PNG/JPG)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {farmProfile.logo_url && (
                <div className="mb-4">
                  <img
                    src={farmProfile.logo_url}
                    alt="Logo de la finca"
                    className="w-32 h-32 object-contain border rounded-lg"
                  />
                </div>
              )}
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="hidden"
                  id="logo-upload"
                />
                <Label
                  htmlFor="logo-upload"
                  className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {isUploadingLogo ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span>Subir Logo</span>
                    </>
                  )}
                </Label>
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
};

export default FarmProfileSettings;
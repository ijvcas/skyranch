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
import { Loader2, MapPin, Building2, Check } from 'lucide-react';
import { suggestPlaces, getPlaceDetails, type PlacePrediction } from '@/services/placesService';
import { dashboardBannerService } from '@/services/dashboardBannerService';
import ImageUpload from '@/components/ImageUpload';
import { useTranslation } from 'react-i18next';

const farmProfileSchema = z.object({
  farm_name: z.string().min(1, 'El nombre de la finca es requerido'),
  location_name: z.string().optional(),
  location_coordinates: z.string().optional(),
});


const FarmProfileSettings = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { 
    data: farmProfile, 
    isLoading, 
    createFarmProfile, 
    updateFarmProfile,
    uploadLogo,
    uploadPicture,
    isCreating,
    isUpdating,
    isUploadingLogo,
    isUploadingPicture
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
      
      if (farmProfile) {
        console.log('🔄 Updating existing farm profile:', farmProfile.id);
        const result = await updateFarmProfile({ id: farmProfile.id, data });
        console.log('✅ Update result:', result);
        
        if (data.location_coordinates) {
          console.log('🌍 Syncing weather settings with coordinates:', data.location_coordinates);
          try {
            await syncFromFarm();
            console.log('✅ Weather settings synced with new coordinates');
          } catch (error) {
            console.warn('❌ Failed to sync weather settings:', error);
          }
        }
        
        toast({
          title: t('settings:farmProfile.profileUpdated'),
          description: t('settings:farmProfile.profileUpdatedDesc'),
        });
      } else {
        console.log('🔄 Creating new farm profile');
        const newProfile = await createFarmProfile(data);
        console.log('✅ Creation result:', newProfile);
        
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
          title: t('settings:farmProfile.profileCreated'),
          description: t('settings:farmProfile.profileCreatedDesc'),
        });
      }
    } catch (error) {
      console.error('❌ Error saving farm profile:', error);
      toast({
        title: t('common:error'),
        description: t('settings:messages.error'),
        variant: 'destructive',
      });
    }
  };

  const handleLogoChange = async (imageUrl: string | null) => {
    if (!imageUrl || !farmProfile) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'logo.png', { type: blob.type });
      
      await uploadLogo({ id: farmProfile.id, file });
      toast({
        title: t('settings:farmProfile.logoUpdated'),
        description: t('settings:farmProfile.logoUpdatedDesc'),
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: t('common:error'),
        description: t('settings:messages.error'),
        variant: 'destructive',
      });
    }
  };

  const handlePictureChange = async (imageUrl: string | null) => {
    if (!imageUrl || !farmProfile) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'picture.png', { type: blob.type });
      
      await uploadPicture({ id: farmProfile.id, file });
      toast({
        title: t('settings:farmProfile.pictureUpdated'),
        description: t('settings:farmProfile.pictureUpdatedDesc'),
      });
    } catch (error) {
      console.error('Error uploading picture:', error);
      toast({
        title: t('common:error'),
        description: t('settings:messages.error'),
        variant: 'destructive',
      });
    }
  };

  const handleSyncDashboardBanner = async () => {
    if (!farmProfile) return;

    try {
      const banner = await dashboardBannerService.getBanner();
      if (!banner?.image_url) {
        toast({
          title: t('common:error'),
          description: t('settings:farmProfile.noDashboardBanner'),
          variant: 'destructive',
        });
        return;
      }

      // Convert base64 or URL to file and upload
      const response = await fetch(banner.image_url);
      const blob = await response.blob();
      const file = new File([blob], 'dashboard-banner.jpg', { type: blob.type });
      
      await uploadPicture({ id: farmProfile.id, file });
      toast({
        title: t('settings:farmProfile.pictureUpdated'),
        description: t('settings:farmProfile.syncedFromDashboard'),
      });
    } catch (error) {
      console.error('Error syncing dashboard banner:', error);
      toast({
        title: t('common:error'),
        description: t('settings:messages.error'),
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
          title: t('settings:farmProfile.locationValidated'),
          description: `${result.display_name}`,
        });
      } else {
        toast({
          title: t('common:error'),
          description: t('settings:messages.error'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error validating location:', error);
      toast({
        title: t('common:error'),
        description: t('settings:messages.error'),
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
            {t('settings:farmProfile.title')}
          </CardTitle>
          <CardDescription>
            {t('settings:farmProfile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Farm Name */}
            <div>
              <Label htmlFor="farm_name">{t('settings:farmProfile.farmName')} *</Label>
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
              <Label htmlFor="location_name">{t('settings:farmProfile.location')}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="location_name"
                    {...register('location_name')}
                    placeholder={t('settings:farmProfile.searchLocation')}
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
                  {t('settings:farmProfile.locationValidated')}
                </p>
              )}
              {validatingLocation && (
                <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('settings:farmProfile.validatingLocation')}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isCreating || isUpdating}
              className="w-full"
            >
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {farmProfile ? t('settings:farmProfile.updateProfile') : t('settings:farmProfile.createProfile')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      {farmProfile && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings:farmProfile.logo')}</CardTitle>
            <CardDescription>
              {t('settings:farmProfile.logoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              currentImage={farmProfile.logo_url || null}
              onImageChange={handleLogoChange}
              disabled={isUploadingLogo}
            />
          </CardContent>
        </Card>
      )}

      {/* Farm Picture Upload */}
      {farmProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{t('settings:farmProfile.picture')}</CardTitle>
                <CardDescription>
                  {t('settings:farmProfile.pictureDescription')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncDashboardBanner}
                disabled={isUploadingPicture}
              >
                {t('settings:farmProfile.syncDashboard')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ImageUpload
              currentImage={farmProfile.picture_url || null}
              onImageChange={handlePictureChange}
              disabled={isUploadingPicture}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FarmProfileSettings;
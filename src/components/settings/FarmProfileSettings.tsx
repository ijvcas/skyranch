import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFarmProfile } from '@/hooks/useFarmProfile';
import { type FarmProfileFormData } from '@/services/farmProfileService';
import { Loader2, Upload, MapPin, Building2 } from 'lucide-react';
import { geocodeCity } from '@/services/placesService';

const farmProfileSchema = z.object({
  farm_name: z.string().min(1, 'El nombre de la finca es requerido'),
  description: z.string().optional(),
  location_name: z.string().optional(),
  address: z.string().optional(),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  established_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  farm_type: z.string().optional(),
  total_area_hectares: z.number().min(0).optional(),
});


const FarmProfileSettings = () => {
  const { toast } = useToast();
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [validatingLocation, setValidatingLocation] = useState(false);

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
        description: farmProfile.description || undefined,
        location_name: farmProfile.location_name || undefined,
        address: farmProfile.address || undefined,
        contact_email: farmProfile.contact_email || undefined,
        contact_phone: farmProfile.contact_phone || undefined,
        website: farmProfile.website || undefined,
        established_year: farmProfile.established_year || undefined,
        farm_type: farmProfile.farm_type || undefined,
        total_area_hectares: farmProfile.total_area_hectares || undefined,
      };
      reset(formData);
    }
  }, [farmProfile, reset]);

  const onSubmit = async (data: FarmProfileFormData) => {
    try {
      if (farmProfile) {
        await updateFarmProfile({ id: farmProfile.id, data });
        toast({
          title: 'Perfil actualizado',
          description: 'El perfil de la finca se ha actualizado correctamente.',
        });
      } else {
        await createFarmProfile(data);
        toast({
          title: 'Perfil creado',
          description: 'El perfil de la finca se ha creado correctamente.',
        });
      }
    } catch (error) {
      console.error('Error saving farm profile:', error);
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

  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !farmProfile) return;

    try {
      await uploadPicture({ id: farmProfile.id, file });
      toast({
        title: 'Imagen actualizada',
        description: 'La imagen de la finca se ha actualizada correctamente.',
      });
    } catch (error) {
      console.error('Error uploading picture:', error);
      toast({
        title: 'Error',
        description: 'Error al subir la imagen.',
        variant: 'destructive',
      });
    }
  };

  const handleValidateLocation = async () => {
    if (!locationName?.trim()) return;

    setValidatingLocation(true);
    try {
      const result = await geocodeCity(locationName, 'es');
      if (result) {
        setValue('location_name', result.display_name);
        toast({
          title: 'Ubicación validada',
          description: `${result.display_name} encontrada correctamente.`,
        });
      } else {
        toast({
          title: 'Ubicación no encontrada',
          description: 'No se pudo validar la ubicación. Verifica el nombre.',
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
            Configura la información básica de tu finca, incluyendo logo, imagen y ubicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="farm_type">Tipo de Finca</Label>
                <Input
                  id="farm_type"
                  {...register('farm_type')}
                  placeholder="Ej: Ganadera, Agrícola, Mixta"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descripción de la finca, actividades principales, etc."
                rows={3}
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location_name">Ubicación</Label>
              <div className="flex gap-2">
                <Input
                  id="location_name"
                  {...register('location_name')}
                  placeholder="Ciudad, País"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidateLocation}
                  disabled={!locationName?.trim() || validatingLocation}
                >
                  {validatingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  Validar
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Dirección completa"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Email de Contacto</Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...register('contact_email')}
                  placeholder="info@finca.com"
                />
                {errors.contact_email && (
                  <p className="text-sm text-red-600 mt-1">{errors.contact_email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
                <Input
                  id="contact_phone"
                  {...register('contact_phone')}
                  placeholder="+34 123 456 789"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                {...register('website')}
                placeholder="https://www.finca.com"
              />
              {errors.website && (
                <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
              )}
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="established_year">Año de Establecimiento</Label>
                <Input
                  id="established_year"
                  type="number"
                  {...register('established_year', { valueAsNumber: true })}
                  placeholder="2020"
                />
                {errors.established_year && (
                  <p className="text-sm text-red-600 mt-1">{errors.established_year.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="total_area_hectares">Área Total (Hectáreas)</Label>
                <Input
                  id="total_area_hectares"
                  type="number"
                  step="0.01"
                  {...register('total_area_hectares', { valueAsNumber: true })}
                  placeholder="100.5"
                />
              </div>
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

          {/* Picture Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen de la Finca</CardTitle>
              <CardDescription>
                Sube una imagen representativa de tu finca (paisaje, instalaciones, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {farmProfile.picture_url && (
                <div className="mb-4">
                  <img
                    src={farmProfile.picture_url}
                    alt="Imagen de la finca"
                    className="w-full h-32 object-cover border rounded-lg"
                  />
                </div>
              )}
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  disabled={isUploadingPicture}
                  className="hidden"
                  id="picture-upload"
                />
                <Label
                  htmlFor="picture-upload"
                  className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {isUploadingPicture ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span>Subir Imagen</span>
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
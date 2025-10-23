import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFarmBranding } from '@/hooks/useFarmBranding';
import { Loader2, Palette, RotateCcw } from 'lucide-react';

const FarmCustomization = () => {
  const { branding, isLoading, updateBranding } = useFarmBranding();
  const [primaryColor, setPrimaryColor] = useState(branding.theme_primary_color);
  const [secondaryColor, setSecondaryColor] = useState(branding.theme_secondary_color);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    
    const result = await updateBranding({
      theme_primary_color: primaryColor,
      theme_secondary_color: secondaryColor,
    });

    if (result.success) {
      toast({
        title: 'Colores actualizados',
        description: 'Los cambios se aplicarán inmediatamente',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'No se pudieron guardar los cambios',
        variant: 'destructive',
      });
    }
    
    setIsSaving(false);
  };

  const handleRestoreDefaults = () => {
    setPrimaryColor('#16a34a');
    setSecondaryColor('#22c55e');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Personalización de Finca</CardTitle>
        </div>
        <CardDescription>
          Personaliza los colores del tema de tu finca. Los cambios se aplicarán inmediatamente en toda la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Color Principal</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-12 w-20 cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#16a34a"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Usado en botones y elementos activos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Color Secundario</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="secondaryColor"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-12 w-20 cursor-pointer"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#22c55e"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Usado en estados hover y acentos
            </p>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Vista Previa</Label>
          <Card 
            className="border-2 transition-colors"
            style={{ 
              borderColor: primaryColor,
              backgroundColor: `${primaryColor}10` 
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: primaryColor }}>
                Ejemplo de Tarjeta
              </CardTitle>
              <CardDescription>
                Así se verán los colores en tu aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                style={{ 
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
                className="hover:opacity-90"
              >
                Botón Principal
              </Button>
              <Button 
                variant="outline"
                style={{ 
                  borderColor: secondaryColor,
                  color: secondaryColor,
                }}
                className="hover:opacity-90"
              >
                Botón Secundario
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRestoreDefaults}
            disabled={isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Predeterminados
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Nota:</strong> Los cambios de color solo son visibles para ti como propietario de la finca. 
            Todos los usuarios verán los mismos colores que configures aquí.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmCustomization;

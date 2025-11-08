import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFarmBranding } from '@/hooks/useFarmBranding';
import { Loader2, Palette, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FarmCustomization = () => {
  const { branding, isLoading, updateBranding } = useFarmBranding();
  const [primaryColor, setPrimaryColor] = useState(branding.theme_primary_color);
  const [secondaryColor, setSecondaryColor] = useState(branding.theme_secondary_color);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Sync colors when branding changes
  React.useEffect(() => {
    setPrimaryColor(branding.theme_primary_color);
    setSecondaryColor(branding.theme_secondary_color);
  }, [branding.theme_primary_color, branding.theme_secondary_color]);

  const handleSave = async () => {
    setIsSaving(true);
    
    const result = await updateBranding({
      theme_primary_color: primaryColor,
      theme_secondary_color: secondaryColor,
    });

    if (result.success) {
      toast({
        title: t('settings:customization.colorsUpdated'),
        description: t('settings:customization.colorsUpdatedDesc'),
      });
    } else {
      toast({
        title: t('common:error'),
        description: result.error || t('settings:messages.error'),
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
          <CardTitle>{t('settings:customization.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('settings:customization.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">{t('settings:customization.primaryColor')}</Label>
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
              {t('settings:customization.primaryUsage')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">{t('settings:customization.secondaryColor')}</Label>
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
              {t('settings:customization.secondaryUsage')}
            </p>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>{t('settings:customization.preview')}</Label>
          <Card 
            className="border-2 transition-colors"
            style={{ 
              borderColor: primaryColor,
              backgroundColor: `${primaryColor}10` 
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: primaryColor }}>
                {t('settings:customization.exampleCard')}
              </CardTitle>
              <CardDescription>
                {t('settings:customization.exampleDesc')}
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
                {t('settings:customization.primaryButton')}
              </Button>
              <Button 
                variant="outline"
                style={{ 
                  borderColor: secondaryColor,
                  color: secondaryColor,
                }}
                className="hover:opacity-90"
              >
                {t('settings:customization.secondaryButton')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('settings:customization.saveChanges')}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRestoreDefaults}
            disabled={isSaving}
            className="md:flex-none"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden md:inline md:ml-2">
              {t('settings:customization.restoreDefaults')}
            </span>
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>{t('settings:customization.note')}</strong> {t('settings:customization.noteText')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmCustomization;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AISettings = () => {
  const { t } = useTranslation('aiAssistant');
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<any>(null);

  const { data: aiSettings, isLoading } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('ai_settings')
          .insert({})
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings;
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (aiSettings) {
      setSettings(aiSettings);
    }
  }, [aiSettings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('ai_settings')
        .update(updates)
        .eq('id', settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      toast({
        title: 'Configuración guardada',
        description: 'Los ajustes de IA se han actualizado correctamente',
      });
    },
    onError: (error) => {
      console.error('Error updating AI settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!settings) return;
    
    const { id, created_at, updated_at, ...updates } = settings;
    updateMutation.mutate(updates);
  };

  if (isLoading || !settings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <CardDescription>
          Configura el asistente de IA para ayudar a los usuarios del rancho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="ai-provider">Proveedor de IA</Label>
          <Select
            value={settings.ai_provider}
            onValueChange={(value) => setSettings({ ...settings, ai_provider: value })}
          >
            <SelectTrigger id="ai-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lovable">Lovable AI (Recomendado)</SelectItem>
              <SelectItem value="openai-gpt4">OpenAI GPT-4</SelectItem>
              <SelectItem value="openai-gpt5">OpenAI GPT-5</SelectItem>
              <SelectItem value="gemini-flash">Google Gemini Flash</SelectItem>
              <SelectItem value="gemini-pro">Google Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Lovable AI está preconfigurado y es gratuito durante el período de prueba
          </p>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="system-prompt">Instrucciones del Sistema</Label>
          <Textarea
            id="system-prompt"
            value={settings.system_prompt}
            onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            rows={6}
            placeholder="Personaliza cómo debe comportarse el asistente..."
          />
          <p className="text-sm text-muted-foreground">
            Define la personalidad y conocimientos base del asistente
          </p>
        </div>

        {/* Context Access Toggles */}
        <div className="space-y-4">
          <Label>Acceso al Contexto</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animal-context">Información de Animales</Label>
                <p className="text-sm text-muted-foreground">
                  Permite acceso a datos de animales del rancho
                </p>
              </div>
              <Switch
                id="animal-context"
                checked={settings.enable_animal_context}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, enable_animal_context: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="breeding-context">Información de Reproducción</Label>
                <p className="text-sm text-muted-foreground">
                  Permite acceso a registros de reproducción
                </p>
              </div>
              <Switch
                id="breeding-context"
                checked={settings.enable_breeding_context}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, enable_breeding_context: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lots-context">Información de Lotes</Label>
                <p className="text-sm text-muted-foreground">
                  Permite acceso a datos de lotes y pastoreo
                </p>
              </div>
              <Switch
                id="lots-context"
                checked={settings.enable_lots_context}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, enable_lots_context: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weather-context">Información Meteorológica</Label>
                <p className="text-sm text-muted-foreground">
                  Permite acceso a datos meteorológicos y alertas climáticas
                </p>
              </div>
              <Switch
                id="weather-context"
                checked={settings.enable_weather_context ?? true}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, enable_weather_context: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <Select
            value={settings.language}
            onValueChange={(value) => setSettings({ ...settings, language: value })}
          >
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Usage Limit */}
        <div className="space-y-2">
          <Label htmlFor="usage-limit">Límite de Consultas por Usuario/Mes</Label>
          <Input
            id="usage-limit"
            type="number"
            min="1"
            max="1000"
            value={settings.usage_limit_per_user}
            onChange={(e) => 
              setSettings({ ...settings, usage_limit_per_user: parseInt(e.target.value) })
            }
          />
          <p className="text-sm text-muted-foreground">
            Número máximo de consultas de IA por usuario cada mes
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISettings;

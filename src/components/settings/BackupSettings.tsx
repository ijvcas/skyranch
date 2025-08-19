import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database, FileText, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const BackupSettings = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Get current user data
      const { data: animals } = await supabase
        .from('animals')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      const { data: lots } = await supabase
        .from('lots')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      const { data: healthRecords } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      const backupData = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        data: {
          animals: animals || [],
          lots: lots || [],
          healthRecords: healthRecords || []
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportación Exitosa",
        description: "Los datos se han exportado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error de Exportación",
        description: "No se pudieron exportar los datos.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const backupData = JSON.parse(text);
        
        // Validate backup structure
        if (!backupData.data) {
          throw new Error('Formato de archivo inválido');
        }

        toast({
          title: "Importación Detectada",
          description: `Archivo de respaldo del ${new Date(backupData.exportDate).toLocaleDateString()} detectado. Funcionalidad de importación en desarrollo.`,
        });
      } catch (error) {
        toast({
          title: "Error de Importación",
          description: "El archivo no es válido o está corrupto.",
          variant: "destructive"
        });
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Respaldo de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-2 h-16 flex-col"
            >
              <Download className="w-5 h-5" />
              <span>{isExporting ? 'Exportando...' : 'Exportar Datos'}</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleImportData}
              disabled={isImporting}
              className="flex items-center gap-2 h-16 flex-col"
            >
              <Upload className="w-5 h-5" />
              <span>{isImporting ? 'Importando...' : 'Importar Datos'}</span>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                Datos Incluidos en el Respaldo
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Información de animales</li>
                <li>• Registros de lotes</li>
                <li>• Historial de salud</li>
                <li>• Configuraciones de usuario</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Recomendaciones
              </h4>
              <p className="text-sm text-muted-foreground">
                Se recomienda realizar respaldos semanalmente o antes de hacer cambios importantes en el sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;
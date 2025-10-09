import React, { useState } from 'react';
import { Animal } from '@/stores/animalStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Database, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PedigreeDiagnosticsProps {
  animal: Animal;
}

const PedigreeDiagnostics: React.FC<PedigreeDiagnosticsProps> = ({ animal }) => {
  const [isTestingUpdate, setIsTestingUpdate] = useState(false);

  // Get field inspection data
  const getFieldInspection = () => {
    const fields = {
      gen0: { name: animal.name },
      gen1: {
        fatherId: animal.fatherId,
        motherId: animal.motherId,
      },
      gen2: {
        paternal_grandfather_id: animal.paternal_grandfather_id,
        paternal_grandmother_id: animal.paternal_grandmother_id,
        maternal_grandfather_id: animal.maternal_grandfather_id,
        maternal_grandmother_id: animal.maternal_grandmother_id,
      },
      gen3: {
        paternal_great_grandfather_paternal_id: animal.paternal_great_grandfather_paternal_id,
        paternal_great_grandmother_paternal_id: animal.paternal_great_grandmother_paternal_id,
        paternal_great_grandfather_maternal_id: animal.paternal_great_grandfather_maternal_id,
        paternal_great_grandmother_maternal_id: animal.paternal_great_grandmother_maternal_id,
        maternal_great_grandfather_paternal_id: animal.maternal_great_grandfather_paternal_id,
        maternal_great_grandmother_paternal_id: animal.maternal_great_grandmother_paternal_id,
        maternal_great_grandfather_maternal_id: animal.maternal_great_grandfather_maternal_id,
        maternal_great_grandmother_maternal_id: animal.maternal_great_grandmother_maternal_id,
      },
      gen4: {} as any,
      gen5: {} as any,
    };

    // Gen 4 fields
    const gen4Keys = [
      'gen4PaternalGgggfP', 'gen4PaternalGgggmP', 'gen4PaternalGggmfP', 'gen4PaternalGggmmP',
      'gen4PaternalGgfgfP', 'gen4PaternalGgfgmP', 'gen4PaternalGgmgfP', 'gen4PaternalGgmgmP',
      'gen4MaternalGgggfM', 'gen4MaternalGgggmM', 'gen4MaternalGggmfM', 'gen4MaternalGggmmM',
      'gen4MaternalGgfgfM', 'gen4MaternalGgfgmM', 'gen4MaternalGgmgfM', 'gen4MaternalGgmgmM',
    ];
    gen4Keys.forEach(key => {
      fields.gen4[key] = (animal as any)[key];
    });

    // Gen 5 fields
    for (let i = 1; i <= 16; i++) {
      fields.gen5[`gen5Paternal${i}`] = (animal as any)[`gen5Paternal${i}`];
      fields.gen5[`gen5Maternal${i}`] = (animal as any)[`gen5Maternal${i}`];
    }

    return fields;
  };

  const fieldInspection = getFieldInspection();

  // Count populated fields
  const countFields = (obj: any): { populated: number; total: number } => {
    const values = Object.values(obj);
    return {
      populated: values.filter(v => v !== null && v !== undefined && v !== '').length,
      total: values.length,
    };
  };

  const gen0Stats = countFields(fieldInspection.gen0);
  const gen1Stats = countFields(fieldInspection.gen1);
  const gen2Stats = countFields(fieldInspection.gen2);
  const gen3Stats = countFields(fieldInspection.gen3);
  const gen4Stats = countFields(fieldInspection.gen4);
  const gen5Stats = countFields(fieldInspection.gen5);

  // Fetch recent edge function logs
  const { data: recentLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['edge-function-logs', 'ai-chat'],
    queryFn: async () => {
      // This would need a backend function to fetch logs
      // For now, return empty array
      return [];
    },
    enabled: false, // Disabled by default, user can refetch
  });

  // Test update function
  const handleTestUpdate = async () => {
    setIsTestingUpdate(true);
    try {
      const mockPedigree = {
        animalName: animal.name,
        father: { name: 'TEST FATHER' },
        mother: { name: 'TEST MOTHER' },
        paternalGrandfather: 'TEST PGF',
        paternalGrandmother: 'TEST PGM',
        maternalGrandfather: 'TEST MGF',
        maternalGrandmother: 'TEST MGM',
      };

      const { data, error } = await supabase.functions.invoke('update-animal-pedigree', {
        body: {
          animalId: animal.id,
          pedigreeData: mockPedigree,
        },
      });

      if (error) throw error;

      toast({
        title: 'Test completado',
        description: data.success ? 'Actualización exitosa ✓' : `Error: ${data.error}`,
        variant: data.success ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error en test',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTestingUpdate(false);
    }
  };

  const FieldStatusIcon = ({ populated, total }: { populated: number; total: number }) => {
    if (populated === total) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (populated === 0) return <XCircle className="w-4 h-4 text-red-600" />;
    return <AlertCircle className="w-4 h-4 text-amber-600" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5" />
            Diagnóstico de Pedigrí
          </CardTitle>
          <Badge variant="outline">{animal.name}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields">Campos</TabsTrigger>
            <TabsTrigger value="actions">Acciones</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-4">
            {/* Generation summaries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FieldStatusIcon {...gen0Stats} />
                  <span className="font-medium">Gen 0 (Animal)</span>
                </div>
                <Badge variant={gen0Stats.populated === gen0Stats.total ? 'default' : 'secondary'}>
                  {gen0Stats.populated}/{gen0Stats.total}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FieldStatusIcon {...gen1Stats} />
                  <span className="font-medium">Gen 1 (Padres)</span>
                </div>
                <Badge variant={gen1Stats.populated === gen1Stats.total ? 'default' : 'secondary'}>
                  {gen1Stats.populated}/{gen1Stats.total}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FieldStatusIcon {...gen2Stats} />
                  <span className="font-medium">Gen 2 (Abuelos)</span>
                </div>
                <Badge variant={gen2Stats.populated === gen2Stats.total ? 'default' : 'secondary'}>
                  {gen2Stats.populated}/{gen2Stats.total}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FieldStatusIcon {...gen3Stats} />
                  <span className="font-medium">Gen 3 (Bisabuelos)</span>
                </div>
                <Badge variant={gen3Stats.populated === gen3Stats.total ? 'default' : 'secondary'}>
                  {gen3Stats.populated}/{gen3Stats.total}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FieldStatusIcon {...gen4Stats} />
                  <span className="font-medium">Gen 4 (16 campos)</span>
                </div>
                <Badge variant={gen4Stats.populated > 0 ? 'default' : 'outline'}>
                  {gen4Stats.populated}/{gen4Stats.total}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FieldStatusIcon {...gen5Stats} />
                  <span className="font-medium">Gen 5 (32 campos)</span>
                </div>
                <Badge variant={gen5Stats.populated > 0 ? 'default' : 'outline'}>
                  {gen5Stats.populated}/{gen5Stats.total}
                </Badge>
              </div>
            </div>

            {/* Total summary */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total de campos poblados</span>
                <Badge variant="default" className="text-base">
                  {gen0Stats.populated + gen1Stats.populated + gen2Stats.populated + 
                   gen3Stats.populated + gen4Stats.populated + gen5Stats.populated}/63
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={handleTestUpdate}
                disabled={isTestingUpdate}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isTestingUpdate ? 'animate-spin' : ''}`} />
                Test: Actualizar Pedigrí
              </Button>

              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 inline mr-2" />
                Este test intenta actualizar el pedigrí del animal con datos de prueba para verificar que la función
                <code className="mx-1 px-1 py-0.5 rounded bg-muted">update-animal-pedigree</code>
                funciona correctamente.
              </div>

              <div className="pt-4 space-y-2">
                <div className="text-sm font-medium">Información del sistema</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Animal ID: <code className="px-1 py-0.5 rounded bg-muted">{animal.id}</code></div>
                  <div>• Especie: {animal.species}</div>
                  <div>• Raza: {animal.breed || 'No especificada'}</div>
                  <div>• Última actualización: {animal.updatedAt ? new Date(animal.updatedAt).toLocaleString('es-ES') : 'N/A'}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PedigreeDiagnostics;

import React, { useState } from 'react';
import { Animal } from '@/stores/animalStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { toast } from 'sonner';

interface HorizontalPedigreeTreeProps {
  animal: Animal;
}

// Clean up UELN artifacts from names
const cleanName = (name: string | undefined | null): string => {
  if (!name) return '—';
  return name
    .replace(/Nº\s*UELN\s*\d+[A-Z]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Get pedigree completeness stats
const getPedigreeStats = (animal: Animal) => {
  const stats = {
    gen0: animal.name ? 1 : 0,
    gen1: [animal.fatherId, animal.motherId].filter(Boolean).length,
    gen2: [
      animal.paternal_grandfather_id,
      animal.paternal_grandmother_id,
      animal.maternal_grandfather_id,
      animal.maternal_grandmother_id,
    ].filter(Boolean).length,
    gen3: [
      animal.paternal_great_grandfather_paternal_id,
      animal.paternal_great_grandmother_paternal_id,
      animal.paternal_great_grandfather_maternal_id,
      animal.paternal_great_grandmother_maternal_id,
      animal.maternal_great_grandfather_paternal_id,
      animal.maternal_great_grandmother_paternal_id,
      animal.maternal_great_grandfather_maternal_id,
      animal.maternal_great_grandmother_maternal_id,
    ].filter(Boolean).length,
    gen4: 0,
    gen5: 0,
  };

  // Count gen4 fields (16 total)
  const gen4Fields = [
    'gen4PaternalGgggfP', 'gen4PaternalGgggmP', 'gen4PaternalGggmfP', 'gen4PaternalGggmmP',
    'gen4PaternalGgfgfP', 'gen4PaternalGgfgmP', 'gen4PaternalGgmgfP', 'gen4PaternalGgmgmP',
    'gen4MaternalGgggfM', 'gen4MaternalGgggmM', 'gen4MaternalGggmfM', 'gen4MaternalGggmmM',
    'gen4MaternalGgfgfM', 'gen4MaternalGgfgmM', 'gen4MaternalGgmgfM', 'gen4MaternalGgmgmM',
  ];
  
  gen4Fields.forEach(field => {
    if ((animal as any)[field]) stats.gen4++;
  });

  // Count gen5 fields (32 total)
  for (let i = 1; i <= 16; i++) {
    if ((animal as any)[`gen5Paternal${i}`]) stats.gen5++;
    if ((animal as any)[`gen5Maternal${i}`]) stats.gen5++;
  }

  return stats;
};

const AncestorBox: React.FC<{
  name: string | undefined | null;
  label: string;
  gender?: 'male' | 'female';
  generation: number;
}> = ({ name, label, gender, generation }) => {
  const cleanedName = cleanName(name);
  const isEmpty = cleanedName === '—';
  
  return (
    <div className={`
      flex flex-col items-center justify-center p-2 rounded border text-center min-w-[120px]
      ${isEmpty ? 'border-dashed border-muted bg-muted/20' : 'border-border bg-card'}
      ${gender === 'male' ? 'border-l-4 border-l-blue-500' : ''}
      ${gender === 'female' ? 'border-l-4 border-l-pink-500' : ''}
    `}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`font-medium text-xs ${isEmpty ? 'text-muted-foreground italic' : 'text-foreground'}`}>
        {cleanedName}
      </div>
    </div>
  );
};

const HorizontalPedigreeTree: React.FC<HorizontalPedigreeTreeProps> = ({ animal }) => {
  const [uploading, setUploading] = useState(false);
  const { sendMessage } = useAIChat();
  
  const stats = getPedigreeStats(animal);
  const totalKnown = stats.gen0 + stats.gen1 + stats.gen2 + stats.gen3 + stats.gen4 + stats.gen5;
  const totalPossible = 1 + 2 + 4 + 8 + 16 + 32; // 63 total ancestors
  const completeness = Math.round((totalKnown / totalPossible) * 100);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await sendMessage(
        `Aquí está el pedigrí de 5 generaciones de ${animal.name}. Extrae toda la información y actualiza automáticamente su ficha.`,
        file
      );
      toast.success('Pedigrí procesado correctamente. Recargando página...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Error al procesar el pedigrí');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Árbol Genealógico (5 Generaciones)</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={completeness > 80 ? 'default' : completeness > 50 ? 'secondary' : 'outline'}>
              {completeness}% completo
            </Badge>
            {stats.gen4 + stats.gen5 === 0 && (
              <Badge variant="outline" className="gap-1">
                <Upload className="w-3 h-3" />
                Sube pedigrí para Gen 4-5
              </Badge>
            )}
          </div>
        </div>
        
        {/* Generation summary */}
        <div className="flex gap-2 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <span>Gen 0-1: {stats.gen0 + stats.gen1}/3</span>
          </div>
          <div className="flex items-center gap-1">
            {stats.gen2 === 4 ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-amber-600" />
            )}
            <span>Gen 2: {stats.gen2}/4</span>
          </div>
          <div className="flex items-center gap-1">
            {stats.gen3 === 8 ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-amber-600" />
            )}
            <span>Gen 3: {stats.gen3}/8</span>
          </div>
          <div className="flex items-center gap-1">
            {stats.gen4 > 0 ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-muted-foreground" />
            )}
            <span>Gen 4: {stats.gen4}/16</span>
          </div>
          <div className="flex items-center gap-1">
            {stats.gen5 > 0 ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-muted-foreground" />
            )}
            <span>Gen 5: {stats.gen5}/32</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {/* Current Animal - Generation 0 */}
            <div className="flex flex-col justify-center">
              <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center min-w-[150px] shadow-lg">
                <div className="text-sm font-semibold mb-1">Gen 0</div>
                <div className="font-bold text-base">{cleanName(animal.name)}</div>
                <div className="text-xs opacity-90 mt-1">
                  {animal.gender === 'male' ? '♂ Macho' : animal.gender === 'female' ? '♀ Hembra' : ''}
                </div>
              </div>
            </div>

            {/* Parents - Generation 1 */}
            <div className="flex flex-col gap-2 justify-center">
              <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 1 - Padres</div>
              <AncestorBox name={animal.fatherId} label="Padre" gender="male" generation={1} />
              <AncestorBox name={animal.motherId} label="Madre" gender="female" generation={1} />
            </div>

            {/* Grandparents - Generation 2 */}
            <div className="flex flex-col gap-2 justify-center">
              <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 2 - Abuelos</div>
              <AncestorBox name={animal.paternal_grandfather_id} label="Abuelo P" gender="male" generation={2} />
              <AncestorBox name={animal.paternal_grandmother_id} label="Abuela P" gender="female" generation={2} />
              <AncestorBox name={animal.maternal_grandfather_id} label="Abuelo M" gender="male" generation={2} />
              <AncestorBox name={animal.maternal_grandmother_id} label="Abuela M" gender="female" generation={2} />
            </div>

            {/* Great-Grandparents - Generation 3 */}
            <div className="flex flex-col gap-2 justify-center">
              <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 3 - Bisabuelos</div>
              <AncestorBox name={animal.paternal_great_grandfather_paternal_id} label="Bisabuelo PP" gender="male" generation={3} />
              <AncestorBox name={animal.paternal_great_grandmother_paternal_id} label="Bisabuela PP" gender="female" generation={3} />
              <AncestorBox name={animal.paternal_great_grandfather_maternal_id} label="Bisabuelo PM" gender="male" generation={3} />
              <AncestorBox name={animal.paternal_great_grandmother_maternal_id} label="Bisabuela PM" gender="female" generation={3} />
              <AncestorBox name={animal.maternal_great_grandfather_paternal_id} label="Bisabuelo MP" gender="male" generation={3} />
              <AncestorBox name={animal.maternal_great_grandmother_paternal_id} label="Bisabuela MP" gender="female" generation={3} />
              <AncestorBox name={animal.maternal_great_grandfather_maternal_id} label="Bisabuelo MM" gender="male" generation={3} />
              <AncestorBox name={animal.maternal_great_grandmother_maternal_id} label="Bisabuela MM" gender="female" generation={3} />
            </div>

            {/* Generation 4-5 placeholder */}
            {stats.gen4 + stats.gen5 === 0 && (
              <>
                <label htmlFor="pedigree-upload-view" className="cursor-pointer">
                  <div className="flex items-center justify-center px-8 py-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="text-center">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                      )}
                      <div className="text-sm font-medium text-foreground">
                        Generaciones 4 y 5
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {uploading ? 'Procesando...' : 'Sube un documento de pedigrí para completar'}
                      </div>
                    </div>
                  </div>
                </label>
                <input
                  id="pedigree-upload-view"
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-l-4 border-l-blue-500 bg-card"></div>
              <span>Macho (♂)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-l-4 border-l-pink-500 bg-card"></div>
              <span>Hembra (♀)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-dashed border bg-muted/20"></div>
              <span>Sin información</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HorizontalPedigreeTree;

import React, { useState } from 'react';
import { Animal } from '@/stores/animalStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAnimalNames } from '@/hooks/useAnimalNames';

interface HorizontalPedigreeTreeProps {
  animal: Animal;
}

// Get species-specific color for Gen 0 bubble with reduced opacity
const getSpeciesColor = (species: string | undefined) => {
  const colorMap: Record<string, string> = {
    'equino': 'bg-blue-500/30 text-blue-900 border-2 border-blue-500/50',
    'bovino': 'bg-yellow-500/30 text-yellow-900 border-2 border-yellow-600/50',
    'ovino': 'bg-purple-500/30 text-purple-900 border-2 border-purple-500/50',
    'caprino': 'bg-red-500/30 text-red-900 border-2 border-red-500/50',
    'porcino': 'bg-pink-500/30 text-pink-900 border-2 border-pink-500/50',
    'aviar': 'bg-orange-500/30 text-orange-900 border-2 border-orange-600/50',
    'canino': 'bg-indigo-500/30 text-indigo-900 border-2 border-indigo-500/50'
  };
  return colorMap[species?.toLowerCase() || ''] || 'bg-gray-500/30 text-gray-900 border-2 border-gray-500/50';
};

// Clean up UELN artifacts from names but keep registration numbers
const cleanName = (name: string | undefined | null): string => {
  if (!name) return '—';
  
  // Remove UELN prefix
  let cleaned = name.replace(/UELN\s*\d+[A-Z]/g, '').trim();
  
  // If the name contains a comma followed by a year (e.g., "OBERON BDP, 1980"), keep everything
  // This preserves registration numbers with years
  
  // If empty after cleaning, return dash
  if (!cleaned) return '—';
  
  return cleaned;
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
    'gen4_paternal_ggggf_p', 'gen4_paternal_ggggm_p', 'gen4_paternal_gggmf_p', 'gen4_paternal_gggmm_p',
    'gen4_paternal_ggfgf_p', 'gen4_paternal_ggfgm_p', 'gen4_paternal_ggmgf_p', 'gen4_paternal_ggmgm_p',
    'gen4_maternal_ggggf_m', 'gen4_maternal_ggggm_m', 'gen4_maternal_gggmf_m', 'gen4_maternal_gggmm_m',
    'gen4_maternal_ggfgf_m', 'gen4_maternal_ggfgm_m', 'gen4_maternal_ggmgf_m', 'gen4_maternal_ggmgm_m',
  ];
  
  gen4Fields.forEach(field => {
    if ((animal as any)[field]) stats.gen4++;
  });

  // Count gen5 fields (32 total)
  for (let i = 1; i <= 16; i++) {
    if ((animal as any)[`gen5_paternal_${i}`]) stats.gen5++;
    if ((animal as any)[`gen5_maternal_${i}`]) stats.gen5++;
  }

  return stats;
};

const AncestorBox: React.FC<{
  name: string | undefined | null;
  label: string;
  gender?: 'male' | 'female';
  generation: number;
  getDisplayName?: (id: string | undefined) => string | null;
}> = ({ name, label, gender, generation, getDisplayName }) => {
  // Use getDisplayName if provided, otherwise use cleanName
  const displayName = getDisplayName ? getDisplayName(name || undefined) : cleanName(name);
  const isEmpty = !displayName || displayName === '—';
  
  // Split name into lines: first line is the main name, rest are details (UELN, etc.)
  const lines = displayName ? displayName.split(/(?:UELN\s*:\s*|#)/g).filter(Boolean) : [];
  const mainName = lines[0]?.trim() || displayName;
  const details = lines.slice(1).map((detail, i) => (
    <div key={i} className="text-[10px] text-muted-foreground leading-tight">
      {i === 0 ? '#' : ''}UELN {detail.trim()}
    </div>
  ));
  
  return (
    <div className={`
      flex flex-col items-center justify-center p-2 rounded border text-center min-w-[120px]
      ${isEmpty ? 'border-dashed border-muted bg-muted/20' : 'border-border bg-card'}
      ${gender === 'male' ? 'border-l-4 border-l-blue-500' : ''}
      ${gender === 'female' ? 'border-l-4 border-l-pink-500' : ''}
    `}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`font-medium text-xs leading-tight ${isEmpty ? 'text-muted-foreground italic' : 'text-foreground'}`}>
        {isEmpty ? '—' : mainName}
      </div>
      {!isEmpty && details.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {details}
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-1">
        {gender === 'male' ? '♂' : gender === 'female' ? '♀' : ''}
      </div>
    </div>
  );
};

const HorizontalPedigreeTree: React.FC<HorizontalPedigreeTreeProps> = ({ animal }) => {
  const { getDisplayName } = useAnimalNames();
  const maxGeneration = animal.pedigree_max_generation ? parseInt(animal.pedigree_max_generation.toString()) : 5;
  
  const stats = getPedigreeStats(animal);
  
  // Calculate total possible ancestors based on maxGeneration
  const getPossibleAncestors = (maxGen: number) => {
    let total = 1; // Gen 0
    for (let i = 1; i <= maxGen; i++) {
      total += Math.pow(2, i);
    }
    return total;
  };
  
  const totalPossible = getPossibleAncestors(maxGeneration);
  
  // Only count stats up to maxGeneration
  const getKnownCount = () => {
    let count = stats.gen0;
    if (maxGeneration >= 1) count += stats.gen1;
    if (maxGeneration >= 2) count += stats.gen2;
    if (maxGeneration >= 3) count += stats.gen3;
    if (maxGeneration >= 4) count += stats.gen4;
    if (maxGeneration >= 5) count += stats.gen5;
    return count;
  };
  
  const totalKnown = getKnownCount();
  const completeness = Math.round((totalKnown / totalPossible) * 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Árbol Genealógico ({maxGeneration} {maxGeneration === 1 ? 'Generación' : 'Generaciones'})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={completeness > 80 ? 'default' : completeness > 50 ? 'secondary' : 'outline'}>
              {completeness}% completo
            </Badge>
          </div>
        </div>
        
        {/* Generation summary - only show relevant generations */}
        <div className="flex gap-2 mt-2 text-xs">
          {maxGeneration >= 1 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span>Gen 0-1: {stats.gen0 + stats.gen1}/3</span>
            </div>
          )}
          {maxGeneration >= 2 && (
            <div className="flex items-center gap-1">
              {stats.gen2 === 4 ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-600" />
              )}
              <span>Gen 2: {stats.gen2}/4</span>
            </div>
          )}
          {maxGeneration >= 3 && (
            <div className="flex items-center gap-1">
              {stats.gen3 === 8 ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-600" />
              )}
              <span>Gen 3: {stats.gen3}/8</span>
            </div>
          )}
          {maxGeneration >= 4 && (
            <div className="flex items-center gap-1">
              {stats.gen4 > 0 ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-muted-foreground" />
              )}
              <span>Gen 4: {stats.gen4}/16</span>
            </div>
          )}
          {maxGeneration >= 5 && (
            <div className="flex items-center gap-1">
              {stats.gen5 > 0 ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-muted-foreground" />
              )}
              <span>Gen 5: {stats.gen5}/32</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {/* Current Animal - Generation 0 */}
            <div className="flex flex-col justify-center">
              <div className={`p-4 rounded-lg text-center min-w-[150px] shadow-lg ${getSpeciesColor(animal.species)}`}>
                <div className="text-sm font-semibold mb-1">Gen 0</div>
                <div className="font-bold text-base">{animal.name}</div>
                <div className="text-xs opacity-75 mt-1">#{animal.tag}</div>
                <div className="text-xs opacity-90 mt-1">
                  {animal.gender === 'male' ? '♂ Macho' : animal.gender === 'female' ? '♀ Hembra' : ''}
                </div>
              </div>
            </div>

            {/* Parents - Generation 1 */}
            {maxGeneration >= 1 && (
              <div className="flex flex-col gap-2 justify-center">
                <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 1 - Padres</div>
                <AncestorBox name={animal.fatherId} label="Padre" gender="male" generation={1} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.motherId} label="Madre" gender="female" generation={1} getDisplayName={getDisplayName} />
              </div>
            )}

            {/* Grandparents - Generation 2 */}
            {maxGeneration >= 2 && (
              <div className="flex flex-col gap-2 justify-center">
                <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 2 - Abuelos</div>
                <AncestorBox name={animal.paternal_grandfather_id} label="Abuelo P" gender="male" generation={2} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.paternal_grandmother_id} label="Abuela P" gender="female" generation={2} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.maternal_grandfather_id} label="Abuelo M" gender="male" generation={2} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.maternal_grandmother_id} label="Abuela M" gender="female" generation={2} getDisplayName={getDisplayName} />
              </div>
            )}

            {/* Great-Grandparents - Generation 3 */}
            {maxGeneration >= 3 && (
              <div className="flex flex-col gap-2 justify-center">
                <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 3 - Bisabuelos</div>
                <AncestorBox name={animal.paternal_great_grandfather_paternal_id} label="Bisabuelo PP" gender="male" generation={3} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.paternal_great_grandmother_paternal_id} label="Bisabuela PP" gender="female" generation={3} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.paternal_great_grandfather_maternal_id} label="Bisabuelo PM" gender="male" generation={3} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.paternal_great_grandmother_maternal_id} label="Bisabuela PM" gender="female" generation={3} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.maternal_great_grandfather_paternal_id} label="Bisabuelo MP" gender="male" generation={3} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.maternal_great_grandmother_paternal_id} label="Bisabuela MP" gender="female" generation={3} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.maternal_great_grandfather_maternal_id} label="Bisabuelo MM" gender="male" generation={3} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.maternal_great_grandmother_maternal_id} label="Bisabuela MM" gender="female" generation={3} getDisplayName={getDisplayName} />
              </div>
            )}

            {/* Generation 4 - Great-Great-Grandparents */}
            {maxGeneration >= 4 && (
              <div className="flex flex-col gap-1 justify-center">
                <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 4</div>
                {/* Paternal side */}
                <AncestorBox name={animal.gen4_paternal_ggggf_p} label="GGGGF P" gender="male" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_paternal_ggggm_p} label="GGGGM P" gender="female" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_paternal_gggmf_p} label="GGGMF P" gender="male" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_paternal_gggmm_p} label="GGGMM P" gender="female" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_paternal_ggfgf_p} label="GGFGF P" gender="male" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_paternal_ggfgm_p} label="GGFGM P" gender="female" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_paternal_ggmgf_p} label="GGMGF P" gender="male" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_paternal_ggmgm_p} label="GGMGM P" gender="female" generation={4} getDisplayName={getDisplayName} />
                {/* Maternal side */}
                <AncestorBox name={animal.gen4_maternal_ggggf_m} label="GGGGF M" gender="male" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_maternal_ggggm_m} label="GGGGM M" gender="female" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_maternal_gggmf_m} label="GGGMF M" gender="male" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_maternal_gggmm_m} label="GGGMM M" gender="female" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_maternal_ggfgf_m} label="GGFGF M" gender="male" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_maternal_ggfgm_m} label="GGFGM M" gender="female" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_maternal_ggmgf_m} label="GGMGF M" gender="male" generation={4} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen4_maternal_ggmgm_m} label="GGMGM M" gender="female" generation={4} getDisplayName={getDisplayName} />
              </div>
            )}

            {/* Generation 5 */}
            {maxGeneration >= 5 && (
              <div className="flex flex-col gap-0.5 justify-center">
                <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 5</div>
                <AncestorBox name={animal.gen5_paternal_1} label="G5-P1" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_2} label="G5-P2" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_3} label="G5-P3" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_4} label="G5-P4" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_5} label="G5-P5" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_6} label="G5-P6" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_7} label="G5-P7" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_8} label="G5-P8" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_9} label="G5-P9" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_10} label="G5-P10" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_11} label="G5-P11" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_12} label="G5-P12" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_13} label="G5-P13" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_14} label="G5-P14" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_15} label="G5-P15" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_paternal_16} label="G5-P16" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_1} label="G5-M1" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_2} label="G5-M2" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_3} label="G5-M3" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_4} label="G5-M4" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_5} label="G5-M5" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_6} label="G5-M6" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_7} label="G5-M7" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_8} label="G5-M8" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_9} label="G5-M9" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_10} label="G5-M10" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_11} label="G5-M11" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_12} label="G5-M12" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_13} label="G5-M13" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_14} label="G5-M14" gender="female" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_15} label="G5-M15" gender="male" generation={5} getDisplayName={getDisplayName} />
                <AncestorBox name={animal.gen5_maternal_16} label="G5-M16" gender="female" generation={5} getDisplayName={getDisplayName} />
              </div>
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

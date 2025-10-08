import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Animal } from '@/stores/animalStore';

interface HorizontalPedigreeTreeProps {
  animal: Animal;
}

const HorizontalPedigreeTree: React.FC<HorizontalPedigreeTreeProps> = ({ animal }) => {
  // Helper to clean names by removing "Nº UELN" artifacts
  const cleanName = (name: string | undefined): string => {
    if (!name) return '';
    return name.replace(/\s*Nº\s*UELN.*$/i, '').trim();
  };

  // Helper to render an ancestor box
  const AncestorBox = ({ 
    name, 
    label, 
    gender 
  }: { 
    name: string | undefined; 
    label: string; 
    gender?: 'male' | 'female' 
  }) => {
    const cleanedName = cleanName(name);
    const isEmpty = !cleanedName;
    
    return (
      <div 
        className={`
          border rounded p-2 text-xs transition-all
          ${isEmpty 
            ? 'bg-muted/30 border-muted text-muted-foreground' 
            : gender === 'male' 
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
              : gender === 'female'
                ? 'bg-pink-50 border-pink-200 hover:bg-pink-100'
                : 'bg-background border-border hover:bg-muted/50'
          }
        `}
        title={name || 'Desconocido'}
      >
        <div className="font-medium truncate">
          {isEmpty ? '—' : cleanedName}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {label}
        </div>
      </div>
    );
  };

  // Generation 5 (32 ancestors)
  const gen5 = [
    // Paternal line (16)
    { name: animal.gen5_paternal_1, label: 'P1' },
    { name: animal.gen5_paternal_2, label: 'P2' },
    { name: animal.gen5_paternal_3, label: 'P3' },
    { name: animal.gen5_paternal_4, label: 'P4' },
    { name: animal.gen5_paternal_5, label: 'P5' },
    { name: animal.gen5_paternal_6, label: 'P6' },
    { name: animal.gen5_paternal_7, label: 'P7' },
    { name: animal.gen5_paternal_8, label: 'P8' },
    { name: animal.gen5_paternal_9, label: 'P9' },
    { name: animal.gen5_paternal_10, label: 'P10' },
    { name: animal.gen5_paternal_11, label: 'P11' },
    { name: animal.gen5_paternal_12, label: 'P12' },
    { name: animal.gen5_paternal_13, label: 'P13' },
    { name: animal.gen5_paternal_14, label: 'P14' },
    { name: animal.gen5_paternal_15, label: 'P15' },
    { name: animal.gen5_paternal_16, label: 'P16' },
    // Maternal line (16)
    { name: animal.gen5_maternal_1, label: 'M1' },
    { name: animal.gen5_maternal_2, label: 'M2' },
    { name: animal.gen5_maternal_3, label: 'M3' },
    { name: animal.gen5_maternal_4, label: 'M4' },
    { name: animal.gen5_maternal_5, label: 'M5' },
    { name: animal.gen5_maternal_6, label: 'M6' },
    { name: animal.gen5_maternal_7, label: 'M7' },
    { name: animal.gen5_maternal_8, label: 'M8' },
    { name: animal.gen5_maternal_9, label: 'M9' },
    { name: animal.gen5_maternal_10, label: 'M10' },
    { name: animal.gen5_maternal_11, label: 'M11' },
    { name: animal.gen5_maternal_12, label: 'M12' },
    { name: animal.gen5_maternal_13, label: 'M13' },
    { name: animal.gen5_maternal_14, label: 'M14' },
    { name: animal.gen5_maternal_15, label: 'M15' },
    { name: animal.gen5_maternal_16, label: 'M16' },
  ];

  // Generation 4 (16 ancestors)
  const gen4 = [
    // Paternal line (8)
    { name: animal.gen4_paternal_ggggf_p, label: 'GGGGF-P', gender: 'male' as const },
    { name: animal.gen4_paternal_ggggm_p, label: 'GGGGM-P', gender: 'female' as const },
    { name: animal.gen4_paternal_gggmf_p, label: 'GGGMF-P', gender: 'male' as const },
    { name: animal.gen4_paternal_gggmm_p, label: 'GGGMM-P', gender: 'female' as const },
    { name: animal.gen4_paternal_ggfgf_p, label: 'GGFGF-P', gender: 'male' as const },
    { name: animal.gen4_paternal_ggfgm_p, label: 'GGFGM-P', gender: 'female' as const },
    { name: animal.gen4_paternal_ggmgf_p, label: 'GGMGF-P', gender: 'male' as const },
    { name: animal.gen4_paternal_ggmgm_p, label: 'GGMGM-P', gender: 'female' as const },
    // Maternal line (8)
    { name: animal.gen4_maternal_ggggf_m, label: 'GGGGF-M', gender: 'male' as const },
    { name: animal.gen4_maternal_ggggm_m, label: 'GGGGM-M', gender: 'female' as const },
    { name: animal.gen4_maternal_gggmf_m, label: 'GGGMF-M', gender: 'male' as const },
    { name: animal.gen4_maternal_gggmm_m, label: 'GGGMM-M', gender: 'female' as const },
    { name: animal.gen4_maternal_ggfgf_m, label: 'GGFGF-M', gender: 'male' as const },
    { name: animal.gen4_maternal_ggfgm_m, label: 'GGFGM-M', gender: 'female' as const },
    { name: animal.gen4_maternal_ggmgf_m, label: 'GGMGF-M', gender: 'male' as const },
    { name: animal.gen4_maternal_ggmgm_m, label: 'GGMGM-M', gender: 'female' as const },
  ];

  // Generation 3 (8 great-grandparents)
  const gen3 = [
    { name: animal.paternal_great_grandfather_paternal_id, label: 'Bisabuelo PP', gender: 'male' as const },
    { name: animal.paternal_great_grandmother_paternal_id, label: 'Bisabuela PP', gender: 'female' as const },
    { name: animal.paternal_great_grandfather_maternal_id, label: 'Bisabuelo PM', gender: 'male' as const },
    { name: animal.paternal_great_grandmother_maternal_id, label: 'Bisabuela PM', gender: 'female' as const },
    { name: animal.maternal_great_grandfather_paternal_id, label: 'Bisabuelo MP', gender: 'male' as const },
    { name: animal.maternal_great_grandmother_paternal_id, label: 'Bisabuela MP', gender: 'female' as const },
    { name: animal.maternal_great_grandfather_maternal_id, label: 'Bisabuelo MM', gender: 'male' as const },
    { name: animal.maternal_great_grandmother_maternal_id, label: 'Bisabuela MM', gender: 'female' as const },
  ];

  // Generation 2 (4 grandparents)
  const gen2 = [
    { name: animal.paternal_grandfather_id, label: 'Abuelo Paterno', gender: 'male' as const },
    { name: animal.paternal_grandmother_id, label: 'Abuela Paterna', gender: 'female' as const },
    { name: animal.maternal_grandfather_id, label: 'Abuelo Materno', gender: 'male' as const },
    { name: animal.maternal_grandmother_id, label: 'Abuela Materna', gender: 'female' as const },
  ];

  // Generation 1 (2 parents)
  const gen1 = [
    { name: animal.fatherId, label: 'Padre', gender: 'male' as const },
    { name: animal.motherId, label: 'Madre', gender: 'female' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Árbol Genealógico (5 Generaciones)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-2 min-w-max">
            {/* Current Animal (Gen 0) */}
            <div className="flex items-center justify-center min-w-[140px]">
              <Card className="shadow-md border-2 border-primary">
                <CardContent className="p-3">
                  <div className="text-center">
                    <Badge variant="default" className="mb-2 text-[10px]">Animal</Badge>
                    <div className="font-bold text-sm">{animal.name}</div>
                    <div className="text-xs text-muted-foreground">#{animal.tag}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connection Line */}
            <div className="flex items-center">
              <div className="w-6 h-0.5 bg-border"></div>
            </div>

            {/* Generation 1 (Parents) */}
            <div className="flex flex-col justify-center gap-16 min-w-[120px]">
              {gen1.map((ancestor, idx) => (
                <AncestorBox key={idx} {...ancestor} />
              ))}
            </div>

            {/* Connection Line */}
            <div className="flex items-center">
              <div className="w-6 h-0.5 bg-border"></div>
            </div>

            {/* Generation 2 (Grandparents) */}
            <div className="flex flex-col justify-center gap-6 min-w-[120px]">
              {gen2.map((ancestor, idx) => (
                <AncestorBox key={idx} {...ancestor} />
              ))}
            </div>

            {/* Connection Line */}
            <div className="flex items-center">
              <div className="w-6 h-0.5 bg-border"></div>
            </div>

            {/* Generation 3 (Great-Grandparents) */}
            <div className="flex flex-col justify-center gap-2 min-w-[120px]">
              {gen3.map((ancestor, idx) => (
                <AncestorBox key={idx} {...ancestor} />
              ))}
            </div>

            {/* Connection Line */}
            <div className="flex items-center">
              <div className="w-6 h-0.5 bg-border"></div>
            </div>

            {/* Generation 4 (Great-Great-Grandparents) */}
            <div className="flex flex-col justify-center gap-1 min-w-[110px]">
              {gen4.map((ancestor, idx) => (
                <AncestorBox key={idx} {...ancestor} />
              ))}
            </div>

            {/* Connection Line */}
            <div className="flex items-center">
              <div className="w-6 h-0.5 bg-border"></div>
            </div>

            {/* Generation 5 (5th Generation) */}
            <div className="flex flex-col justify-center gap-0.5 min-w-[100px]">
              {gen5.map((ancestor, idx) => (
                <AncestorBox key={idx} name={ancestor.name} label={ancestor.label} />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Leyenda:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex gap-4">
              <span className="inline-block w-4 h-4 bg-blue-100 border border-blue-200 rounded"></span>
              <span>Línea Paterna (Machos)</span>
            </div>
            <div className="flex gap-4">
              <span className="inline-block w-4 h-4 bg-pink-100 border border-pink-200 rounded"></span>
              <span>Línea Materna (Hembras)</span>
            </div>
            <div><strong>P:</strong> Paternal, <strong>M:</strong> Maternal</div>
            <div><strong>GG:</strong> Great-Great (Tatarabuelo), <strong>GGG:</strong> 4ta Gen, <strong>GGGG:</strong> 5ta Gen</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HorizontalPedigreeTree;

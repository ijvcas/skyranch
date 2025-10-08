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
    { name: animal.gen5Paternal1, label: 'P1' },
    { name: animal.gen5Paternal2, label: 'P2' },
    { name: animal.gen5Paternal3, label: 'P3' },
    { name: animal.gen5Paternal4, label: 'P4' },
    { name: animal.gen5Paternal5, label: 'P5' },
    { name: animal.gen5Paternal6, label: 'P6' },
    { name: animal.gen5Paternal7, label: 'P7' },
    { name: animal.gen5Paternal8, label: 'P8' },
    { name: animal.gen5Paternal9, label: 'P9' },
    { name: animal.gen5Paternal10, label: 'P10' },
    { name: animal.gen5Paternal11, label: 'P11' },
    { name: animal.gen5Paternal12, label: 'P12' },
    { name: animal.gen5Paternal13, label: 'P13' },
    { name: animal.gen5Paternal14, label: 'P14' },
    { name: animal.gen5Paternal15, label: 'P15' },
    { name: animal.gen5Paternal16, label: 'P16' },
    // Maternal line (16)
    { name: animal.gen5Maternal1, label: 'M1' },
    { name: animal.gen5Maternal2, label: 'M2' },
    { name: animal.gen5Maternal3, label: 'M3' },
    { name: animal.gen5Maternal4, label: 'M4' },
    { name: animal.gen5Maternal5, label: 'M5' },
    { name: animal.gen5Maternal6, label: 'M6' },
    { name: animal.gen5Maternal7, label: 'M7' },
    { name: animal.gen5Maternal8, label: 'M8' },
    { name: animal.gen5Maternal9, label: 'M9' },
    { name: animal.gen5Maternal10, label: 'M10' },
    { name: animal.gen5Maternal11, label: 'M11' },
    { name: animal.gen5Maternal12, label: 'M12' },
    { name: animal.gen5Maternal13, label: 'M13' },
    { name: animal.gen5Maternal14, label: 'M14' },
    { name: animal.gen5Maternal15, label: 'M15' },
    { name: animal.gen5Maternal16, label: 'M16' },
  ];

  // Generation 4 (16 ancestors)
  const gen4 = [
    // Paternal line (8)
    { name: animal.gen4PaternalGgggfP, label: 'GGGGF-P', gender: 'male' as const },
    { name: animal.gen4PaternalGgggmP, label: 'GGGGM-P', gender: 'female' as const },
    { name: animal.gen4PaternalGggmfP, label: 'GGGMF-P', gender: 'male' as const },
    { name: animal.gen4PaternalGggmmP, label: 'GGGMM-P', gender: 'female' as const },
    { name: animal.gen4PaternalGgfgfP, label: 'GGFGF-P', gender: 'male' as const },
    { name: animal.gen4PaternalGgfgmP, label: 'GGFGM-P', gender: 'female' as const },
    { name: animal.gen4PaternalGgmgfP, label: 'GGMGF-P', gender: 'male' as const },
    { name: animal.gen4PaternalGgmgmP, label: 'GGMGM-P', gender: 'female' as const },
    // Maternal line (8)
    { name: animal.gen4MaternalGgggfM, label: 'GGGGF-M', gender: 'male' as const },
    { name: animal.gen4MaternalGgggmM, label: 'GGGGM-M', gender: 'female' as const },
    { name: animal.gen4MaternalGggmfM, label: 'GGGMF-M', gender: 'male' as const },
    { name: animal.gen4MaternalGggmmM, label: 'GGGMM-M', gender: 'female' as const },
    { name: animal.gen4MaternalGgfgfM, label: 'GGFGF-M', gender: 'male' as const },
    { name: animal.gen4MaternalGgfgmM, label: 'GGFGM-M', gender: 'female' as const },
    { name: animal.gen4MaternalGgmgfM, label: 'GGMGF-M', gender: 'male' as const },
    { name: animal.gen4MaternalGgmgmM, label: 'GGMGM-M', gender: 'female' as const },
  ];

  // Generation 3 (8 great-grandparents)
  const gen3 = [
    { name: animal.paternalGreatGrandfatherPaternalId, label: 'Bisabuelo PP', gender: 'male' as const },
    { name: animal.paternalGreatGrandmotherPaternalId, label: 'Bisabuela PP', gender: 'female' as const },
    { name: animal.paternalGreatGrandfatherMaternalId, label: 'Bisabuelo PM', gender: 'male' as const },
    { name: animal.paternalGreatGrandmotherMaternalId, label: 'Bisabuela PM', gender: 'female' as const },
    { name: animal.maternalGreatGrandfatherPaternalId, label: 'Bisabuelo MP', gender: 'male' as const },
    { name: animal.maternalGreatGrandmotherPaternalId, label: 'Bisabuela MP', gender: 'female' as const },
    { name: animal.maternalGreatGrandfatherMaternalId, label: 'Bisabuelo MM', gender: 'male' as const },
    { name: animal.maternalGreatGrandmotherMaternalId, label: 'Bisabuela MM', gender: 'female' as const },
  ];

  // Generation 2 (4 grandparents)
  const gen2 = [
    { name: animal.paternalGrandfatherId, label: 'Abuelo Paterno', gender: 'male' as const },
    { name: animal.paternalGrandmotherId, label: 'Abuela Paterna', gender: 'female' as const },
    { name: animal.maternalGrandfatherId, label: 'Abuelo Materno', gender: 'male' as const },
    { name: animal.maternalGrandmotherId, label: 'Abuela Materna', gender: 'female' as const },
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

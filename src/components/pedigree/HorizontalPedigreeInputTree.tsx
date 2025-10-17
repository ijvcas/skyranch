import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface HorizontalPedigreeInputTreeProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
  animalName?: string;
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

const AncestorInputBox: React.FC<{
  field: string;
  value: string;
  label: string;
  gender?: 'male' | 'female';
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
}> = ({ field, value, label, gender, onChange, disabled }) => {
  return (
    <div className={`
      flex flex-col items-center justify-center p-2 rounded border min-w-[120px]
      ${gender === 'male' ? 'border-l-4 border-l-blue-500' : ''}
      ${gender === 'female' ? 'border-l-4 border-l-pink-500' : ''}
      bg-card border-border
    `}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <Input
        value={value || ''}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder="—"
        className="h-7 text-xs text-center"
        disabled={disabled}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
      />
    </div>
  );
};

const HorizontalPedigreeInputTree: React.FC<HorizontalPedigreeInputTreeProps> = ({ 
  formData, 
  onInputChange, 
  disabled = false,
  animalName 
}) => {
  return (
    <ScrollArea className="w-full">
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max p-2">
          {/* Current Animal - Generation 0 */}
          <div className="flex flex-col justify-center">
            <div className={`p-4 rounded-lg text-center min-w-[150px] shadow-lg ${getSpeciesColor(formData?.species)}`}>
              <div className="text-sm font-semibold mb-1">Gen 0</div>
              <div className="font-bold text-base">{animalName || 'Animal'}</div>
              <div className="text-xs opacity-75 mt-1">Sujeto</div>
            </div>
          </div>

          {/* Parents - Generation 1 */}
          <div className="flex flex-col gap-2 justify-center">
            <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 1 - Padres</div>
            <AncestorInputBox 
              field="fatherId" 
              value={formData.fatherId} 
              label="Padre" 
              gender="male" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="motherId" 
              value={formData.motherId} 
              label="Madre" 
              gender="female" 
              onChange={onInputChange}
              disabled={disabled}
            />
          </div>

          {/* Grandparents - Generation 2 */}
          <div className="flex flex-col gap-2 justify-center">
            <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 2 - Abuelos</div>
            <AncestorInputBox 
              field="paternal_grandfather_id" 
              value={formData.paternal_grandfather_id} 
              label="Abuelo P" 
              gender="male" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="paternal_grandmother_id" 
              value={formData.paternal_grandmother_id} 
              label="Abuela P" 
              gender="female" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="maternal_grandfather_id" 
              value={formData.maternal_grandfather_id} 
              label="Abuelo M" 
              gender="male" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="maternal_grandmother_id" 
              value={formData.maternal_grandmother_id} 
              label="Abuela M" 
              gender="female" 
              onChange={onInputChange}
              disabled={disabled}
            />
          </div>

          {/* Great-Grandparents - Generation 3 */}
          <div className="flex flex-col gap-2 justify-center">
            <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 3 - Bisabuelos</div>
            <AncestorInputBox 
              field="paternal_great_grandfather_paternal_id" 
              value={formData.paternal_great_grandfather_paternal_id} 
              label="Bisabuelo PP" 
              gender="male" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="paternal_great_grandmother_paternal_id" 
              value={formData.paternal_great_grandmother_paternal_id} 
              label="Bisabuela PP" 
              gender="female" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="paternal_great_grandfather_maternal_id" 
              value={formData.paternal_great_grandfather_maternal_id} 
              label="Bisabuelo PM" 
              gender="male" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="paternal_great_grandmother_maternal_id" 
              value={formData.paternal_great_grandmother_maternal_id} 
              label="Bisabuela PM" 
              gender="female" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="maternal_great_grandfather_paternal_id" 
              value={formData.maternal_great_grandfather_paternal_id} 
              label="Bisabuelo MP" 
              gender="male" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="maternal_great_grandmother_paternal_id" 
              value={formData.maternal_great_grandmother_paternal_id} 
              label="Bisabuela MP" 
              gender="female" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="maternal_great_grandfather_maternal_id" 
              value={formData.maternal_great_grandfather_maternal_id} 
              label="Bisabuelo MM" 
              gender="male" 
              onChange={onInputChange}
              disabled={disabled}
            />
            <AncestorInputBox 
              field="maternal_great_grandmother_maternal_id" 
              value={formData.maternal_great_grandmother_maternal_id} 
              label="Bisabuela MM" 
              gender="female" 
              onChange={onInputChange}
              disabled={disabled}
            />
          </div>

          {/* Generation 4 - Great-Great-Grandparents */}
          <div className="flex flex-col gap-1 justify-center">
            <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 4</div>
            <AncestorInputBox field="gen4_paternal_ggggf_p" value={formData.gen4_paternal_ggggf_p} label="G4-P1 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_paternal_ggggm_p" value={formData.gen4_paternal_ggggm_p} label="G4-P2 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_paternal_gggmf_p" value={formData.gen4_paternal_gggmf_p} label="G4-P3 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_paternal_gggmm_p" value={formData.gen4_paternal_gggmm_p} label="G4-P4 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_paternal_ggfgf_p" value={formData.gen4_paternal_ggfgf_p} label="G4-P5 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_paternal_ggfgm_p" value={formData.gen4_paternal_ggfgm_p} label="G4-P6 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_paternal_ggmgf_p" value={formData.gen4_paternal_ggmgf_p} label="G4-P7 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_paternal_ggmgm_p" value={formData.gen4_paternal_ggmgm_p} label="G4-P8 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_maternal_ggggf_m" value={formData.gen4_maternal_ggggf_m} label="G4-M1 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_maternal_ggggm_m" value={formData.gen4_maternal_ggggm_m} label="G4-M2 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_maternal_gggmf_m" value={formData.gen4_maternal_gggmf_m} label="G4-M3 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_maternal_gggmm_m" value={formData.gen4_maternal_gggmm_m} label="G4-M4 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_maternal_ggfgf_m" value={formData.gen4_maternal_ggfgf_m} label="G4-M5 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_maternal_ggfgm_m" value={formData.gen4_maternal_ggfgm_m} label="G4-M6 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_maternal_ggmgf_m" value={formData.gen4_maternal_ggmgf_m} label="G4-M7 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4_maternal_ggmgm_m" value={formData.gen4_maternal_ggmgm_m} label="G4-M8 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
          </div>

          {/* Generation 5 */}
          <div className="flex flex-col gap-0.5 justify-center">
            <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 5</div>
            <AncestorInputBox field="gen5_paternal_1" value={formData.gen5_paternal_1} label="G5-P1 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_2" value={formData.gen5_paternal_2} label="G5-P2 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_3" value={formData.gen5_paternal_3} label="G5-P3 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_4" value={formData.gen5_paternal_4} label="G5-P4 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_5" value={formData.gen5_paternal_5} label="G5-P5 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_6" value={formData.gen5_paternal_6} label="G5-P6 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_7" value={formData.gen5_paternal_7} label="G5-P7 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_8" value={formData.gen5_paternal_8} label="G5-P8 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_9" value={formData.gen5_paternal_9} label="G5-P9 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_10" value={formData.gen5_paternal_10} label="G5-P10 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_11" value={formData.gen5_paternal_11} label="G5-P11 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_12" value={formData.gen5_paternal_12} label="G5-P12 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_13" value={formData.gen5_paternal_13} label="G5-P13 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_14" value={formData.gen5_paternal_14} label="G5-P14 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_15" value={formData.gen5_paternal_15} label="G5-P15 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_paternal_16" value={formData.gen5_paternal_16} label="G5-P16 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_1" value={formData.gen5_maternal_1} label="G5-M1 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_2" value={formData.gen5_maternal_2} label="G5-M2 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_3" value={formData.gen5_maternal_3} label="G5-M3 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_4" value={formData.gen5_maternal_4} label="G5-M4 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_5" value={formData.gen5_maternal_5} label="G5-M5 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_6" value={formData.gen5_maternal_6} label="G5-M6 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_7" value={formData.gen5_maternal_7} label="G5-M7 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_8" value={formData.gen5_maternal_8} label="G5-M8 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_9" value={formData.gen5_maternal_9} label="G5-M9 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_10" value={formData.gen5_maternal_10} label="G5-M10 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_11" value={formData.gen5_maternal_11} label="G5-M11 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_12" value={formData.gen5_maternal_12} label="G5-M12 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_13" value={formData.gen5_maternal_13} label="G5-M13 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_14" value={formData.gen5_maternal_14} label="G5-M14 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_15" value={formData.gen5_maternal_15} label="G5-M15 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5_maternal_16" value={formData.gen5_maternal_16} label="G5-M16 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
          </div>
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default HorizontalPedigreeInputTree;

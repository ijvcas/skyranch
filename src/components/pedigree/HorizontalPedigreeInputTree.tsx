import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface HorizontalPedigreeInputTreeProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
  animalName?: string;
}

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
            <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center min-w-[150px] shadow-lg">
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
            <AncestorInputBox field="gen4PaternalGgggfP" value={formData.gen4PaternalGgggfP} label="G4-P1 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4PaternalGgggmP" value={formData.gen4PaternalGgggmP} label="G4-P2 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4PaternalGggmfP" value={formData.gen4PaternalGggmfP} label="G4-P3 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4PaternalGggmmP" value={formData.gen4PaternalGggmmP} label="G4-P4 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4PaternalGgfgfP" value={formData.gen4PaternalGgfgfP} label="G4-P5 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4PaternalGgfgmP" value={formData.gen4PaternalGgfgmP} label="G4-P6 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4PaternalGgmgfP" value={formData.gen4PaternalGgmgfP} label="G4-P7 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4PaternalGgmgmP" value={formData.gen4PaternalGgmgmP} label="G4-P8 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4MaternalGgggfM" value={formData.gen4MaternalGgggfM} label="G4-M1 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4MaternalGgggmM" value={formData.gen4MaternalGgggmM} label="G4-M2 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4MaternalGggmfM" value={formData.gen4MaternalGggmfM} label="G4-M3 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4MaternalGggmmM" value={formData.gen4MaternalGggmmM} label="G4-M4 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4MaternalGgfgfM" value={formData.gen4MaternalGgfgfM} label="G4-M5 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4MaternalGgfgmM" value={formData.gen4MaternalGgfgmM} label="G4-M6 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4MaternalGgmgfM" value={formData.gen4MaternalGgmgfM} label="G4-M7 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen4MaternalGgmgmM" value={formData.gen4MaternalGgmgmM} label="G4-M8 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
          </div>

          {/* Generation 5 */}
          <div className="flex flex-col gap-0.5 justify-center">
            <div className="text-center text-xs font-semibold text-muted-foreground mb-1">Gen 5</div>
            <AncestorInputBox field="gen5Paternal1" value={formData.gen5Paternal1} label="G5-P1 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal2" value={formData.gen5Paternal2} label="G5-P2 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal3" value={formData.gen5Paternal3} label="G5-P3 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal4" value={formData.gen5Paternal4} label="G5-P4 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal5" value={formData.gen5Paternal5} label="G5-P5 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal6" value={formData.gen5Paternal6} label="G5-P6 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal7" value={formData.gen5Paternal7} label="G5-P7 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal8" value={formData.gen5Paternal8} label="G5-P8 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal9" value={formData.gen5Paternal9} label="G5-P9 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal10" value={formData.gen5Paternal10} label="G5-P10 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal11" value={formData.gen5Paternal11} label="G5-P11 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal12" value={formData.gen5Paternal12} label="G5-P12 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal13" value={formData.gen5Paternal13} label="G5-P13 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal14" value={formData.gen5Paternal14} label="G5-P14 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal15" value={formData.gen5Paternal15} label="G5-P15 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Paternal16" value={formData.gen5Paternal16} label="G5-P16 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal1" value={formData.gen5Maternal1} label="G5-M1 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal2" value={formData.gen5Maternal2} label="G5-M2 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal3" value={formData.gen5Maternal3} label="G5-M3 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal4" value={formData.gen5Maternal4} label="G5-M4 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal5" value={formData.gen5Maternal5} label="G5-M5 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal6" value={formData.gen5Maternal6} label="G5-M6 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal7" value={formData.gen5Maternal7} label="G5-M7 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal8" value={formData.gen5Maternal8} label="G5-M8 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal9" value={formData.gen5Maternal9} label="G5-M9 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal10" value={formData.gen5Maternal10} label="G5-M10 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal11" value={formData.gen5Maternal11} label="G5-M11 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal12" value={formData.gen5Maternal12} label="G5-M12 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal13" value={formData.gen5Maternal13} label="G5-M13 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal14" value={formData.gen5Maternal14} label="G5-M14 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal15" value={formData.gen5Maternal15} label="G5-M15 ♂" gender="male" onChange={onInputChange} disabled={disabled} />
            <AncestorInputBox field="gen5Maternal16" value={formData.gen5Maternal16} label="G5-M16 ♀" gender="female" onChange={onInputChange} disabled={disabled} />
          </div>
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default HorizontalPedigreeInputTree;

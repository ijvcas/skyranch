import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PedigreeGeneration4Props {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const PedigreeGeneration4 = ({ formData, onInputChange, disabled = false }: PedigreeGeneration4Props) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">4ta Generación (Tatarabuelos)</h3>
      
      {/* Paternal Line - Father's Side */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Línea Paterna (Lado del Padre)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gen4_paternal_ggggf_p">Tatarabuelo Paterno (GGGGF-P)</Label>
            <Input
              id="gen4_paternal_ggggf_p"
              value={formData.gen4PaternalGgggfP || ''}
              onChange={(e) => onInputChange('gen4PaternalGgggfP', e.target.value)}
              disabled={disabled}
              placeholder="Nombre del tatarabuelo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_paternal_ggggm_p">Tatarabuela Paterna (GGGGM-P)</Label>
            <Input
              id="gen4_paternal_ggggm_p"
              value={formData.gen4PaternalGgggmP || ''}
              onChange={(e) => onInputChange('gen4PaternalGgggmP', e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la tatarabuela"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_paternal_gggmf_p">Tatarabuelo Materno (GGGMF-P)</Label>
            <Input
              id="gen4_paternal_gggmf_p"
              value={formData.gen4PaternalGggmfP || ''}
              onChange={(e) => onInputChange('gen4PaternalGggmfP', e.target.value)}
              disabled={disabled}
              placeholder="Nombre del tatarabuelo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_paternal_gggmm_p">Tatarabuela Materna (GGGMM-P)</Label>
            <Input
              id="gen4_paternal_gggmm_p"
              value={formData.gen4PaternalGggmmP || ''}
              onChange={(e) => onInputChange('gen4PaternalGggmmP', e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la tatarabuela"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_paternal_ggfgf_p">Tatarabuelo (GGFGF-P)</Label>
            <Input
              id="gen4_paternal_ggfgf_p"
              value={formData.gen4PaternalGgfgfP || ''}
              onChange={(e) => onInputChange('gen4PaternalGgfgfP', e.target.value)}
              disabled={disabled}
              placeholder="Nombre del tatarabuelo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_paternal_ggfgm_p">Tatarabuela (GGFGM-P)</Label>
            <Input
              id="gen4_paternal_ggfgm_p"
              value={formData.gen4PaternalGgfgmP || ''}
              onChange={(e) => onInputChange('gen4PaternalGgfgmP', e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la tatarabuela"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_paternal_ggmgf_p">Tatarabuelo (GGMGF-P)</Label>
            <Input
              id="gen4_paternal_ggmgf_p"
              value={formData.gen4PaternalGgmgfP || ''}
              onChange={(e) => onInputChange('gen4PaternalGgmgfP', e.target.value)}
              disabled={disabled}
              placeholder="Nombre del tatarabuelo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_paternal_ggmgm_p">Tatarabuela (GGMGM-P)</Label>
            <Input
              id="gen4_paternal_ggmgm_p"
              value={formData.gen4PaternalGgmgmP || ''}
              onChange={(e) => onInputChange('gen4PaternalGgmgmP', e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la tatarabuela"
            />
          </div>
        </div>
      </div>

      {/* Maternal Line - Mother's Side */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Línea Materna (Lado de la Madre)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gen4_maternal_ggggf_m">Tatarabuelo Paterno (GGGGF-M)</Label>
            <Input
              id="gen4_maternal_ggggf_m"
              value={formData.gen4MaternalGgggfM || ''}
              onChange={(e) => onInputChange('gen4MaternalGgggfM', e.target.value)}
              disabled={disabled}
              placeholder="Nombre del tatarabuelo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_maternal_ggggm_m">Tatarabuela Paterna (GGGGM-M)</Label>
            <Input
              id="gen4_maternal_ggggm_m"
              value={formData.gen4MaternalGgggmM || ''}
              onChange={(e) => onInputChange('gen4MaternalGgggmM', e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la tatarabuela"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_maternal_gggmf_m">Tatarabuelo Materno (GGGMF-M)</Label>
            <Input
              id="gen4_maternal_gggmf_m"
              value={formData.gen4MaternalGggmfM || ''}
              onChange={(e) => onInputChange('gen4MaternalGggmfM', e.target.value)}
              disabled={disabled}
              placeholder="Nombre del tatarabuelo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_maternal_gggmm_m">Tatarabuela Materna (GGGMM-M)</Label>
            <Input
              id="gen4_maternal_gggmm_m"
              value={formData.gen4MaternalGggmmM || ''}
              onChange={(e) => onInputChange('gen4MaternalGggmmM', e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la tatarabuela"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_maternal_ggfgf_m">Tatarabuelo (GGFGF-M)</Label>
            <Input
              id="gen4_maternal_ggfgf_m"
              value={formData.gen4MaternalGgfgfM || ''}
              onChange={(e) => onInputChange('gen4MaternalGgfgfM', e.target.value)}
              disabled={disabled}
              placeholder="Nombre del tatarabuelo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_maternal_ggfgm_m">Tatarabuela (GGFGM-M)</Label>
            <Input
              id="gen4_maternal_ggfgm_m"
              value={formData.gen4MaternalGgfgmM || ''}
              onChange={(e) => onInputChange('gen4MaternalGgfgmM', e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la tatarabuela"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_maternal_ggmgf_m">Tatarabuelo (GGMGF-M)</Label>
            <Input
              id="gen4_maternal_ggmgf_m"
              value={formData.gen4MaternalGgmgfM || ''}
              onChange={(e) => onInputChange('gen4MaternalGgmgfM', e.target.value)}
              disabled={disabled}
              placeholder="Nombre del tatarabuelo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen4_maternal_ggmgm_m">Tatarabuela (GGMGM-M)</Label>
            <Input
              id="gen4_maternal_ggmgm_m"
              value={formData.gen4MaternalGgmgmM || ''}
              onChange={(e) => onInputChange('gen4MaternalGgmgmM', e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la tatarabuela"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedigreeGeneration4;

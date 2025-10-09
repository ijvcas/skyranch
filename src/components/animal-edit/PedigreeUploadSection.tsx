import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PedigreeUploadSectionProps {
  animalId: string;
  animalName: string;
  onUploadSuccess?: () => void;
}

export const PedigreeUploadSection = ({ animalId, animalName, onUploadSuccess }: PedigreeUploadSectionProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      console.log('📤 Starting upload for:', animalName, 'ID:', animalId);
      
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Call edge function for extraction
      console.log('🔄 Calling fix-pedigree-upload...');
      const response = await fetch(
        `https://ahwhtxygyzoadsmdrwwg.supabase.co/functions/v1/fix-pedigree-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Upload error:', result);
        throw new Error(result.error || 'Error al procesar el pedigrí');
      }

      console.log('✅ Extraction success:', result);

      // Build database update object
      const updateData: any = {};
      const pedigreeData = result.pedigreeData;

      // Map Gen4 Paternal (8 ancestors)
      if (pedigreeData?.generation4?.paternalLine) {
        const patLine = pedigreeData.generation4.paternalLine;
        updateData.gen4_paternal_ggggf_p = patLine[0] || null;
        updateData.gen4_paternal_ggggm_p = patLine[1] || null;
        updateData.gen4_paternal_gggmf_p = patLine[2] || null;
        updateData.gen4_paternal_gggmm_p = patLine[3] || null;
        updateData.gen4_paternal_ggfgf_p = patLine[4] || null;
        updateData.gen4_paternal_ggfgm_p = patLine[5] || null;
        updateData.gen4_paternal_ggmgf_p = patLine[6] || null;
        updateData.gen4_paternal_ggmgm_p = patLine[7] || null;
      }

      // Map Gen4 Maternal (8 ancestors)
      if (pedigreeData?.generation4?.maternalLine) {
        const matLine = pedigreeData.generation4.maternalLine;
        updateData.gen4_maternal_ggggf_m = matLine[0] || null;
        updateData.gen4_maternal_ggggm_m = matLine[1] || null;
        updateData.gen4_maternal_gggmf_m = matLine[2] || null;
        updateData.gen4_maternal_gggmm_m = matLine[3] || null;
        updateData.gen4_maternal_ggfgf_m = matLine[4] || null;
        updateData.gen4_maternal_ggfgm_m = matLine[5] || null;
        updateData.gen4_maternal_ggmgf_m = matLine[6] || null;
        updateData.gen4_maternal_ggmgm_m = matLine[7] || null;
      }

      // Map Gen5 Paternal (16 ancestors)
      if (pedigreeData?.generation5?.paternalLine) {
        const patLine = pedigreeData.generation5.paternalLine;
        for (let i = 0; i < 16 && i < patLine.length; i++) {
          updateData[`gen5_paternal_${i + 1}`] = patLine[i] || null;
        }
      }

      // Map Gen5 Maternal (16 ancestors)
      if (pedigreeData?.generation5?.maternalLine) {
        const matLine = pedigreeData.generation5.maternalLine;
        for (let i = 0; i < 16 && i < matLine.length; i++) {
          updateData[`gen5_maternal_${i + 1}`] = matLine[i] || null;
        }
      }

      // Update database
      console.log('💾 Updating database with', Object.keys(updateData).length, 'fields');
      const { error: updateError } = await supabase
        .from('animals')
        .update(updateData)
        .eq('id', animalId);

      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        throw new Error('Error al guardar el pedigrí');
      }

      const gen4Count = Object.keys(updateData).filter(k => k.startsWith('gen4_')).length;
      const gen5Count = Object.keys(updateData).filter(k => k.startsWith('gen5_')).length;

      console.log('✅ Database updated: Gen4:', gen4Count, 'Gen5:', gen5Count);
      toast.success(`Pedigrí actualizado: Gen4: ${gen4Count}, Gen5: ${gen5Count}`);
      onUploadSuccess?.();
    } catch (error) {
      console.error('❌ Pedigree upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el pedigrí');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 bg-primary/5">
      <div className="flex items-center gap-4">
        <FileText className="w-10 h-10 text-primary" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Cargar Pedigrí de 5 Generaciones</h3>
          <p className="text-sm text-muted-foreground">
            Sube un documento PNG/PDF con el pedigrí completo y la IA lo extraerá automáticamente
          </p>
        </div>
        <label htmlFor="pedigree-upload">
          <Button disabled={uploading} asChild>
            <span className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Documento
                </>
              )}
            </span>
          </Button>
        </label>
        <input
          id="pedigree-upload"
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>
    </div>
  );
};

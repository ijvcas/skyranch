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
      // Use the dedicated fix-pedigree-upload function
      const formData = new FormData();
      formData.append('message', `Pedigrí de 5 generaciones de ${animalName}`);
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

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
        console.error('Upload error:', result);
        throw new Error(result.error || 'Error al procesar el pedigrí');
      }

      console.log('Upload success:', result);
      toast.success(`Pedigrí actualizado: Gen4: ${result.updated.gen4}, Gen5: ${result.updated.gen5}`);
      onUploadSuccess?.();
    } catch (error) {
      console.error('Pedigree upload error:', error);
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

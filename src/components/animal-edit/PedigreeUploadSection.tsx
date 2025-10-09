import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { toast } from 'sonner';

interface PedigreeUploadSectionProps {
  animalId: string;
  animalName: string;
  onUploadSuccess?: () => void;
}

export const PedigreeUploadSection = ({ animalId, animalName, onUploadSuccess }: PedigreeUploadSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const { sendMessage } = useAIChat();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await sendMessage(
        `Aquí está el pedigrí de 5 generaciones de ${animalName}. Extrae toda la información y actualiza automáticamente su ficha.`,
        file
      );
      toast.success('Pedigrí subido y procesado correctamente');
      onUploadSuccess?.();
    } catch (error) {
      toast.error('Error al procesar el pedigrí');
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

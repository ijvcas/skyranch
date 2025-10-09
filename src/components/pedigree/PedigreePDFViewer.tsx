import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Upload, FileText } from 'lucide-react';
interface Animal {
  id: string;
  pedigree_pdf_url?: string | null;
  species: string;
}

interface PedigreePDFViewerProps {
  animal: Animal;
}

const PedigreePDFViewer = ({ animal }: PedigreePDFViewerProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(animal.pedigree_pdf_url || null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos PDF',
        variant: 'destructive',
      });
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El archivo debe ser menor a 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Delete old PDF if exists
      if (pdfUrl) {
        const oldPath = pdfUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('pedigree-documents').remove([oldPath]);
      }

      // Upload new PDF
      const fileName = `${animal.id}-${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pedigree-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pedigree-documents')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update animal record
      const { error: updateError } = await supabase
        .from('animals')
        .update({ pedigree_pdf_url: publicUrl })
        .eq('id', animal.id);

      if (updateError) throw updateError;

      setPdfUrl(publicUrl);
      toast({
        title: 'Éxito',
        description: 'Pedigrí PDF subido correctamente',
      });
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al subir el PDF',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  });

  const handleDelete = async () => {
    if (!pdfUrl) return;

    setDeleting(true);
    try {
      // Extract file path from URL
      const filePath = pdfUrl.split('/').slice(-2).join('/');

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('pedigree-documents')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update animal record
      const { error: updateError } = await supabase
        .from('animals')
        .update({ pedigree_pdf_url: null })
        .eq('id', animal.id);

      if (updateError) throw updateError;

      setPdfUrl(null);
      toast({
        title: 'Éxito',
        description: 'PDF eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error deleting PDF:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el PDF',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Pedigrí PDF</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!pdfUrl ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            {uploading ? (
              <p className="text-lg text-gray-600">Subiendo PDF...</p>
            ) : isDragActive ? (
              <p className="text-lg text-gray-600">Suelta el archivo aquí...</p>
            ) : (
              <>
                <p className="text-lg text-gray-600 mb-2">
                  Arrastra tu PDF de pedigrí aquí
                </p>
                <p className="text-sm text-gray-500">
                  o haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Máximo 10MB - Solo archivos PDF
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <iframe
                src={`${pdfUrl}#view=FitH`}
                className="w-full h-[600px] md:h-[700px] lg:h-[800px]"
                title="Pedigrí PDF"
              />
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>Pedigrí PDF</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
            <div
              {...getRootProps()}
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors border-gray-300 hover:border-primary/50"
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Haz clic o arrastra para reemplazar el PDF
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PedigreePDFViewer;

import { supabase } from '@/integrations/supabase/client';

export interface AnimalDocument {
  id: string;
  animal_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  attachment_type: string;
  description: string | null;
  created_at: string;
}

export type DocumentType = 
  | 'pedigree'
  | 'invoice'
  | 'health_certificate'
  | 'vaccination_record'
  | 'other';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  pedigree: 'Pedigrí Oficial',
  invoice: 'Factura',
  health_certificate: 'Certificado de Salud',
  vaccination_record: 'Registro de Vacunación',
  other: 'Otro Documento'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadAnimalDocument = async (
  animalId: string,
  userId: string,
  file: File,
  documentType: DocumentType,
  description?: string
): Promise<AnimalDocument> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo es demasiado grande. Tamaño máximo: 10MB`);
  }

  if (file.type !== 'application/pdf') {
    throw new Error('Solo se permiten archivos PDF');
  }

  // Upload to storage
  const fileExt = 'pdf';
  const fileName = `${animalId}/${Date.now()}-${file.name}`;
  
  const { error: uploadError } = await supabase.storage
    .from('animal-documents')
    .upload(fileName, file);

  if (uploadError) {
    throw new Error(`Error al subir el archivo: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('animal-documents')
    .getPublicUrl(fileName);

  // Create database record
  const { data, error } = await supabase
    .from('animal_attachments')
    .insert({
      animal_id: animalId,
      user_id: userId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
      attachment_type: 'document',
      description: description || DOCUMENT_TYPE_LABELS[documentType]
    })
    .select()
    .single();

  if (error) {
    // Clean up uploaded file if database insert fails
    await supabase.storage
      .from('animal-documents')
      .remove([fileName]);
    throw new Error(`Error al guardar información del documento: ${error.message}`);
  }

  return data;
};

export const getAnimalDocuments = async (animalId: string): Promise<AnimalDocument[]> => {
  const { data, error } = await supabase
    .from('animal_attachments')
    .select('*')
    .eq('animal_id', animalId)
    .eq('attachment_type', 'document')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al cargar documentos: ${error.message}`);
  }

  return data || [];
};

export const deleteAnimalDocument = async (documentId: string, fileUrl: string): Promise<void> => {
  // Extract file path from URL
  const urlParts = fileUrl.split('/animal-documents/');
  const filePath = urlParts[1];

  // Delete from storage
  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from('animal-documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage fails
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('animal_attachments')
    .delete()
    .eq('id', documentId);

  if (error) {
    throw new Error(`Error al eliminar documento: ${error.message}`);
  }
};

export const downloadAnimalDocument = async (fileUrl: string, fileName: string): Promise<void> => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    throw new Error('Error al descargar el documento');
  }
};

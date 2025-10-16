import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, X, Upload } from 'lucide-react';
import { parseASCIITreePedigree, mapPedigreeToFields } from '@/services/pedigree/asciiTreeParser';
import PedigreePreview from './PedigreePreview';
import { useToast } from '@/hooks/use-toast';
import { parse_document } from '@/utils/documentParser';

interface PedigreeTextUploadSectionProps {
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const PedigreeTextUploadSection: React.FC<PedigreeTextUploadSectionProps> = ({
  onInputChange,
  disabled = false,
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const text = await parse_document(file);
      
      if (text === '__PDF_FILE__') {
        toast({
          title: 'PDF detectado',
          description: 'Por favor, copia y pega el texto del PDF en lugar de subirlo directamente.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }
      
      setPastedText(text);
      handleParse(text);
    } catch (error) {
      toast({
        title: 'Error al Cargar',
        description: 'No se pudo procesar el archivo. Intenta pegar el texto manualmente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParse = (textToParse?: string) => {
    const text = textToParse || pastedText;
    
    if (!text.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor, pega el texto del pedigrí o sube un archivo primero.',
        variant: 'destructive',
      });
      return;
    }

    const parsed = parseASCIITreePedigree(text);
    
    if (!parsed) {
      toast({
        title: 'Error al Analizar',
        description: 'No se pudo analizar el árbol genealógico. Asegúrate de que el texto incluya el animal sujeto con info de raza entre paréntesis.',
        variant: 'destructive',
      });
      return;
    }

    setParsedData(parsed);
  };

  const handleApply = () => {
    if (!parsedData) return;

    const fieldMapping = mapPedigreeToFields(parsedData);
    
    // Apply all mapped fields
    Object.entries(fieldMapping).forEach(([field, value]) => {
      onInputChange(field, value);
    });

    const fieldCount = Object.keys(fieldMapping).length;
    
    toast({
      title: 'Pedigrí Aplicado',
      description: `Se han poblado ${fieldCount} campos del pedigrí exitosamente.`,
    });

    // Reset
    setPastedText('');
    setParsedData(null);
    setShowUpload(false);
  };

  const handleCancel = () => {
    setPastedText('');
    setParsedData(null);
  };

  if (!showUpload) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowUpload(true)}
            disabled={disabled}
          >
            <FileText className="w-4 h-4 mr-2" />
            Cargar Pedigrí Completo (5 Generaciones)
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Sube PDF/TXT o pega el árbol genealógico completo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900 flex items-center justify-between">
          <span>Cargar Árbol Genealógico Completo</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowUpload(false);
              setPastedText('');
              setParsedData(null);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-muted rounded-lg p-4 hover:border-primary transition-colors text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Subir PDF o TXT</p>
                  <p className="text-xs text-muted-foreground">Haz clic para seleccionar</p>
                </div>
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                disabled={disabled || isProcessing}
                className="hidden"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O pega el texto</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Árbol genealógico en formato texto
            </label>
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Pega aquí el árbol genealógico completo (5 generaciones).

Formato requerido:
- El árbol debe contener el ANIMAL SUJETO en alguna línea con información de raza entre paréntesis
  Ejemplo: "LASCAUX DU VERN  (Baudet du Poitou, Mâle, 2021)"
- Los ancestros paternos deben estar ARRIBA del animal sujeto
- Los ancestros maternos deben estar ABAJO del animal sujeto
- El árbol usa sangrías/indentación para mostrar generaciones (más sangría = más cerca del sujeto)

Ejemplo de estructura visual:
                    BISABUELO (Gen 5)
                ┌── ABUELO PATERNO (Gen 3)
            ┌── PADRE (Gen 1)
            │   └── ABUELA PATERNA
SUJETO (Baudet, Mâle, 2021)
            │   ┌── ABUELO MATERNO  
            └── MADRE (Gen 1)
                └── ABUELA MATERNA`}
              rows={16}
              className="font-mono text-xs"
              disabled={disabled || isProcessing}
            />
            <p className="text-xs text-muted-foreground mt-2">
              El parser detectará automáticamente la estructura del árbol basándose en sangrías y líneas
            </p>
          </div>

          {!parsedData && (
            <Button
              type="button"
              onClick={() => handleParse()}
              disabled={disabled || !pastedText.trim() || isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Procesando...' : 'Analizar Árbol'}
            </Button>
          )}

          {parsedData && (
            <PedigreePreview
              parsed={parsedData}
              onApply={handleApply}
              onCancel={handleCancel}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PedigreeTextUploadSection;

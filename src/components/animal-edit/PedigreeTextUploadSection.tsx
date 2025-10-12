import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, X } from 'lucide-react';
import { parsePedigreeText, mapPedigreeToFields } from '@/services/pedigree/textParser';
import PedigreePreview from './PedigreePreview';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleParse = () => {
    if (!pastedText.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor, pega el texto del pedigrí primero.',
        variant: 'destructive',
      });
      return;
    }

    const parsed = parsePedigreeText(pastedText);
    
    if (!parsed) {
      toast({
        title: 'Error al Analizar',
        description: 'No se pudo analizar el texto. Verifica el formato.',
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
            Pegar Texto de Pedigrí
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Copia y pega el pedigrí desde cualquier documento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900 flex items-center justify-between">
          <span>Pegar Texto de Pedigrí</span>
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
          <div>
            <label className="text-sm font-medium mb-2 block">
              Pega el texto del pedigrí aquí
            </label>
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Ejemplo de formato:

Generación 1:
Padre: Nombre del Toro
Madre: Nombre de la Vaca

Generación 2:
Abuelo Paterno: Nombre
Abuela Paterna: Nombre
Abuelo Materno: Nombre
Abuela Materna: Nombre

Generación 3:
[Lista de bisabuelos...]

...y así sucesivamente hasta Generación 5`}
              rows={12}
              className="font-mono text-sm"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Formatos soportados: texto estructurado con generaciones numeradas, listas, o texto con
              etiquetas (Padre, Madre, Abuelo, etc.)
            </p>
          </div>

          {!parsedData && (
            <Button
              type="button"
              onClick={handleParse}
              disabled={disabled || !pastedText.trim()}
              className="w-full"
            >
              Analizar Texto
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

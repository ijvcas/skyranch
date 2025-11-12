
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Search } from 'lucide-react';

interface ImageSelectorProps {
  animalType?: string;
  disabled?: boolean;
  onFileUpload: () => void;
  onSearchToggle: () => void;
  placeholderText?: string;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({
  animalType,
  disabled = false,
  onFileUpload,
  onSearchToggle,
  placeholderText = 'Añadir foto del animal'
}) => {
  return (
    <Card>
      <CardContent className="p-8 text-center border-2 border-dashed border-gray-300">
        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">
          {placeholderText}
          {animalType && ` (${animalType})`}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onFileUpload}
            disabled={disabled}
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir Archivo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSearchToggle}
            disabled={disabled}
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar Imagen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageSelector;


import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon } from 'lucide-react';
import ImagePreview from './ImagePreview';
import ImageSelector from './ImageSelector';
import ImageGallery from './ImageGallery';
import { ImageUploadProps } from './types';
import { cameraService } from '@/services/mobile/cameraService';
import { toast } from 'sonner';

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImage, 
  onImageChange, 
  disabled = false,
  animalType = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setPreviewUrl(imageUrl);
    onImageChange(imageUrl);
    setIsSearching(false);
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSearchToggle = () => {
    setIsSearching(!isSearching);
  };

  const handleTakePhoto = async () => {
    try {
      const photoDataUrl = await cameraService.takePicture();
      if (photoDataUrl) {
        setPreviewUrl(photoDataUrl);
        onImageChange(photoDataUrl);
        toast.success('Foto capturada correctamente');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.error('Error al capturar la foto');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const photoDataUrl = await cameraService.selectFromGallery();
      if (photoDataUrl) {
        setPreviewUrl(photoDataUrl);
        onImageChange(photoDataUrl);
        toast.success('Foto seleccionada correctamente');
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      toast.error('Error al seleccionar la foto');
    }
  };

  const showCameraOptions = cameraService.isAvailable();

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <ImagePreview
          imageUrl={previewUrl}
          disabled={disabled}
          onRemove={handleRemoveImage}
        />
      ) : showCameraOptions && cameraService.isMobile() ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTakePhoto}
              disabled={disabled}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Tomar Foto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSelectFromGallery}
              disabled={disabled}
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Galería
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleFileUploadClick}
            disabled={disabled}
            className="w-full text-sm"
          >
            O subir desde archivo
          </Button>
        </div>
      ) : (
        <ImageSelector
          animalType={animalType}
          disabled={disabled}
          onFileUpload={handleFileUploadClick}
          onSearchToggle={handleSearchToggle}
        />
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {isSearching && (
        <ImageGallery
          animalType={animalType}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onImageSelect={handleImageSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default ImageUpload;

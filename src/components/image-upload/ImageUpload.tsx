
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon } from 'lucide-react';
import ImagePreview from './ImagePreview';
import ImageSelector from './ImageSelector';
import ImageGallery from './ImageGallery';
import { ImageUploadProps } from './types';
import { cameraService } from '@/services/mobile/cameraService';
import { actionSheetService } from '@/services/mobile/actionSheetService';
import { networkStorageService } from '@/services/mobile/networkStorageService';
import { imageCompressionService } from '@/services/mobile/imageCompressionService';
import { toast } from 'sonner';

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImage, 
  onImageChange, 
  disabled = false,
  animalType = '',
  placeholderText = 'Añadir foto del animal'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isSelectingFromGallery, setIsSelectingFromGallery] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and display device conditions on mount
  useEffect(() => {
    const loadConditions = async () => {
      const conditions = await networkStorageService.getDeviceConditions();
      const description = networkStorageService.getConditionsDescription(conditions);
      setCompressionInfo(description);
    };
    loadConditions();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        
        // Apply compression
        const compressionResult = await imageCompressionService.compressImage(result);
        const tier = imageCompressionService.getTierDescription(compressionResult.tier);
        setCompressionInfo(`${tier} - ${compressionResult.reductionPercent}% reducido`);
        
        setPreviewUrl(compressionResult.dataUrl);
        onImageChange(compressionResult.dataUrl);
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

  const handleTakePhoto = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('📸 handleTakePhoto called');
    
    setIsTakingPhoto(true);
    const toastId = toast.loading('Abriendo cámara...');
    try {
      const photoDataUrl = await cameraService.takePicture();
      if (photoDataUrl) {
        setPreviewUrl(photoDataUrl);
        onImageChange(photoDataUrl);
        toast.success('Foto capturada correctamente', { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al capturar la foto';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleSelectFromGallery = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('📸 handleSelectFromGallery called');
    
    setIsSelectingFromGallery(true);
    const toastId = toast.loading('Abriendo galería...');
    try {
      const photoDataUrl = await cameraService.selectFromGallery();
      if (photoDataUrl) {
        setPreviewUrl(photoDataUrl);
        onImageChange(photoDataUrl);
        toast.success('Foto seleccionada correctamente', { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al seleccionar la foto';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSelectingFromGallery(false);
    }
  };

  const handlePhotoOptions = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    // Try to use native action sheet if available
    if (actionSheetService.isAvailable()) {
      await actionSheetService.showPhotoSourceOptions(
        handleTakePhoto,
        handleSelectFromGallery,
        handleFileUploadClick
      );
    } else {
      // Fallback to showing buttons (current behavior)
      // This will be shown by default on web
    }
  };

  const showCameraOptions = cameraService.isAvailable();
  const isMobile = cameraService.isMobile();

  return (
    <div className="space-y-4">
      {compressionInfo && (
        <div className="text-xs text-muted-foreground text-center py-1">
          {compressionInfo}
        </div>
      )}
      
      {previewUrl ? (
        <ImagePreview
          imageUrl={previewUrl}
          disabled={disabled}
          onRemove={handleRemoveImage}
        />
      ) : showCameraOptions && isMobile ? (
        <div className="space-y-2">
          {actionSheetService.isAvailable() ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePhotoOptions}
              disabled={disabled || isTakingPhoto || isSelectingFromGallery}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Seleccionar Foto
            </Button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTakePhoto}
                  disabled={disabled || isTakingPhoto || isSelectingFromGallery}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isTakingPhoto ? 'Abriendo...' : 'Tomar Foto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectFromGallery}
                  disabled={disabled || isTakingPhoto || isSelectingFromGallery}
                  className="w-full"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {isSelectingFromGallery ? 'Abriendo...' : 'Galería'}
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
            </>
          )}
        </div>
      ) : (
        <ImageSelector
          animalType={animalType}
          disabled={disabled}
          onFileUpload={handleFileUploadClick}
          onSearchToggle={handleSearchToggle}
          placeholderText={placeholderText}
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

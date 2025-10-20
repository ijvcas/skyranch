
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

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <ImagePreview
          imageUrl={previewUrl}
          disabled={disabled}
          onRemove={handleRemoveImage}
        />
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

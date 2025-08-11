
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Save, X } from 'lucide-react';
import EnhancedImageViewer from '@/components/image-editor/EnhancedImageViewer';
import { ImageTransform } from './hooks/useImageTransform';

interface AnimalImageEditorProps {
  animal: {
    image: string | null;
    name: string;
  };
  isEditMode: boolean;
  currentTransform: ImageTransform | null;
  savedTransform: ImageTransform | null;
  displayTransform: ImageTransform | null;
  updateMutationPending: boolean;
  onImageTransform: (transform: ImageTransform) => void;
  onEditClick: () => void;
  onSaveImage: () => void;
  onCancelEdit: () => void;
}

const AnimalImageEditor: React.FC<AnimalImageEditorProps> = ({
  animal,
  isEditMode,
  currentTransform,
  savedTransform,
  displayTransform,
  updateMutationPending,
  onImageTransform,
  onEditClick,
  onSaveImage,
  onCancelEdit
}) => {
  if (!animal.image) return null;

  return (
    <div className="mb-4 relative">
      <EnhancedImageViewer
        src={animal.image}
        alt={animal.name}
        className="w-full h-32 rounded-lg"
        editMode={isEditMode}
        onTransformChange={onImageTransform}
        initialTransform={displayTransform}
      />

      {!isEditMode && (
        <div className="absolute top-2 right-2">
          <Button
            size="sm"
            variant="ghost"
            className="bg-black/50 text-white hover:bg-black/70 h-8 w-8 p-0"
            onClick={onEditClick}
            title="Edit Image"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {isEditMode && (
        <div className="absolute top-2 left-2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="bg-green-600/80 text-white hover:bg-green-700/80 h-8 w-8 p-0"
            onClick={onSaveImage}
            title="Save Changes"
            disabled={updateMutationPending}
          >
            <Save className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="bg-red-600/80 text-white hover:bg-red-700/80 h-8 w-8 p-0"
            onClick={onCancelEdit}
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Transform status indicators */}
      {currentTransform && isEditMode && (
        <div className="mb-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
          Transformaciones pendientes: Zoom {Math.round(currentTransform.scale * 100)}%, 
          Rotación {currentTransform.rotation}°
        </div>
      )}
    </div>
  );
};

export default AnimalImageEditor;

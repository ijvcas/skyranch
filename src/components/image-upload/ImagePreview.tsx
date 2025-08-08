
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string;
  disabled?: boolean;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, disabled = false, onRemove }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative">
          <img
            src={imageUrl}
            alt="Farm picture"
            className="w-full h-32 object-cover rounded-lg"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={onRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImagePreview;

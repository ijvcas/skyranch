import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ImageUploadProgressProps {
  stage: 'compression' | 'upload';
  progress: number;
  statusText: string;
  compressedSize?: number;
  originalSize?: number;
}

export const ImageUploadProgress: React.FC<ImageUploadProgressProps> = ({
  stage,
  progress,
  statusText,
  compressedSize,
  originalSize,
}) => {
  const getStageEmoji = () => {
    if (stage === 'compression') return '🗜️';
    return '☁️';
  };

  const getStageLabel = () => {
    if (stage === 'compression') return 'Comprimiendo';
    return 'Subiendo';
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getStageEmoji()}</span>
            <span className="text-sm font-medium text-foreground">
              {getStageLabel()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-semibold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{statusText}</span>
          {compressedSize && originalSize && (
            <span>
              {Math.round(originalSize)}KB → {Math.round(compressedSize)}KB
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

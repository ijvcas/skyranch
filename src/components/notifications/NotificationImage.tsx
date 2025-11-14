import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface NotificationImageProps {
  src?: string;
  alt?: string;
  className?: string;
  thumbnail?: boolean;
}

export const NotificationImage = ({ 
  src, 
  alt = 'Notification image', 
  className = '',
  thumbnail = false 
}: NotificationImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${
        thumbnail ? 'w-12 h-12' : 'w-full h-32'
      } ${className}`}>
        <ImageIcon className={`${thumbnail ? 'w-5 h-5' : 'w-8 h-8'} text-muted-foreground`} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${
      thumbnail ? 'w-12 h-12' : 'w-full h-32'
    } ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
};

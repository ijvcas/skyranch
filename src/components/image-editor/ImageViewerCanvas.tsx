
import React from 'react';
import { Transform } from './hooks/useImageViewer';

interface ImageViewerCanvasProps {
  src: string;
  alt: string;
  transform: Transform;
  isDragging: boolean;
  editMode: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  imageRef: React.RefObject<HTMLImageElement>;
  onMouseDown: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
}

const ImageViewerCanvas: React.FC<ImageViewerCanvasProps> = ({
  src,
  alt,
  transform,
  isDragging,
  editMode,
  containerRef,
  imageRef,
  onMouseDown,
  onWheel
}) => {
  const imageStyle = {
    transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
    cursor: editMode && transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      ref={containerRef}
    >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none"
          style={imageStyle}
          draggable={false}
          loading="lazy"
          decoding="async"
        />
    </div>
  );
};

export default ImageViewerCanvas;

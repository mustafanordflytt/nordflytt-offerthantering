"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Share2, 
  RotateCw,
  Eye,
  Calendar,
  MapPin,
  Tag
} from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  showFullscreen?: boolean;
  metadata?: {
    date?: string;
    location?: string;
    category?: string;
    description?: string;
    fileSize?: number;
    dimensions?: { width: number; height: number };
  };
}

interface FullscreenViewProps {
  src: string;
  alt: string;
  metadata?: ImagePreviewProps['metadata'];
  onClose: () => void;
}

function FullscreenView({ src, alt, metadata, onClose }: FullscreenViewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nordflytt-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Nedladdning misslyckades:", error);
    }
  }, [src]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: alt,
          text: metadata?.description || "Bild från Nordflytt",
          url: src
        });
      } catch (error) {
        console.error("Delning misslyckades:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(src);
        // You could show a toast here
      } catch (error) {
        console.error("Kunde inte kopiera länk:", error);
      }
    }
  }, [src, alt, metadata]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - position.x, 
        y: e.clientY - position.y 
      });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="font-medium truncate">{alt}</h2>
          <Badge variant="secondary" className="text-xs">
            {Math.round(zoom * 100)}%
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={handleZoomOut} variant="ghost" size="sm" className="text-white">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button onClick={handleZoomIn} variant="ghost" size="sm" className="text-white">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={handleRotate} variant="ghost" size="sm" className="text-white">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleDownload} variant="ghost" size="sm" className="text-white">
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={handleShare} variant="ghost" size="sm" className="text-white">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="flex-1 flex items-center justify-center overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-none max-h-none select-none"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onDoubleClick={resetView}
          draggable={false}
        />
      </div>

      {/* Metadata Panel */}
      {metadata && (
        <div className="bg-black/80 text-white p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {metadata.date && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{new Date(metadata.date).toLocaleDateString('sv-SE')}</span>
              </div>
            )}
            
            {metadata.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">{metadata.location}</span>
              </div>
            )}
            
            {metadata.category && (
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <span>{metadata.category}</span>
              </div>
            )}
            
            {metadata.fileSize && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Storlek:</span>
                <span>{(metadata.fileSize / 1024).toFixed(0)} KB</span>
              </div>
            )}
          </div>
          
          {metadata.description && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-sm text-gray-300">{metadata.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Mobile Controls */}
      <div className="md:hidden bg-black/80 p-4">
        <div className="flex justify-center space-x-4">
          <Button onClick={handleZoomOut} variant="ghost" size="lg" className="text-white">
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button onClick={resetView} variant="ghost" size="lg" className="text-white">
            <Eye className="h-5 w-5" />
          </Button>
          <Button onClick={handleZoomIn} variant="ghost" size="lg" className="text-white">
            <ZoomIn className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ImagePreview({ 
  src, 
  alt, 
  className = "",
  showFullscreen = true,
  metadata 
}: ImagePreviewProps) {
  const [showFullView, setShowFullView] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setImageError(true);
  }, []);

  const handleClick = useCallback(() => {
    if (showFullscreen && !imageError) {
      setShowFullView(true);
    }
  }, [showFullscreen, imageError]);

  if (imageError) {
    return (
      <div className={`bg-gray-100 rounded flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-300 flex items-center justify-center">
            <X className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-500">Kunde inte ladda bild</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative overflow-hidden rounded ${className} ${
          showFullscreen ? 'cursor-pointer' : ''
        }`}
        onClick={handleClick}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
          </div>
        )}

        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-all duration-200 ${
            showFullscreen ? 'hover:scale-105' : ''
          } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Overlay for fullscreen hint */}
        {showFullscreen && !isLoading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="bg-white/90 rounded-full p-2">
              <ZoomIn className="h-4 w-4 text-gray-700" />
            </div>
          </div>
        )}

        {/* Metadata badge */}
        {metadata?.category && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs bg-black/70 text-white">
              {metadata.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Fullscreen View */}
      {showFullView && (
        <FullscreenView
          src={src}
          alt={alt}
          metadata={metadata}
          onClose={() => setShowFullView(false)}
        />
      )}
    </>
  );
}
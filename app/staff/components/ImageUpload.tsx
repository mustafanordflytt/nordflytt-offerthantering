"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Camera, 
  Upload, 
  X, 
  FileImage, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import CameraCapture from "./CameraCapture";
import ImagePreview from "./ImagePreview";

interface ImageFile {
  file: File;
  preview: string;
  id: string;
  description?: string;
  category?: string;
}

interface ImageUploadProps {
  onUpload: (files: ImageFile[]) => Promise<void>;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  categories?: string[];
  allowCamera?: boolean;
  allowGallery?: boolean;
  jobId?: string;
  title?: string;
  description?: string;
}

export default function ImageUpload({
  onUpload,
  maxFiles = 5,
  maxFileSize = 10,
  categories = ["Skada", "Problem", "Före", "Efter", "Övrigt"],
  allowCamera = true,
  allowGallery = true,
  jobId,
  title = "Ladda upp bilder",
  description = "Ta bilder eller välj från galleriet"
}: ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return "Endast bildfiler är tillåtna";
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `Filen är för stor (${fileSizeMB.toFixed(1)}MB). Max ${maxFileSize}MB tillåtet.`;
    }

    return null;
  }, [maxFileSize]);

  const addImageFile = useCallback((file: File, preview: string, description?: string) => {
    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    if (images.length >= maxFiles) {
      setError(`Maximum ${maxFiles} bilder tillåtet`);
      return;
    }

    const imageFile: ImageFile = {
      file,
      preview,
      id: generateId(),
      description,
      category: categories[0]
    };

    setImages(prev => [...prev, imageFile]);
    setError(null);
  }, [images.length, maxFiles, categories, validateFile]);

  const handleCameraCapture = useCallback((file: File, preview: string) => {
    addImageFile(file, preview, "Tagen med kamera");
    setShowCamera(false);
  }, [addImageFile]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          addImageFile(file, e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addImageFile]);

  const updateImageData = useCallback((id: string, updates: Partial<Pick<ImageFile, 'description' | 'category'>>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const compressImage = useCallback((file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920px width)
        const maxWidth = 1920;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (images.length === 0) {
      setError("Inga bilder att ladda upp");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Compress images
      const compressedImages = await Promise.all(
        images.map(async (img) => {
          setUploadProgress(prev => ({ ...prev, [img.id]: 10 }));
          const compressedFile = await compressImage(img.file);
          setUploadProgress(prev => ({ ...prev, [img.id]: 50 }));
          return { ...img, file: compressedFile };
        })
      );

      // Upload images
      await onUpload(compressedImages);

      // Update progress
      images.forEach(img => {
        setUploadProgress(prev => ({ ...prev, [img.id]: 100 }));
      });

      // Clear images after successful upload
      setTimeout(() => {
        setImages([]);
        setUploadProgress({});
      }, 1000);

    } catch (err) {
      console.error("Uppladdningsfel:", err);
      setError(err instanceof Error ? err.message : "Uppladdning misslyckades");
    } finally {
      setIsUploading(false);
    }
  }, [images, onUpload, compressImage]);

  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
        title="Ta bild för uppdrag"
        description="Dokumentera skador, problem eller framsteg"
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Actions */}
          <div className="grid grid-cols-2 gap-3">
            {allowCamera && (
              <Button
                onClick={() => setShowCamera(true)}
                variant="outline"
                className="h-12 text-left justify-start"
                disabled={isUploading || images.length >= maxFiles}
              >
                <Camera className="h-5 w-5 mr-2" />
                Ta bild
              </Button>
            )}
            
            {allowGallery && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-12 text-left justify-start"
                disabled={isUploading || images.length >= maxFiles}
              >
                <Upload className="h-5 w-5 mr-2" />
                Välj från galleri
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{images.length} / {maxFiles} bilder</span>
            <span>Total: {totalSizeMB}MB</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Images Grid */}
          {images.length > 0 && (
            <div className="space-y-3">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <ImagePreview
                        src={image.preview}
                        alt="Uppladdad bild"
                        className="w-16 h-16 object-cover rounded"
                      />
                      {uploadProgress[image.id] !== undefined && (
                        <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                          {uploadProgress[image.id] === 100 ? (
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          ) : (
                            <div className="text-white text-xs">
                              {uploadProgress[image.id]}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {image.file.name}
                        </span>
                        <Button
                          onClick={() => removeImage(image.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {(image.file.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>

                  {/* Category and Description */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`category-${image.id}`} className="text-xs">
                        Kategori
                      </Label>
                      <select
                        id={`category-${image.id}`}
                        value={image.category}
                        onChange={(e) => updateImageData(image.id, { category: e.target.value })}
                        className="w-full text-sm border rounded px-2 py-1"
                        disabled={isUploading}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor={`desc-${image.id}`} className="text-xs">
                        Beskrivning
                      </Label>
                      <Input
                        id={`desc-${image.id}`}
                        value={image.description || ''}
                        onChange={(e) => updateImageData(image.id, { description: e.target.value })}
                        placeholder="Beskriv bilden..."
                        className="text-sm"
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {images.length > 0 && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Laddar upp...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Ladda upp {images.length} {images.length === 1 ? 'bild' : 'bilder'}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
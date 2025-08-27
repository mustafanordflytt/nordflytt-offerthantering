"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, FlipHorizontal, Download, X, RefreshCw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File, preview: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
  quality?: number;
}

export default function CameraCapture({
  onCapture,
  onClose,
  title = "Ta bild",
  description = "Centrera objektet i kameran och tryck på knappen för att ta en bild",
  quality = 0.8
}: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      let errorMessage = "Kunde inte starta kameran";
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = "Kameraåtkomst nekad. Aktivera kameraåtkomst i inställningar.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "Ingen kamera hittades på enheten.";
        } else if (err.name === 'NotSupportedError') {
          errorMessage = "Kameran stöds inte av denna webbläsare.";
        }
      }
      
      setError(errorMessage);
      console.error("Kamerafel:", err);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    try {
      setIsCapturing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Kunde inte få canvas context");
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0);

      // Convert canvas to blob with compression
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Kunde inte skapa bildfil"));
            }
          },
          'image/jpeg',
          quality
        );
      });

      // Create file from blob
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `nordflytt-${timestamp}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Create preview URL
      const previewUrl = canvas.toDataURL('image/jpeg', quality);

      // Stop camera and call onCapture
      stopCamera();
      onCapture(file, previewUrl);

      // Haptic feedback if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

    } catch (err) {
      console.error("Fel vid bildtagning:", err);
      setError("Kunde inte ta bild. Försök igen.");
    } finally {
      setIsCapturing(false);
    }
  }, [isStreaming, quality, onCapture, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(current => current === "user" ? "environment" : "user");
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Start camera when component mounts
  useState(() => {
    startCamera();
    return () => stopCamera();
  });

  // Restart camera when facing mode changes
  useState(() => {
    if (isStreaming) {
      startCamera();
    }
  });

  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Kamera ej tillgänglig
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Kamerafunktionen stöds inte av denna webbläsare eller enhet.
          </p>
          <Button onClick={onClose} variant="outline" className="w-full">
            Stäng
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={handleClose} variant="ghost" size="sm">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {error ? (
          <Card className="mx-4 w-full max-w-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Camera className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium">Kamerafel</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <div className="space-y-2">
                  <Button onClick={startCamera} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Försök igen
                  </Button>
                  <Button onClick={handleClose} variant="outline" className="w-full">
                    Stäng
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {/* Camera overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-30">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>
              
              {/* Center focus indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-24 h-24 border-2 border-white rounded-lg opacity-60" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {/* Switch Camera */}
          <Button
            onClick={switchCamera}
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full p-0"
            disabled={!isStreaming || isCapturing}
          >
            <FlipHorizontal className="h-5 w-5" />
          </Button>

          {/* Capture Button */}
          <Button
            onClick={capturePhoto}
            disabled={!isStreaming || isCapturing}
            size="lg"
            className="w-16 h-16 rounded-full p-0 bg-blue-600 hover:bg-blue-700 relative"
          >
            {isCapturing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </Button>

          {/* Facing mode indicator */}
          <div className="w-12 h-12 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">
              {facingMode === "user" ? "Fram" : "Bak"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
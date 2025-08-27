'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle,
  Shield,
  Play,
  Pause,
  ShieldCheck,
  ShieldOff,
  Siren
} from 'lucide-react';

interface Props {
  onPauseAll: () => void;
  onProtectMode: () => void;
  isPaused: boolean;
  isProtectionMode: boolean;
}

const EmergencyControls: React.FC<Props> = ({ 
  onPauseAll, 
  onProtectMode, 
  isPaused, 
  isProtectionMode 
}) => {
  const [showConfirmPause, setShowConfirmPause] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePauseClick = () => {
    if (!isPaused) {
      setShowConfirmPause(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    } else {
      // Resume
      onPauseAll();
      setShowConfirmPause(false);
    }
  };

  const confirmPause = () => {
    onPauseAll();
    setShowConfirmPause(false);
  };

  const handleProtectClick = () => {
    onProtectMode();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="emergency-controls-container">
      {/* Main Control Buttons */}
      <div className="flex justify-center gap-4 my-4">
        <Button 
          onClick={handlePauseClick}
          size="lg"
          className={`
            px-8 py-6 text-xl font-bold transition-all duration-300 transform
            ${isPaused 
              ? 'bg-green-600 hover:bg-green-700 hover:scale-105' 
              : 'bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg'
            }
            ${isAnimating && !isPaused ? 'animate-shake' : ''}
          `}
        >
          {isPaused ? (
            <>
              <Play className="h-6 w-6 mr-2" />
              ÅTERUPPTA
            </>
          ) : (
            <>
              <Siren className="h-6 w-6 mr-2 animate-pulse" />
              🚨 PAUSA ALLT
            </>
          )}
        </Button>

        <Button 
          onClick={handleProtectClick}
          size="lg"
          className={`
            px-8 py-6 text-xl font-bold transition-all duration-300 transform
            ${isProtectionMode 
              ? 'bg-blue-700 hover:bg-blue-800' 
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg'
            }
            ${isAnimating && !isProtectionMode ? 'animate-pulse' : ''}
          `}
        >
          {isProtectionMode ? (
            <>
              <ShieldCheck className="h-6 w-6 mr-2" />
              🛡️ SKYDD AKTIVT
            </>
          ) : (
            <>
              <Shield className="h-6 w-6 mr-2" />
              🛡️ SKYDDA
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmPause && !isPaused && (
        <Alert className="max-w-md mx-auto mb-4 bg-red-50 border-red-300 animate-slide-down">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium text-red-900">
                Är du säker? Detta pausar ALLA aktiva kampanjer.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={confirmPause}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Ja, pausa alla
                </Button>
                <Button 
                  onClick={() => setShowConfirmPause(false)}
                  size="sm"
                  variant="outline"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Indicators */}
      <div className="flex justify-center gap-6 mt-2 text-sm">
        {isPaused && (
          <div className="flex items-center gap-2 text-yellow-600 animate-pulse">
            <Pause className="h-4 w-4" />
            <span className="font-medium">Alla kampanjer pausade</span>
          </div>
        )}
        
        {isProtectionMode && (
          <div className="flex items-center gap-2 text-blue-600">
            <ShieldCheck className="h-4 w-4 animate-pulse" />
            <span className="font-medium">Max bedrägeri-skydd aktivt</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyControls;
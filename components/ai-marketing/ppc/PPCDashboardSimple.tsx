'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp,
  Shield,
  Brain,
  Wifi,
  ShieldCheck,
  Award,
  HeartHandshake,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const PPCDashboardSimple: React.FC = () => {
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
  const [lastUpdate] = useState(new Date());

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('ppc_view_mode');
    if (saved === 'simple' || saved === 'advanced') {
      setViewMode(saved);
    }
  }, []);

  // Save preference when changed
  const toggleViewMode = () => {
    const newMode = viewMode === 'simple' ? 'advanced' : 'simple';
    setViewMode(newMode);
    localStorage.setItem('ppc_view_mode', newMode);
  };

  return (
    <div className="space-y-6">
      {/* Trust Header with Toggle */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-600 animate-pulse" />
              <span className="text-sm font-medium">Live data</span>
              <Badge variant="outline" className="text-xs">
                Uppdaterad {lastUpdate.toLocaleTimeString('sv-SE')}
              </Badge>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <Badge className="bg-green-100 text-green-800">
              <ShieldCheck className="h-3 w-3 mr-1" />
              98% datakvalitet
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleViewMode}
            className="flex items-center gap-2"
          >
            {viewMode === 'simple' ? (
              <>
                <Eye className="h-4 w-4" />
                Avancerad vy
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Enkel vy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Simple View */}
      {viewMode === 'simple' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Enkel vy - Snabböversikt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Dagens resultat</h3>
                  <p className="text-2xl font-bold">69,150 kr vinst</p>
                  <p className="text-sm text-gray-600">ROAS: 4.2x</p>
                </div>
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI-rekommendation:</strong> Öka Google-budget med 15,000 kr för 
                    pianoflytt-kampanjen. Förväntad extra vinst: 28,000 kr.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Advanced View */}
      {viewMode === 'advanced' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Avancerad vy - Detaljerad analys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Dagens resultat</h3>
                    <p className="text-2xl font-bold">69,150 kr vinst</p>
                    <p className="text-sm text-gray-600">ROAS: 4.2x</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Jämfört med förra veckan: +23%
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Fraud Protection</h3>
                    <p className="text-2xl font-bold">12,450 kr sparat</p>
                    <p className="text-sm text-gray-600">47 hot blockerade</p>
                    <p className="text-xs text-gray-500 mt-2">
                      5 konkurrent-IP identifierade
                    </p>
                  </div>
                </div>
                
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI-rekommendation:</strong> Öka Google-budget med 15,000 kr för 
                    pianoflytt-kampanjen. Förväntad extra vinst: 28,000 kr.
                    <br />
                    <span className="text-xs text-gray-600">
                      Baserat på 340% ökning i sökningar för "pianoflytt Stockholm".
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Plattformsprestanda</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Google Ads</span>
                      <Badge className="bg-green-100 text-green-800">ROAS: 4.2x</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Meta</span>
                      <Badge className="bg-yellow-100 text-yellow-800">ROAS: 2.8x</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bing</span>
                      <Badge className="bg-green-100 text-green-800">ROAS: 5.1x</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extra card only in advanced view */}
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Resultat</CardTitle>
            </CardHeader>
            <CardContent>
              <p>3 aktiva tester pågår med 94% signifikans på bästa varianten.</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Trust Footer */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Alla data krypterad</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartHandshake className="h-4 w-4 text-blue-600" />
              <span>100% transparent</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-purple-600" />
              <span>Google Premier Partner</span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Få hjälp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PPCDashboardSimple;
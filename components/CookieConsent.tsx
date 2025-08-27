'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Cookie, Settings, Shield, BarChart3, Megaphone, Wrench } from 'lucide-react';
import { analyticsConfig } from '@/lib/analytics/config';
import { trackGTMCookieConsent } from '@/lib/analytics/google-tag-manager';
import type { CookieConsent as CookieConsentType } from '@/lib/analytics/types';

interface CookiePreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    analytics: false,
    marketing: false,
    functional: true, // Functional cookies are essential
  });

  useEffect(() => {
    // Don't show cookie banner on staff routes
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/staff')) {
      return;
    }
    
    // Check if user has already given consent
    const savedConsent = getCookieConsent();
    if (!savedConsent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Apply saved preferences
      applyPreferences(savedConsent);
    }
  }, []);

  const getCookieConsent = (): CookieConsentType | null => {
    if (typeof window === 'undefined') return null;
    
    const consent = localStorage.getItem(analyticsConfig.cookieConsent.cookieName);
    if (consent) {
      try {
        return JSON.parse(consent);
      } catch {
        return null;
      }
    }
    return null;
  };

  const saveCookieConsent = (consent: CookiePreferences) => {
    const consentData: CookieConsentType = {
      ...consent,
      timestamp: Date.now(),
    };

    // Save to localStorage
    localStorage.setItem(
      analyticsConfig.cookieConsent.cookieName,
      JSON.stringify(consentData)
    );

    // Set expiry cookie
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + analyticsConfig.cookieConsent.cookieExpiry);
    document.cookie = `${analyticsConfig.cookieConsent.cookieName}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

    // Track consent in GTM
    trackGTMCookieConsent(consentData);

    // Apply preferences
    applyPreferences(consentData);
  };

  const applyPreferences = (consent: CookieConsentType) => {
    // Enable/disable tracking based on consent
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (consent.analytics && window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      } else if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
        });
      }

      // Facebook Pixel and marketing cookies
      if (consent.marketing && window.fbq) {
        window.fbq('consent', 'grant');
      } else if (window.fbq) {
        window.fbq('consent', 'revoke');
      }

      // Functional cookies are always allowed
      // Add any functional cookie logic here
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allAccepted);
    saveCookieConsent(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptSelected = () => {
    saveCookieConsent(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    const allRejected: CookiePreferences = {
      analytics: false,
      marketing: false,
      functional: true, // Functional cookies cannot be rejected
    };
    setPreferences(allRejected);
    saveCookieConsent(allRejected);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && !showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Vi värnar om din integritet</h3>
                  <p className="text-sm text-gray-600">
                    Vi använder cookies för att förbättra din upplevelse, analysera trafik och visa relevanta annonser. 
                    Du kan välja vilka cookies du godkänner.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Inställningar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectAll}
                >
                  Avböj alla
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Acceptera alla
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Cookie-inställningar
            </DialogTitle>
            <DialogDescription>
              Hantera dina cookie-preferenser. Du kan aktivera eller inaktivera olika typer av cookies nedan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Functional Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-5 w-5" />
                  Nödvändiga cookies
                </CardTitle>
                <CardDescription>
                  Dessa cookies är nödvändiga för att webbplatsen ska fungera korrekt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="functional" className="flex-1 cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Inkluderar: sessionshantering, säkerhet, formulärdata
                    </span>
                  </Label>
                  <Switch
                    id="functional"
                    checked={true}
                    disabled
                    className="opacity-50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5" />
                  Analyscookies
                </CardTitle>
                <CardDescription>
                  Hjälper oss förstå hur besökare använder vår webbplats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="analytics" className="flex-1 cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Inkluderar: Google Analytics, användarbeteende, sidvisningar
                    </span>
                  </Label>
                  <Switch
                    id="analytics"
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, analytics: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Marketing Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Megaphone className="h-5 w-5" />
                  Marknadsföringscookies
                </CardTitle>
                <CardDescription>
                  Används för att visa relevanta annonser och mäta kampanjeffektivitet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing" className="flex-1 cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Inkluderar: Facebook Pixel, Google Ads, remarketing
                    </span>
                  </Label>
                  <Switch
                    id="marketing"
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, marketing: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Din integritet är viktig för oss</h4>
              <p className="text-sm text-gray-600 mb-2">
                Vi behandlar dina personuppgifter i enlighet med GDPR. Du kan när som helst 
                ändra dina inställningar eller återkalla ditt samtycke.
              </p>
              <a 
                href="/integritetspolicy" 
                className="text-sm text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Läs vår integritetspolicy
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Avbryt
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRejectAll}
              >
                Avböj alla
              </Button>
              <Button
                onClick={handleAcceptSelected}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Spara inställningar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook to check cookie consent status
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentType | null>(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem(analyticsConfig.cookieConsent.cookieName);
    if (savedConsent) {
      try {
        setConsent(JSON.parse(savedConsent));
      } catch {
        setConsent(null);
      }
    }
  }, []);

  return consent;
}
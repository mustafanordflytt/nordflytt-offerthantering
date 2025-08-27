'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { X, Cookie, Shield, BarChart, Users } from 'lucide-react';
import { analytics } from './GoogleAnalytics';
import { fbPixel } from './FacebookPixel';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = 'nordflytt_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'nordflytt_cookie_preferences';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: true,
    preferences: true
  });

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      setShowBanner(true);
    } else {
      // Load saved preferences
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        setPreferences(prefs);
        applyCookiePreferences(prefs);
      }
    }
  }, []);

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Enable/disable tracking based on preferences
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      
      // Google Analytics consent mode
      window.gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        functionality_storage: prefs.preferences ? 'granted' : 'denied',
        personalization_storage: prefs.preferences ? 'granted' : 'denied'
      });

      // Track consent given
      if (prefs.analytics) {
        analytics.trackEvent('cookie_consent_given', {
          analytics: prefs.analytics,
          marketing: prefs.marketing,
          preferences: prefs.preferences
        });
      }
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    applyCookiePreferences(allAccepted);
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    applyCookiePreferences(preferences);
    setShowBanner(false);
    setShowDetails(false);
  };

  const handleRejectAll = () => {
    const rejected = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(rejected));
    setPreferences(rejected);
    applyCookiePreferences(rejected);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/20 backdrop-blur-sm">
      <Card className="max-w-4xl mx-auto p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Cookie className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Vi använder cookies</h3>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Vi använder cookies för att förbättra din upplevelse, analysera trafik och leverera 
          AI-drivna flyttjänster. Som världens mest avancerade AI-flyttföretag använder vi data 
          för att optimera våra ML-prediktioner och ge dig bättre service.
        </p>

        {!showDetails ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAcceptAll}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Acceptera alla
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
            >
              Endast nödvändiga
            </Button>
            <Button
              onClick={() => setShowDetails(true)}
              variant="ghost"
            >
              Anpassa inställningar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Nödvändiga cookies</h4>
                    <p className="text-sm text-gray-600">
                      Krävs för att webbplatsen ska fungera korrekt
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.necessary}
                  disabled
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Analyser</h4>
                    <p className="text-sm text-gray-600">
                      Hjälper oss förstå hur du använder våra AI-tjänster
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, analytics: checked }))
                  }
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium">Marknadsföring</h4>
                    <p className="text-sm text-gray-600">
                      Personanpassade annonser och ML-optimerade erbjudanden
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, marketing: checked }))
                  }
                />
              </div>

              {/* Preference Cookies */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Cookie className="w-5 h-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium">Inställningar</h4>
                    <p className="text-sm text-gray-600">
                      Kommer ihåg dina val och AI-preferenser
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.preferences}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, preferences: checked }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAcceptSelected}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Spara inställningar
              </Button>
              <Button
                onClick={() => setShowDetails(false)}
                variant="outline"
              >
                Tillbaka
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          Genom att använda vår webbplats godkänner du vår{' '}
          <a href="/privacy" className="underline hover:text-purple-600">
            integritetspolicy
          </a>{' '}
          och{' '}
          <a href="/cookies" className="underline hover:text-purple-600">
            cookiepolicy
          </a>
          . Dina data används för att förbättra våra AI-prediktioner.
        </p>
      </Card>
    </div>
  );
}

// Cookie consent helper functions
export const cookieConsent = {
  // Check if user has consented to specific cookie type
  hasConsent: (type: keyof CookiePreferences): boolean => {
    if (typeof window === 'undefined') return false;
    
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!savedPreferences) return false;
    
    const preferences = JSON.parse(savedPreferences);
    return preferences[type] || false;
  },

  // Update consent preferences
  updateConsent: (type: keyof CookiePreferences, value: boolean) => {
    if (typeof window === 'undefined') return;
    
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
    
    preferences[type] = value;
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    
    // Update Google consent mode
    if (type === 'analytics') {
      window.gtag('consent', 'update', {
        analytics_storage: value ? 'granted' : 'denied'
      });
    } else if (type === 'marketing') {
      window.gtag('consent', 'update', {
        ad_storage: value ? 'granted' : 'denied'
      });
    }
  },

  // Get all consent preferences
  getPreferences: (): CookiePreferences | null => {
    if (typeof window === 'undefined') return null;
    
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    return savedPreferences ? JSON.parse(savedPreferences) : null;
  },

  // Reset consent (for testing or user request)
  resetConsent: () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    window.location.reload();
  }
};
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Smartphone, QrCode, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BankIDAuthProps {
  personalNumber?: string;
  onSuccess: (completionData: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

// BankID hint code messages
const HINT_MESSAGES: Record<string, string> = {
  outstandingTransaction: 'Starta BankID-appen',
  userSign: 'Skriv in din säkerhetskod i BankID-appen',
  started: 'Söker efter BankID, det kan ta en liten stund...',
  userMrtd: 'Lägg ditt körkort eller nationella ID-kort mot baksidan av telefonen',
  userCallConfirm: 'Svara på samtalet från BankID på din telefon',
};

export function BankIDAuth({ personalNumber, onSuccess, onError, onCancel }: BankIDAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authState, setAuthState] = useState<'idle' | 'authenticating' | 'complete' | 'error'>('idle');
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{ token: string; secret: string } | null>(null);
  const [hintCode, setHintCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Start authentication
  const startAuth = async () => {
    try {
      setIsLoading(true);
      setAuthState('authenticating');
      setErrorMessage('');

      const response = await fetch('/api/bankid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalNumber: personalNumber || '', // Om inget personnummer finns, skicka tom sträng för "samma enhet"
          action: 'auth',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('BankID API error:', data);
        throw new Error(data.message || data.error || 'Failed to start authentication');
      }

      setOrderRef(data.orderRef);
      if (data.qrStartToken && data.qrStartSecret) {
        setQrData({
          token: data.qrStartToken,
          secret: data.qrStartSecret,
        });
      }

      // Open BankID app on mobile
      if (data.bankIdUrl && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = data.bankIdUrl;
      }

      // Start polling for status
      startPolling(data.orderRef);
    } catch (error) {
      console.error('Auth error:', error);
      setAuthState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
      onError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for authentication status
  const startPolling = (ref: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/bankid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef: ref,
            action: 'status',
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Status check failed');
        }

        // Update hint code
        if (data.hintCode) {
          setHintCode(data.hintCode);
        }

        // Handle completion
        if (data.status === 'complete') {
          setAuthState('complete');
          stopPolling();
          onSuccess(data.completionData);
        }

        // Handle failure
        if (data.status === 'failed') {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Polling error:', error);
        stopPolling();
        setAuthState('error');
        setErrorMessage('Authentication failed');
        onError('Authentication failed');
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Cancel authentication
  const cancelAuth = useCallback(async () => {
    stopPolling();

    if (orderRef) {
      try {
        await fetch('/api/bankid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef,
            action: 'cancel',
          }),
        });
      } catch (error) {
        console.error('Cancel error:', error);
      }
    }

    setAuthState('idle');
    setOrderRef(null);
    setQrData(null);
    setHintCode('');
    
    if (onCancel) {
      onCancel();
    }
  }, [orderRef, onCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);


  if (authState === 'idle') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identifiera dig med BankID</CardTitle>
          <CardDescription>
            För att fortsätta med din bokning behöver vi verifiera din identitet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Vi behöver verifiera din identitet för att slutföra bokningen.
          </div>
          <Button 
            onClick={startAuth} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Startar BankID...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Öppna Mobilt BankID
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (authState === 'authenticating') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Väntar på BankID</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mobile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mobile">
                <Smartphone className="h-4 w-4 mr-2" />
                Mobilt BankID
              </TabsTrigger>
              <TabsTrigger value="qr">
                <QrCode className="h-4 w-4 mr-2" />
                QR-kod
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="mobile" className="space-y-4">
              <div className="flex justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {HINT_MESSAGES[hintCode] || 'Öppna BankID-appen på din telefon'}
              </p>
            </TabsContent>
            
            <TabsContent value="qr" className="space-y-4">
              {qrData && (
                <div className="flex justify-center py-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <QrCode className="h-32 w-32" />
                    <p className="text-xs text-center mt-2">QR-kod för BankID</p>
                  </div>
                </div>
              )}
              <p className="text-center text-sm text-muted-foreground">
                Skanna QR-koden med BankID-appen
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={cancelAuth}>
              Avbryt
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (authState === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identifiering klar!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Din identitet har verifierats med BankID
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (authState === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Något gick fel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || 'Identifieringen misslyckades. Försök igen.'}
            </AlertDescription>
          </Alert>
          <Button onClick={startAuth} className="w-full">
            Försök igen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
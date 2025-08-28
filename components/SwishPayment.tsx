"use client";

import { useState, useEffect } from 'react';
import { QrCode, Smartphone, CheckCircle, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
// @ts-ignore
import { QRCode } from 'qrcode.react';

interface SwishPaymentProps {
  amount: number;
  bookingReference: string;
  customerPhone: string;
  onPaymentComplete: (paymentId: string) => void;
  onCancel?: () => void;
}

export function SwishPayment({
  amount,
  bookingReference,
  customerPhone,
  onPaymentComplete,
  onCancel,
}: SwishPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [paymentId, setPaymentId] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [copied, setCopied] = useState(false);

  const swishNumber = '1236721476'; // Nordflytt's Swish number
  const swishMessage = `NORDFLYTT ${bookingReference}`;

  // Generate Swish deep link
  const swishDeepLink = `swish://payment?data={"version":1,"payee":{"value":"${swishNumber}"},"amount":{"value":${amount}},"message":{"value":"${swishMessage}"}}`;

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
  };

  // Copy Swish number to clipboard
  const copySwishNumber = async () => {
    try {
      await navigator.clipboard.writeText(swishNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Initialize payment
  useEffect(() => {
    initializePayment();
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus === 'pending' || paymentStatus === 'processing') {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            setPaymentStatus('failed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus]);

  const initializePayment = async () => {
    try {
      // Create payment request
      const response = await fetch('/api/swish/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          bookingReference,
          customerPhone,
          message: swishMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentId(data.paymentId);
        startPollingPaymentStatus(data.paymentId);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      setPaymentStatus('failed');
    }
  };

  const startPollingPaymentStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/swish/payment-status/${id}`);
        const data = await response.json();

        if (data.status === 'PAID') {
          setPaymentStatus('completed');
          clearInterval(interval);
          onPaymentComplete(id);
        } else if (data.status === 'ERROR' || data.status === 'CANCELLED') {
          setPaymentStatus('failed');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openSwishApp = () => {
    window.location.href = swishDeepLink;
    setPaymentStatus('processing');
  };

  if (paymentStatus === 'completed') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-900">Betalning genomförd!</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Din förskottsbetalning har mottagits och din bokning är bekräftad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Betalningsreferens:</span>
                <span className="font-mono text-sm">{paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Belopp:</span>
                <span className="font-semibold">{amount} kr</span>
              </div>
            </div>
          </div>
          <Alert className="bg-green-100 border-green-300">
            <AlertDescription className="text-green-800">
              En bekräftelse har skickats till din e-post och SMS.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-red-900">Betalningen misslyckades</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            Vi kunde inte genomföra betalningen. Vänligen försök igen eller kontakta kundtjänst.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={initializePayment} variant="default">
              Försök igen
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                Avbryt
              </Button>
            )}
          </div>
          <Separator />
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Behöver du hjälp?</p>
            <Button variant="link" onClick={() => window.location.href = 'tel:08123456'}>
              Ring oss: 08-123 456 78
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-6 w-6 text-primary" />
              <CardTitle>Betala med Swish</CardTitle>
            </div>
            <Badge variant={paymentStatus === 'processing' ? 'default' : 'secondary'}>
              {paymentStatus === 'processing' ? 'Väntar på betalning' : 'Väntar'}
            </Badge>
          </div>
          <CardDescription>
            Betala enkelt och säkert med Swish för att bekräfta din bokning
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Payment amount */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Betalningsinformation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Bokningsnummer:</span>
            <span className="font-mono text-sm">{bookingReference}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Att betala:</span>
            <span className="text-2xl font-bold">{amount} kr</span>
          </div>
          <Separator />
          <Alert>
            <AlertDescription className="text-sm">
              Detta är en förskottsbetalning för din flytt. Slutfaktura skickas efter genomförd flytt.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Payment methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QR Code method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Skanna QR-kod
            </CardTitle>
            <CardDescription>
              Öppna Swish och skanna koden
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <QRCode
                value={swishDeepLink}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Skanna med Swish-appen för att betala
            </p>
          </CardContent>
        </Card>

        {/* Manual method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Betala manuellt
            </CardTitle>
            <CardDescription>
              Swisha direkt från denna enhet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Swish-nummer:</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold">{swishNumber}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copySwishNumber}
                    className="h-8 px-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Meddelande:</p>
                <span className="font-mono text-sm">{swishMessage}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Belopp:</p>
                <span className="font-semibold">{amount} kr</span>
              </div>
            </div>
            <Separator />
            <Button onClick={openSwishApp} className="w-full" size="lg">
              Öppna Swish
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status and timer */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {paymentStatus === 'processing' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Väntar på betalning...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium">Inväntar betalning</span>
                </>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Tid kvar: <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel button */}
      {onCancel && (
        <div className="text-center">
          <Button onClick={onCancel} variant="ghost">
            Avbryt betalning
          </Button>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from 'react';
import { BankIDAuth } from '@/components/BankIDAuth';
import { CreditCheckResult } from '@/components/CreditCheckResult';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function CreditCheckDemo() {
  const [personalNumber, setPersonalNumber] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  
  const {
    state: creditCheckState,
    personalNumber: authenticatedPN,
    startCreditCheck,
    handleAuthSuccess,
    handleAuthError,
    handleAuthCancel,
    reset: resetCreditCheck,
  } = useCreditCheck();

  // Format personal number
  const formatPersonalNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 8) {
      return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}`;
    }
    return cleaned;
  };

  const handleStart = () => {
    if (personalNumber.replace(/\D/g, '').length >= 10) {
      startCreditCheck(personalNumber);
      setShowAuth(true);
    }
  };

  const handleReset = () => {
    resetCreditCheck();
    setShowAuth(false);
    setPersonalNumber('');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Creditsafe Integration Demo</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Credentials</CardTitle>
          <CardDescription>
            Use these sandbox credentials for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Username:</p>
              <code className="bg-gray-100 px-2 py-1 rounded">FLYTTSVETESTIN</code>
            </div>
            <div>
              <p className="font-medium">Password:</p>
              <code className="bg-gray-100 px-2 py-1 rounded">Flyttsvetestin123!</code>
            </div>
          </div>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This is a sandbox environment. No real credit checks will be performed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {!showAuth && creditCheckState.status === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Start Credit Check</CardTitle>
            <CardDescription>
              Enter a Swedish personal number to begin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personal-number">Personal Number</Label>
              <Input
                id="personal-number"
                type="text"
                placeholder="ÅÅÅÅMMDD-XXXX"
                value={personalNumber}
                onChange={(e) => setPersonalNumber(formatPersonalNumber(e.target.value))}
                maxLength={13}
              />
            </div>
            <Button 
              onClick={handleStart}
              disabled={personalNumber.replace(/\D/g, '').length < 10}
              className="w-full"
            >
              Start BankID Authentication
            </Button>
          </CardContent>
        </Card>
      )}

      {showAuth && creditCheckState.status === 'authenticating' && (
        <BankIDAuth
          personalNumber={personalNumber}
          onSuccess={handleAuthSuccess}
          onError={handleAuthError}
          onCancel={handleAuthCancel}
        />
      )}

      {creditCheckState.status === 'checking' && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">Performing credit check...</p>
              <p className="text-sm text-muted-foreground mt-2">This usually takes a few seconds</p>
            </div>
          </CardContent>
        </Card>
      )}

      {creditCheckState.status === 'complete' && creditCheckState.result && (
        <div className="space-y-6">
          <CreditCheckResult
            status={creditCheckState.result.status}
            rejectCode={creditCheckState.result.rejectCode}
            rejectReason={creditCheckState.result.rejectReason}
            requiresDeposit={creditCheckState.result.requiresDeposit}
            depositAmount={creditCheckState.result.depositAmount}
            alternativePaymentOptions={creditCheckState.result.alternativePaymentOptions}
            onAcceptDeposit={() => alert('Deposit accepted - redirect to payment')}
            onChooseAlternative={(option) => alert(`Selected: ${option.description}`)}
            onContactSupport={() => alert('Contact support: 08-123 456 78')}
          />
          
          <div className="text-center">
            <Button variant="outline" onClick={handleReset}>
              Try Another Test
            </Button>
          </div>
        </div>
      )}

      {creditCheckState.status === 'error' && (
        <Card className="border-red-200">
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertDescription>
                {creditCheckState.error || 'An error occurred during the credit check process'}
              </AlertDescription>
            </Alert>
            <div className="text-center mt-4">
              <Button variant="outline" onClick={handleReset}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">Approved Credit Check:</p>
              <p className="text-sm text-muted-foreground">Use personal number: 198502021234</p>
            </div>
            <div>
              <p className="font-medium">Rejected - Payment Remarks:</p>
              <p className="text-sm text-muted-foreground">Use personal number: 199001011234</p>
              <p className="text-xs text-gray-500">Result: Requires 5000 kr deposit</p>
            </div>
            <div>
              <p className="font-medium">Rejected - High Debt:</p>
              <p className="text-sm text-muted-foreground">Use personal number: 197512121234</p>
              <p className="text-xs text-gray-500">Result: Alternative payment options</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
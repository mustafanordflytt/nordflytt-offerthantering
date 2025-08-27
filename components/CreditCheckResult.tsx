"use client";

import { CheckCircle, XCircle, AlertCircle, CreditCard, Smartphone, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface AlternativePaymentOption {
  type: 'direct_payment' | 'swish' | 'contact';
  amount?: number;
  description: string;
}

interface CreditCheckResultProps {
  status: 'approved' | 'rejected';
  rejectCode?: string;
  rejectReason?: string;
  requiresDeposit?: boolean;
  depositAmount?: number;
  alternativePaymentOptions?: AlternativePaymentOption[];
  onAcceptDeposit?: () => void;
  onChooseAlternative?: (option: AlternativePaymentOption) => void;
  onContactSupport?: () => void;
}

export function CreditCheckResult({
  status,
  rejectCode,
  rejectReason,
  requiresDeposit = false,
  depositAmount,
  alternativePaymentOptions = [],
  onAcceptDeposit,
  onChooseAlternative,
  onContactSupport,
}: CreditCheckResultProps) {
  if (status === 'approved' && !requiresDeposit) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-900">Kreditprövning godkänd</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Du kan betala med faktura efter genomförd flytt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-sm">30 dagars betalningsvillkor</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Ingen förskottsbetalning krävs</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'approved' && requiresDeposit) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <CardTitle className="text-orange-900">Kreditprövning godkänd med deposition</CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            En deposition krävs för att slutföra bokningen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-100">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Deposition krävs</AlertTitle>
            <AlertDescription>
              För att slutföra din bokning behöver du betala en deposition på{' '}
              <span className="font-semibold">{depositAmount?.toLocaleString('sv-SE')} kr</span>.
              Resterande belopp faktureras efter flytten.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onAcceptDeposit} className="flex-1">
              Acceptera och betala deposition
            </Button>
            {alternativePaymentOptions.length > 0 && (
              <Button variant="outline" onClick={onContactSupport} className="flex-1">
                Andra alternativ
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rejected
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <XCircle className="h-6 w-6 text-red-600" />
          <CardTitle className="text-red-900">Kreditprövning kunde inte godkännas</CardTitle>
        </div>
        <CardDescription className="text-red-700">
          Vi kan tyvärr inte erbjuda fakturabetalning just nu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rejectReason && (
          <Alert className="border-red-200 bg-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {rejectReason === 'low_credit_score' && 
                'Baserat på kreditupplysningen kan vi inte erbjuda fakturabetalning för denna bokning.'}
              {rejectReason === 'missing_data' && 
                'Vi saknar tillräcklig information för att genomföra kreditprövningen.'}
              {rejectReason === 'technical_error' && 
                'Ett tekniskt fel uppstod. Försök igen senare eller välj ett annat betalningsalternativ.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Tillgängliga betalningsalternativ:</h4>
          
          {alternativePaymentOptions.map((option, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onChooseAlternative?.(option)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {option.type === 'swish' && <Smartphone className="h-5 w-5 text-primary" />}
                    {option.type === 'direct_payment' && <CreditCard className="h-5 w-5 text-primary" />}
                    {option.type === 'contact' && <Phone className="h-5 w-5 text-primary" />}
                    <div>
                      <p className="font-medium text-sm">{option.description}</p>
                      {option.amount && option.amount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {option.amount.toLocaleString('sv-SE')} kr
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">Välj</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-2">
          <Button variant="outline" onClick={onContactSupport} className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            Kontakta kundtjänst för hjälp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
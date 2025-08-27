"use client";

import { CheckCircle, Clock, Calendar, MapPin, Phone, Mail, CreditCard, AlertCircle, Download, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface OrderConfirmationProps {
  bookingData: {
    bookingReference: string;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    };
    moveDetails: {
      moveDate: string;
      startAddress: string;
      endAddress: string;
    };
    totalPrice: number;
    paymentMethod: string;
    paymentStatus?: string;
    swishPaymentId?: string;
  };
}

export function OrderConfirmation({ bookingData }: OrderConfirmationProps) {
  const isPrepaid = bookingData.paymentMethod === 'swish_prepayment' && bookingData.paymentStatus === 'prepaid';
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <CardTitle className="text-2xl text-green-900">Bokning bekräftad!</CardTitle>
              <CardDescription className="text-green-700">
                Din flyttbokning har registrerats framgångsrikt
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Prepayment status */}
      {isPrepaid && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-900">Förskottsbetalning mottagen</CardTitle>
              </div>
              <Badge variant="default" className="bg-blue-600">
                Betald
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Betalningsmetod:</span>
                <span className="font-medium">Swish</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaktions-ID:</span>
                <span className="font-mono text-xs">{bookingData.swishPaymentId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Betalt belopp:</span>
                <span className="font-semibold">{bookingData.totalPrice} kr</span>
              </div>
            </div>
            <Separator className="my-3" />
            <Alert className="bg-blue-100 border-blue-300">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Tack för din förskottsbetalning! Eventuella tilläggskostnader faktureras efter genomförd flytt.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Booking details */}
      <Card>
        <CardHeader>
          <CardTitle>Bokningsdetaljer</CardTitle>
          <CardDescription>Bokningsnummer: {bookingData.bookingReference}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer info */}
          <div>
            <h4 className="font-medium mb-2">Kunduppgifter</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Namn:</span>
                <span>{bookingData.customerInfo.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{bookingData.customerInfo.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{bookingData.customerInfo.phone}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Move details */}
          <div>
            <h4 className="font-medium mb-2">Flyttinformation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(bookingData.moveDetails.moveDate)}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Från:</p>
                    <p className="text-gray-600">{bookingData.moveDetails.startAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Till:</p>
                    <p className="text-gray-600">{bookingData.moveDetails.endAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment info */}
          <div>
            <h4 className="font-medium mb-2">Betalningsinformation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total kostnad:</span>
                <span className="font-semibold text-lg">{bookingData.totalPrice} kr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Betalningsmetod:</span>
                <div className="flex items-center gap-2">
                  {isPrepaid ? (
                    <>
                      <Smartphone className="h-4 w-4" />
                      <span>Förskottsbetald med Swish</span>
                    </>
                  ) : bookingData.paymentMethod === 'invoice' ? (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Faktura (30 dagar)</span>
                    </>
                  ) : (
                    <span>Direktbetalning</span>
                  )}
                </div>
              </div>
              {isPrepaid && (
                <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-300">
                  ✓ Betald
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Vad händer nu?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold text-primary">1.</span>
              <span>Du får en bekräftelse via e-post och SMS inom kort</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Vi kontaktar dig 1-2 dagar före flytten för att bekräfta detaljer</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>Vårt team anländer på avtalad tid på flyttdagen</span>
            </li>
            {!isPrepaid && (
              <li className="flex gap-2">
                <span className="font-semibold text-primary">4.</span>
                <span>Faktura skickas efter genomförd flytt</span>
              </li>
            )}
          </ol>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="default" size="lg" className="gap-2">
          <Download className="h-4 w-4" />
          Ladda ner bekräftelse
        </Button>
        <Button variant="outline" size="lg" onClick={() => window.print()}>
          Skriv ut
        </Button>
      </div>

      {/* Contact info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Har du frågor om din bokning?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="tel:08123456" className="flex items-center gap-2 text-primary hover:underline">
                <Phone className="h-4 w-4" />
                08-123 456 78
              </a>
              <span className="hidden sm:block text-gray-400">•</span>
              <a href="mailto:info@nordflytt.se" className="flex items-center gap-2 text-primary hover:underline">
                <Mail className="h-4 w-4" />
                info@nordflytt.se
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
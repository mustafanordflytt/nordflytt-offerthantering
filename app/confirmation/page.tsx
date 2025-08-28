"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderConfirmation } from '@/components/OrderConfirmation';
import { Loader2 } from 'lucide-react';

function ConfirmationPageInner() {
  const searchParams = useSearchParams();
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get booking data from URL params or localStorage
    const bookingId = searchParams.get('bookingId');
    const bookingReference = searchParams.get('ref');
    
    // In a real app, you would fetch this from the API
    // For demo, we'll use localStorage or URL params
    const storedData = localStorage.getItem('lastBooking');
    
    if (storedData) {
      const data = JSON.parse(storedData);
      setBookingData(data);
    } else {
      // Fallback data for demo
      setBookingData({
        bookingReference: bookingReference || 'NF2024001',
        customerInfo: {
          name: searchParams.get('name') || 'Test Kund',
          email: searchParams.get('email') || 'test@example.com',
          phone: searchParams.get('phone') || '070-123 45 67'
        },
        moveDetails: {
          moveDate: searchParams.get('date') || new Date().toISOString(),
          startAddress: 'Testgatan 1, Stockholm',
          endAddress: 'Flyttgatan 2, Stockholm'
        },
        totalPrice: Number(searchParams.get('amount')) || 3630,
        paymentMethod: searchParams.get('payment') || 'invoice',
        paymentStatus: searchParams.get('status') || 'pending',
        swishPaymentId: searchParams.get('swishId') || undefined
      });
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Ingen bokningsinformation hittades.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <OrderConfirmation bookingData={bookingData} />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#002A5C]" />
      </div>
    }>
      <ConfirmationPageInner />
    </Suspense>
  );
}
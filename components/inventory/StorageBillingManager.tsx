'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export function StorageBillingManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Faktureringshantering
        </h2>
        <p className="text-muted-foreground">Hantera fakturering för kundmagasinering</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Fakturering under utveckling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detta avsnitt kommer snart att innehålla automatisk fakturering, 
            betalningsuppföljning och påminnelser för magasinskunder.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
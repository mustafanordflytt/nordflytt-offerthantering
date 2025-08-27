'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export function ReorderingManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Återbeställningshantering
        </h2>
        <p className="text-muted-foreground">Automatisk och manuell återbeställning av lager</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Återbeställning under utveckling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detta avsnitt kommer snart att innehålla automatisk återbeställning, 
            leverantörshantering och orderuppföljning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
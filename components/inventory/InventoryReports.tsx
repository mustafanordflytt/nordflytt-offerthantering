'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export function InventoryReports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Lagerrapporter
        </h2>
        <p className="text-muted-foreground">Generera och exportera lagerrapporter</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Rapporter under utveckling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detta avsnitt kommer snart att innehålla värderingsrapporter, 
            lageranalyser och exportfunktioner för bokföring.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export function UsageTrackingManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Användningsspårning
        </h2>
        <p className="text-muted-foreground">Spåra och analysera användning av tillgångar</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Användningsspårning under utveckling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detta avsnitt kommer snart att innehålla detaljerad användningsstatistik, 
            trender och kostnadsanalys per uppdrag.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export function MaintenanceManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Underhållshantering
        </h2>
        <p className="text-muted-foreground">Schemalägg och spåra underhåll av tillgångar</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Underhåll under utveckling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detta avsnitt kommer snart att innehålla underhållsscheman, 
            servicehistorik och påminnelser för verktyg och utrustning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Calendar, Clock, DollarSign, Users, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface AutomatedJobCreationProps {
  customerId: string;
  customerData?: any;
}

interface AIOptimization {
  schedule?: {
    scheduledDate: string;
    scheduledTime: string;
    utilizationScore: number;
  };
  pricing?: {
    totalPrice: number;
    confidence: number;
    adjustments: any;
  };
  assignment?: {
    team: {
      id: string;
      name: string;
    };
    matchScore: number;
  };
  confidence?: number;
}

export function AutomatedJobCreation({ customerId, customerData }: AutomatedJobCreationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [aiOptimizations, setAiOptimizations] = useState<AIOptimization | null>(null);
  const [jobCreated, setJobCreated] = useState(false);
  const router = useRouter();

  const handleCreateJob = async () => {
    setCreating(true);
    setAiOptimizations(null);
    
    try {
      // Create AI-optimized job
      const response = await fetch('/api/ai/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          serviceType: 'moving',
          requirements: {
            volume: 30,
            pickupLocation: {
              address: customerData?.address || 'Stockholm',
              coordinates: { lat: 59.3293, lng: 18.0686 },
              floor: 2,
              elevator: true,
              parkingDistance: 10
            },
            deliveryLocation: {
              address: 'Uppsala',
              coordinates: { lat: 59.8586, lng: 17.6389 },
              floor: 1,
              elevator: false,
              parkingDistance: 20
            },
            specialInstructions: ''
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create job');
      }
      
      const result = await response.json();
      
      // Show AI optimizations
      setAiOptimizations(result.aiOptimizations);
      setJobCreated(true);
      
      // Show success toast
      toast({
        title: '✅ Uppdrag skapat med AI!',
        description: `Uppdrag ${result.job.id} har skapats och optimerats av AI.`,
      });
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/crm/uppdrag/${result.job.id}`);
      }, 3000);
      
    } catch (error) {
      console.error('AI job creation failed:', error);
      toast({
        title: '❌ Fel vid skapande',
        description: 'Kunde inte skapa AI-optimerat uppdrag.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
      >
        <Bot className="mr-2 h-4 w-4" />
        AI Nytt Uppdrag
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              AI-Optimerat Uppdrag
            </DialogTitle>
            <DialogDescription>
              AI:n kommer automatiskt att optimera schemaläggning, prissättning och teamtilldelning
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!jobCreated && !creating && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">AI kommer att:</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Optimera schema</p>
                          <p className="text-sm text-muted-foreground">
                            Hitta bästa tiden baserat på team, trafik och kundpreferenser
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Dynamisk prissättning</p>
                          <p className="text-sm text-muted-foreground">
                            Beräkna optimalt pris baserat på marknad och kundvärde
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Välj bästa teamet</p>
                          <p className="text-sm text-muted-foreground">
                            Matcha kompetens och erfarenhet med uppdraget
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleCreateJob}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <Bot className="mr-2 h-5 w-5" />
                  Skapa AI-Optimerat Uppdrag
                </Button>
              </>
            )}

            {creating && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Bot className="h-16 w-16 text-blue-600 animate-pulse mx-auto" />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">AI arbetar...</h3>
                      <p className="text-sm text-muted-foreground">
                        Optimerar schema, pris och teamtilldelning
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Detta tar vanligtvis 5-10 sekunder</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {jobCreated && aiOptimizations && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Uppdrag skapat!</h3>
                  </div>
                  <p className="text-sm text-green-800">
                    AI har framgångsrikt optimerat och skapat uppdraget.
                  </p>
                </div>

                <div className="space-y-3">
                  {aiOptimizations.schedule && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Schema</span>
                          </div>
                          <Badge variant="secondary">
                            {Math.round(aiOptimizations.schedule.utilizationScore * 100)}% optimerat
                          </Badge>
                        </div>
                        <p className="text-sm mt-2">
                          {formatDate(aiOptimizations.schedule.scheduledDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Kl. {aiOptimizations.schedule.scheduledTime}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {aiOptimizations.pricing && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Pris</span>
                          </div>
                          <Badge variant="secondary">
                            {Math.round(aiOptimizations.pricing.confidence * 100)}% säkerhet
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold mt-2">
                          {formatPrice(aiOptimizations.pricing.totalPrice)}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {aiOptimizations.assignment && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Team</span>
                          </div>
                          <Badge variant="secondary">
                            {Math.round(aiOptimizations.assignment.matchScore * 100)}% match
                          </Badge>
                        </div>
                        <p className="text-sm mt-2 font-medium">
                          {aiOptimizations.assignment.team.name}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Omdirigerar till uppdraget om 3 sekunder...
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
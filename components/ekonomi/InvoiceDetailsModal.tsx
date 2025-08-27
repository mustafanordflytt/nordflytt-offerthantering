'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Users, 
  Clock, 
  Calculator,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Download,
  Send,
  Zap
} from 'lucide-react';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: number;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
    auto_created?: boolean;
    fortnox_id?: string;
    rut_application?: {
      id: string;
      status: string;
      total_rut_amount: number;
      submitted_at?: string;
      approved_at?: string;
    };
    services?: Array<{
      description: string;
      hours: number;
      price: number;
      rut_eligible: boolean;
      staff_breakdown?: Array<{
        name: string;
        hours: number;
      }>;
    }>;
    materials?: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    job_details?: {
      from_address: string;
      to_address: string;
      moving_date: string;
      completion_time: string;
      total_staff_hours: number;
    };
  };
}

export function InvoiceDetailsModal({ isOpen, onClose, invoice }: InvoiceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateRUTSavings = () => {
    if (!invoice.services) return 0;
    return invoice.services
      .filter(s => s.rut_eligible)
      .reduce((sum, service) => sum + (service.price * 0.5), 0);
  };

  const getRUTStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Godkänd</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Väntar</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" />Inskickad</Badge>;
      default:
        return <Badge variant="outline">Ej inskickad</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                Faktura {invoice.invoice_number}
                {invoice.auto_created && (
                  <Badge variant="outline" className="ml-2">
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-skapad
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {invoice.customer_name} • {new Date(invoice.created_at).toLocaleDateString('sv-SE')}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Ladda ner
              </Button>
              <Button variant="default" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Skicka igen
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="services">Tjänster</TabsTrigger>
            <TabsTrigger value="staff">Personal</TabsTrigger>
            <TabsTrigger value="rut">RUT-detaljer</TabsTrigger>
            <TabsTrigger value="calculation">Beräkning</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">Kundinformation</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Namn:</span>
                    <span className="text-sm font-medium">{invoice.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fakturanummer:</span>
                    <span className="text-sm font-medium">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">Uppdragsinformation</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {invoice.job_details && (
                    <>
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Från:</span>
                        <span className="text-sm font-medium text-right">{invoice.job_details.from_address}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Till:</span>
                        <span className="text-sm font-medium text-right">{invoice.job_details.to_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Flyttdatum:</span>
                        <span className="text-sm font-medium">{invoice.job_details.moving_date}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</div>
                <div className="text-sm text-muted-foreground">Total faktura</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Calculator className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatCurrency(calculateRUTSavings())}</div>
                <div className="text-sm text-muted-foreground">RUT-avdrag</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{invoice.job_details?.total_staff_hours || 0}h</div>
                <div className="text-sm text-muted-foreground">Total arbetstid</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            <h3 className="font-medium">Utförda tjänster</h3>
            {invoice.services?.map((service, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{service.description}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {service.hours} timmar
                      </span>
                      {service.rut_eligible && (
                        <Badge variant="outline" className="text-xs">
                          RUT-berättigad
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(service.price)}</div>
                    {service.rut_eligible && (
                      <div className="text-xs text-green-600">
                        RUT: -{formatCurrency(service.price * 0.5)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {invoice.materials && invoice.materials.length > 0 && (
              <>
                <Separator />
                <h3 className="font-medium">Material</h3>
                {invoice.materials.map((material, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{material.description}</h4>
                        <span className="text-sm text-muted-foreground">
                          {material.quantity} st × {formatCurrency(material.unit_price)}
                        </span>
                      </div>
                      <div className="font-semibold">{formatCurrency(material.total_price)}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="staff" className="space-y-4 mt-4">
            <h3 className="font-medium">Personalfördelning per tjänst</h3>
            {invoice.services?.map((service, serviceIndex) => (
              <div key={serviceIndex} className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {service.description}
                </h4>
                {service.staff_breakdown && service.staff_breakdown.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {service.staff_breakdown.map((staff, staffIndex) => (
                      <div key={staffIndex} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-sm">{staff.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {staff.hours}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen personalfördelning tillgänglig</p>
                )}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total tid:</span>
                    <span>{service.hours} timmar</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="rut" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  RUT-ansökan
                </h3>
                {getRUTStatusBadge(invoice.rut_application?.status)}
              </div>

              {invoice.rut_application ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Ansöknings-ID:</span>
                        <span className="text-sm font-mono">{invoice.rut_application.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Inskickad:</span>
                        <span className="text-sm">
                          {invoice.rut_application.submitted_at 
                            ? new Date(invoice.rut_application.submitted_at).toLocaleDateString('sv-SE')
                            : 'Ej inskickad'}
                        </span>
                      </div>
                      {invoice.rut_application.approved_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Godkänd:</span>
                          <span className="text-sm">
                            {new Date(invoice.rut_application.approved_at).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Total RUT-avdrag</div>
                        <div className="text-2xl font-bold text-green-700">
                          {formatCurrency(invoice.rut_application.total_rut_amount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">RUT-berättigade tjänster</h4>
                    {invoice.services?.filter(s => s.rut_eligible).map((service, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-sm">{service.description}</span>
                        <div className="text-sm text-right">
                          <span className="text-muted-foreground">{service.hours}h × 450 kr/h × 50% = </span>
                          <span className="font-medium">{formatCurrency(service.hours * 450 * 0.5)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p>Ingen RUT-ansökan har skapats för denna faktura</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calculation" className="space-y-4 mt-4">
            <h3 className="font-medium">Detaljerad beräkning</h3>
            <div className="border rounded-lg p-4 space-y-3">
              {/* Services */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Tjänster</h4>
                {invoice.services?.map((service, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{service.description} ({service.hours}h)</span>
                    <span>{formatCurrency(service.price)}</span>
                  </div>
                ))}
              </div>

              {/* Materials */}
              {invoice.materials && invoice.materials.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Material</h4>
                    {invoice.materials.map((material, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{material.description} ({material.quantity} st)</span>
                        <span>{formatCurrency(material.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              {/* Subtotal */}
              <div className="flex justify-between font-medium">
                <span>Delsumma (före moms)</span>
                <span>{formatCurrency(invoice.total_amount / 1.25)}</span>
              </div>

              {/* VAT */}
              <div className="flex justify-between text-sm">
                <span>Moms (25%)</span>
                <span>{formatCurrency(invoice.total_amount - (invoice.total_amount / 1.25))}</span>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Totalt att betala</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>

              {/* RUT info */}
              {calculateRUTSavings() > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Kunden sparar med RUT-avdrag:</span>
                    <span className="font-bold text-green-700">{formatCurrency(calculateRUTSavings())}</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
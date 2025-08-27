'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Calendar, MapPin, Phone, Clock, Plus, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OrderService {
  id: string
  serviceId: string
  name: string
  quantity: number
  price: number
  addedAt: string
  addedBy: string
  addedDuringJob?: boolean
}

interface OrderConfirmation {
  customerName: string
  bookingNumber: string
  orderDate: string
  services: OrderService[]
  lastUpdated: string
  originalBooking?: {
    fromAddress: string
    toAddress: string
    moveDate: string
    estimatedVolume: number
    basePrice: number
  }
}

interface OrderConfirmationViewProps {
  bookingNumber: string
  onClose?: () => void
}

export default function OrderConfirmationView({ bookingNumber, onClose }: OrderConfirmationViewProps) {
  const [orderData, setOrderData] = useState<OrderConfirmation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load order data from localStorage
    const flyttparm = JSON.parse(localStorage.getItem('customer_flyttparm') || '{}')
    const order = flyttparm[bookingNumber]
    
    if (order) {
      setOrderData(order)
    }
    
    setLoading(false)
  }, [bookingNumber])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C]"></div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Ingen orderbekräftelse hittades för {bookingNumber}</p>
      </div>
    )
  }

  const totalAdditionalCost = orderData.services.reduce((sum, service) => sum + (service.price * service.quantity), 0)
  const groupedServices = orderData.services.reduce((acc, service) => {
    const key = service.addedDuringJob ? 'during' : 'before'
    if (!acc[key]) acc[key] = []
    acc[key].push(service)
    return acc
  }, {} as Record<string, OrderService[]>)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="bg-[#002A5C] text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Orderbekräftelse
            </CardTitle>
            <p className="text-sm text-gray-200 mt-1">Bokningsnummer: {bookingNumber}</p>
          </div>
          <Badge variant="secondary" className="bg-white text-[#002A5C]">
            <CheckCircle className="h-4 w-4 mr-1" />
            Bekräftad
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Customer Info */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-[#002A5C]" />
            Kundinformation
          </h3>
          <div className="pl-6 text-sm text-gray-600">
            <p>{orderData.customerName}</p>
            <p className="text-xs text-gray-500">Bokad: {new Date(orderData.orderDate).toLocaleDateString('sv-SE')}</p>
          </div>
        </div>

        {/* Original Booking (if available) */}
        {orderData.originalBooking && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#002A5C]" />
              Grundbokning
            </h3>
            <div className="pl-6 text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{orderData.originalBooking.fromAddress} → {orderData.originalBooking.toAddress}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{orderData.originalBooking.moveDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Volym: {orderData.originalBooking.estimatedVolume} m³</span>
                <span className="font-medium">{orderData.originalBooking.basePrice} kr</span>
              </div>
            </div>
          </div>
        )}

        {/* Services added before job */}
        {groupedServices.before && groupedServices.before.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#002A5C]" />
              Förbeställda tjänster
            </h3>
            <div className="pl-6 space-y-2">
              {groupedServices.before.map(service => (
                <div key={service.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {service.quantity}x {service.name}
                  </span>
                  <span className="font-medium">{service.price * service.quantity} kr</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services added during job */}
        {groupedServices.during && groupedServices.during.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-600" />
              Tillagda tjänster under uppdrag
            </h3>
            <div className="pl-6 space-y-2">
              {groupedServices.during.map(service => (
                <div key={service.id} className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {service.quantity}x {service.name}
                    </span>
                    <span className="font-medium text-green-600">+{service.price * service.quantity} kr</span>
                  </div>
                  <div className="text-xs text-gray-500 pl-4">
                    Tillagt av {service.addedBy} • {new Date(service.addedAt).toLocaleString('sv-SE')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        {totalAdditionalCost > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Totalt tilläggskostnad:</span>
              <span className="text-lg font-bold text-green-600">+{totalAdditionalCost} kr</span>
            </div>
          </div>
        )}

        {/* Last updated */}
        <div className="text-xs text-gray-500 text-center pt-2">
          Senast uppdaterad: {new Date(orderData.lastUpdated).toLocaleString('sv-SE')}
        </div>

        {/* Actions */}
        {onClose && (
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Stäng
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
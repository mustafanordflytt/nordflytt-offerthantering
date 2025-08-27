'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Users, Brain } from 'lucide-react'

interface BookingVerification {
  booking?: any
  customer?: any
  quote?: any
  aiTrigger?: boolean
  errors?: string[]
}

export default function VerifyBookingPage() {
  const [verification, setVerification] = useState<BookingVerification>({})
  const [loading, setLoading] = useState(true)
  const targetBookingRef = 'NF-23857BDE'
  const targetEmail = 'mustafa.abdulkarim@hotmail.com'

  const checkBooking = async () => {
    setLoading(true)
    try {
      // Check debug endpoint
      const response = await fetch(`/api/debug/recent-bookings?ref=${targetBookingRef}&email=${targetEmail}`)
      const data = await response.json()
      
      if (data.success) {
        setVerification({
          booking: data.syncAnalysis?.bookingDetails,
          customer: data.syncAnalysis?.bookingDetails?.customerData,
          errors: data.syncAnalysis?.targetBookingFound ? [] : ['Booking not found in database']
        })
      }
      
      // Also check offers API
      const offersResponse = await fetch('/api/offers')
      const offers = await offersResponse.json()
      const targetOffer = offers.find((o: any) => 
        o.quote_number === targetBookingRef || 
        o.customer_email === targetEmail
      )
      
      if (targetOffer) {
        setVerification(prev => ({
          ...prev,
          quote: targetOffer
        }))
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerification({
        errors: ['Failed to verify booking']
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkBooking()
  }, [])

  const getStatusIcon = (exists: boolean) => {
    return exists ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM Integration Verification</h1>
        <Button onClick={checkBooking} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking {targetBookingRef}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Database Check */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Database Sync</p>
                <p className="text-sm text-gray-600">
                  {verification.booking ? 'Booking found in database' : 'Booking not found'}
                </p>
              </div>
            </div>
            {getStatusIcon(!!verification.booking)}
          </div>

          {/* Customer Link Check */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Customer Profile</p>
                <p className="text-sm text-gray-600">
                  {verification.customer ? `Linked to: ${verification.customer.name}` : 'No customer link'}
                </p>
              </div>
            </div>
            {getStatusIcon(!!verification.customer)}
          </div>

          {/* AI System Check */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">AI Customer Service</p>
                <p className="text-sm text-gray-600">
                  Check server logs for AI trigger confirmation
                </p>
              </div>
            </div>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </div>

          {/* Booking Details */}
          {verification.booking && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Booking Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span> {verification.booking.id}
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>{' '}
                  <Badge variant="default">{verification.booking.status}</Badge>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>{' '}
                  {new Date(verification.booking.created_at).toLocaleString('sv-SE')}
                </div>
                <div>
                  <span className="text-gray-600">Price:</span> {verification.booking.total_price} kr
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">From:</span> {verification.booking.start_address}
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">To:</span> {verification.booking.end_address}
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {verification.errors && verification.errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Issues Found</h3>
              <ul className="list-disc list-inside text-sm text-red-700">
                {verification.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(verification, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
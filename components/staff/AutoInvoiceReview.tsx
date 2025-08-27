'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, Check, X, DollarSign } from 'lucide-react'

interface AutoInvoicedJob {
  id: string
  customerName: string
  address: string
  invoicedHours: number
  invoiceAmount: number
  autoInvoicedAt: string
  bookingNumber: string
}

export default function AutoInvoiceReview() {
  const [autoInvoicedJobs, setAutoInvoicedJobs] = useState<AutoInvoicedJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAutoInvoicedJobs()
  }, [])

  const fetchAutoInvoicedJobs = async () => {
    try {
      // Hämta jobb som auto-fakturerats och väntar på bekräftelse
      const response = await fetch('/api/staff/auto-invoiced-jobs')
      const data = await response.json()
      
      if (data.jobs) {
        setAutoInvoicedJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error fetching auto-invoiced jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (jobId: string) => {
    try {
      const response = await fetch('/api/staff/confirm-auto-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action: 'confirm' })
      })
      
      if (response.ok) {
        // Ta bort från listan
        setAutoInvoicedJobs(jobs => jobs.filter(j => j.id !== jobId))
        alert('✅ Faktura bekräftad!')
      }
    } catch (error) {
      alert('❌ Kunde inte bekräfta faktura')
    }
  }

  const handleAdjust = async (jobId: string, actualHours: number, reason: string) => {
    try {
      const response = await fetch('/api/staff/adjust-auto-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId, 
          actualHours,
          reason,
          action: 'adjust' 
        })
      })
      
      if (response.ok) {
        alert('✅ Justering begärd! Admin kommer granska och godkänna.')
        setAutoInvoicedJobs(jobs => jobs.filter(j => j.id !== jobId))
      }
    } catch (error) {
      alert('❌ Kunde inte begära justering')
    }
  }

  if (loading) {
    return <div className="p-4">Laddar...</div>
  }

  if (autoInvoicedJobs.length === 0) {
    return (
      <Card className="m-4">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Inga auto-fakturerade jobb att granska
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Granska auto-fakturerade jobb</AlertTitle>
        <AlertDescription>
          Dessa jobb fakturerades automatiskt kl 18:00. Vänligen bekräfta att tiden stämmer.
        </AlertDescription>
      </Alert>

      {autoInvoicedJobs.map((job) => (
        <JobReviewCard 
          key={job.id} 
          job={job} 
          onConfirm={handleConfirm}
          onAdjust={handleAdjust}
        />
      ))}
    </div>
  )
}

function JobReviewCard({ job, onConfirm, onAdjust }: {
  job: AutoInvoicedJob
  onConfirm: (jobId: string) => void
  onAdjust: (jobId: string, hours: number, reason: string) => void
}) {
  const [adjusting, setAdjusting] = useState(false)
  const [actualHours, setActualHours] = useState(job.invoicedHours.toString())
  const [reason, setReason] = useState('')

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.customerName}</CardTitle>
            <CardDescription>{job.address}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-yellow-50">
            Auto-fakturerad
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Fakturerade timmar</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {job.invoicedHours}h
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fakturerat belopp</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {job.invoiceAmount} kr
              </p>
            </div>
          </div>

          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <AlertDescription>
              Fakturan skapades automatiskt {new Date(job.autoInvoicedAt).toLocaleString('sv-SE')} 
              eftersom jobbet inte avslutades manuellt.
            </AlertDescription>
          </Alert>

          {!adjusting ? (
            <div className="flex gap-2">
              <Button 
                onClick={() => onConfirm(job.id)}
                className="flex-1 h-12 text-lg"
                variant="default"
              >
                <Check className="mr-2 h-5 w-5" />
                Bekräfta {job.invoicedHours}h
              </Button>
              <Button 
                onClick={() => setAdjusting(true)}
                variant="outline"
                className="flex-1 h-12 text-lg"
              >
                <X className="mr-2 h-5 w-5" />
                Justera tid
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="actual-hours">Faktiska timmar</Label>
                <Input
                  id="actual-hours"
                  type="number"
                  step="0.5"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  className="text-lg h-12"
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Anledning till justering</Label>
                <Textarea
                  id="reason"
                  placeholder="T.ex. Jobbet tog längre tid pga..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onAdjust(job.id, parseFloat(actualHours), reason)
                  }}
                  disabled={!reason || actualHours === job.invoicedHours.toString()}
                  className="flex-1 h-12"
                >
                  Begär justering
                </Button>
                <Button
                  onClick={() => {
                    setAdjusting(false)
                    setActualHours(job.invoicedHours.toString())
                    setReason('')
                  }}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
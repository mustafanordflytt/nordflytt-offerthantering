'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import { useLeads } from '@/lib/store'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function NewLeadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createLead, isLoading } = useLeads()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    priority: 'medium',
    estimatedValue: '',
    expectedCloseDate: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Namn är obligatoriskt'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email är obligatoriskt'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ogiltigt email-format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefonnummer är obligatoriskt'
    }

    if (!formData.source) {
      newErrors.source = 'Källa är obligatoriskt'
    }

    if (formData.estimatedValue && isNaN(Number(formData.estimatedValue))) {
      newErrors.estimatedValue = 'Uppskattat värde måste vara ett nummer'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await createLead({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: formData.source as any,
        priority: formData.priority as any,
        estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : 0,
        expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : undefined,
        assignedTo: 'pending', // Will be assigned automatically
        notes: formData.notes
      })

      // Create lead via API
      const leadResponse = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          source: formData.source,
          priority: formData.priority,
          estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : 0,
          expectedCloseDate: formData.expectedCloseDate,
          notes: formData.notes
        })
      })

      if (leadResponse.ok) {
        const leadData = await leadResponse.json();
        
        // Automatically assign the lead
        const assignResponse = await fetch('/api/leads/auto-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: leadData.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            source: formData.source,
            urgency: formData.priority === 'high' ? 'high' : formData.priority === 'low' ? 'low' : 'medium',
            serviceType: 'residential', // Default for now
            location: 'Stockholm' // Would get from form in real implementation
          })
        });

        if (assignResponse.ok) {
          const assignResult = await assignResponse.json();
          toast({
            title: "Lead skapad och tilldelad! ✅",
            description: `Lead har automatiskt tilldelats till ${assignResult.assignedTo || 'en säljare'}.`,
          })
        } else {
          toast({
            title: "Lead skapad",
            description: "Lead sparad men kunde inte tilldelas automatiskt.",
          })
        }
        
        router.push('/crm/leads')
      } else {
        throw new Error('Failed to create lead')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Kunde inte skapa leaden. Försök igen.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/crm/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka till Leads
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ny Lead</h1>
          <p className="text-gray-600">Skapa en ny potentiell kund i sales pipeline</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
          <CardDescription>
            Fyll i informationen för den nya leaden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Kundnamn eller företag"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+46 70 123 45 67"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="namn@exempel.se"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Lead Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Källa *</Label>
                <Select 
                  value={formData.source} 
                  onValueChange={(value) => handleInputChange('source', value)}
                >
                  <SelectTrigger className={errors.source ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Välj källa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Webbplats</SelectItem>
                    <SelectItem value="referral">Referens</SelectItem>
                    <SelectItem value="marketing">Marknadsföring</SelectItem>
                    <SelectItem value="cold_call">Kall Kontakt</SelectItem>
                    <SelectItem value="other">Annat</SelectItem>
                  </SelectContent>
                </Select>
                {errors.source && <p className="text-sm text-red-500">{errors.source}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioritet</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Låg</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">Hög</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Uppskattat Värde (kr)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  min="0"
                  value={formData.estimatedValue}
                  onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                  placeholder="25000"
                  className={errors.estimatedValue ? 'border-red-500' : ''}
                />
                {errors.estimatedValue && <p className="text-sm text-red-500">{errors.estimatedValue}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate">Förväntat Avslut</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
                />
              </div>
            </div>

            {/* Automatic assignment notice */}
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    <strong>Automatisk tilldelning:</strong> Denna lead kommer automatiskt att tilldelas till den mest lämpliga säljaren baserat på arbetsbelastning, kompetens och geografisk plats.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Anteckningar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Ytterligare information om leaden..."
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/crm/leads">
                <Button type="button" variant="outline">
                  Avbryt
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-[#002A5C] hover:bg-[#001a42]"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Sparar...' : 'Spara Lead'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
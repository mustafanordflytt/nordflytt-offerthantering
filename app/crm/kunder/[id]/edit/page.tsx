'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, User, Building2, Save, Trash2 } from 'lucide-react'
import { useCustomers } from '@/lib/store'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  customerType: 'private' | 'business'
  notes: string
}

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const { updateCustomer, deleteCustomer } = useCustomers()
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    customerType: 'private' as 'private' | 'business',
    notes: ''
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  const fetchCustomer = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/crm/customers/${customerId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer')
      }
      
      const data = await response.json()
      const customerData = data.customer
      
      setCustomer(customerData)
      setFormData({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        customerType: customerData.customerType,
        notes: customerData.notes || ''
      })
    } catch (error) {
      console.error('Error fetching customer:', error)
      setErrors({ fetch: 'Failed to load customer data' })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Namn är obligatoriskt'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-post är obligatoriskt'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ogiltig e-postadress'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefonnummer är obligatoriskt'
    } else if (!/^[\+]?[\d\s\-\(\)]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Ogiltigt telefonnummer'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Update customer via API
      const response = await fetch(`/api/crm/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update customer')
      }
      
      // Update local store
      await updateCustomer(customerId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        customerType: formData.customerType,
        notes: formData.notes,
        updatedAt: new Date()
      })
      
      // Redirect back to customer details
      router.push(`/crm/kunder/${customerId}`)
      
    } catch (error) {
      console.error('Error updating customer:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Ett fel uppstod vid uppdatering av kund' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      // Delete customer via API
      const response = await fetch(`/api/crm/customers/${customerId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete customer')
      }
      
      // Update local store
      await deleteCustomer(customerId)
      
      // Redirect to customers list
      router.push('/crm/kunder')
      
    } catch (error) {
      console.error('Error deleting customer:', error)
      setErrors({ 
        delete: error instanceof Error ? error.message : 'Ett fel uppstod vid borttagning av kund' 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar kunddata...</p>
          </div>
        </div>
      </div>
    )
  }

  if (errors.fetch || !customer) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{errors.fetch || 'Kunden kunde inte hittas'}</p>
            <div className="mt-4 space-x-2">
              <Button onClick={fetchCustomer}>Försök igen</Button>
              <Button variant="outline" onClick={() => router.back()}>Gå tillbaka</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Redigera Kund</h1>
            <p className="text-gray-600">Uppdatera kundinformation för {customer.name}</p>
          </div>
        </div>
        
        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Ta bort kund
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort kund</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill ta bort {customer.name}? 
                Denna åtgärd kan inte ångras och kunden kommer att tas bort permanent.
                <br /><br />
                <strong>Obs:</strong> Kunder med befintliga bokningar kan inte tas bort.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Tar bort...' : 'Ta bort'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Kundinformation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="customerType">Kundtyp</Label>
                <Select 
                  value={formData.customerType} 
                  onValueChange={(value: 'private' | 'business') => handleInputChange('customerType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj kundtyp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Privatkund
                      </div>
                    </SelectItem>
                    <SelectItem value="business">
                      <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Företagskund
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Namn {formData.customerType === 'business' ? '(Företagsnamn)' : ''} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={formData.customerType === 'business' ? 'Ange företagsnamn' : 'Ange för- och efternamn'}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-post *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="namn@exempel.se"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+46 70 123 45 67"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Anteckningar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Valfria anteckningar om kunden..."
                  rows={3}
                />
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Delete Error */}
              {errors.delete && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.delete}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#002A5C] hover:bg-[#001a42]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sparar...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Spara Ändringar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Viktigt att veta</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ändringar av e-post och telefon kan påverka befintliga bokningar</li>
                      <li>Kunder med aktiva bokningar kan inte tas bort</li>
                      <li>Alla ändringar loggas för revision</li>
                      <li>SMS och e-post notifikationer skickas till den uppdaterade kontaktinformationen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
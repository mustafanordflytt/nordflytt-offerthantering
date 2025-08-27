'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Save,
  Search,
  User,
  AlertTriangle,
  HelpCircle,
  Bug,
  CreditCard,
  FileText,
  Plus,
  X,
  Paperclip
} from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  customerType: 'private' | 'business'
}

// Mock customers - in real app this would come from API
const mockCustomers: Customer[] = [
  {
    id: 'f1916745-dc9c-4eee-943d-da636b90c258',
    name: 'Mustafa Abdulkarim',
    email: 'mustafa.abdulkarim@hotmail.com',
    phone: '+46 72 368 39 67',
    customerType: 'private'
  },
  {
    id: 'fa0163ee-eb44-42f5-8d5c-abe33e16460d',
    name: 'Anna Svensson',
    email: 'anna.svensson@example.com',
    phone: '+46 70 123 45 67',
    customerType: 'private'
  },
  {
    id: '3948fa65-28e4-4427-ad56-c378bada3d84',
    name: 'Marcus Johansson',
    email: 'marcus.j@email.com',
    phone: '+46 70 987 65 43',
    customerType: 'business'
  }
]

interface TicketForm {
  title: string
  description: string
  type: 'complaint' | 'inquiry' | 'technical' | 'billing' | 'general' | ''
  priority: 'low' | 'medium' | 'high' | 'urgent' | ''
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  assignedTo: string
  tags: string[]
  isUrgent: boolean
  requiresResponse: boolean
  escalate: boolean
}

export default function NewTicketPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<TicketForm>({
    title: '',
    description: '',
    type: '',
    priority: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    assignedTo: '',
    tags: [],
    isUrgent: false,
    requiresResponse: true,
    escalate: false
  })
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  )

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone
    }))
    setShowCustomerSearch(false)
    setCustomerSearch('')
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Titel är obligatorisk'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Beskrivning är obligatorisk'
    }
    if (!formData.type) {
      newErrors.type = 'Ärendetyp är obligatorisk'
    }
    if (!formData.priority) {
      newErrors.priority = 'Prioritet är obligatorisk'
    }
    if (!formData.customerId) {
      newErrors.customer = 'Kund måste väljas'
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
      // Here you would typically send the data to your API
      // const response = await fetch('/api/crm/tickets', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate ticket number
      const ticketNumber = `TK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      
      router.push('/crm/arenden')
    } catch (error) {
      console.error('Error creating ticket:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'inquiry': return <HelpCircle className="h-4 w-4 text-blue-600" />
      case 'technical': return <Bug className="h-4 w-4 text-purple-600" />
      case 'billing': return <CreditCard className="h-4 w-4 text-green-600" />
      case 'general': return <FileText className="h-4 w-4 text-gray-600" />
      default: return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/crm/arenden">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nytt Ärende</h1>
            <p className="text-gray-600">Skapa ett nytt support ärende</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Grundläggande information</CardTitle>
                <CardDescription>
                  Fyll i grundläggande information om ärendet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Kortfattad beskrivning av ärendet"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Beskrivning *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detaljerad beskrivning av ärendet..."
                    rows={6}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Ärendetyp *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Välj ärendetyp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complaint">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span>Klagomål</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="inquiry">
                          <div className="flex items-center space-x-2">
                            <HelpCircle className="h-4 w-4 text-blue-600" />
                            <span>Förfrågan</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="technical">
                          <div className="flex items-center space-x-2">
                            <Bug className="h-4 w-4 text-purple-600" />
                            <span>Tekniskt</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="billing">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-green-600" />
                            <span>Faktura</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="general">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span>Allmänt</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioritet *</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Välj prioritet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Låg</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">Hög</SelectItem>
                        <SelectItem value="urgent">Akut</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.priority && <p className="text-sm text-red-600 mt-1">{errors.priority}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Kund *</CardTitle>
                <CardDescription>
                  Välj kund som ärendet gäller
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!formData.customerId ? (
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Sök efter kund..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          setShowCustomerSearch(true)
                        }}
                        onFocus={() => setShowCustomerSearch(true)}
                        className={`pl-10 ${errors.customer ? 'border-red-500' : ''}`}
                      />
                    </div>
                    
                    {showCustomerSearch && customerSearch && (
                      <div className="mt-2 border rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleCustomerSelect(customer)}
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.email}</div>
                              <div className="text-sm text-gray-600">{customer.phone}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500 text-center">
                            Ingen kund hittades
                          </div>
                        )}
                      </div>
                    )}
                    {errors.customer && <p className="text-sm text-red-600 mt-1">{errors.customer}</p>}
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{formData.customerName}</div>
                        <div className="text-sm text-gray-600">{formData.customerEmail}</div>
                        <div className="text-sm text-gray-600">{formData.customerPhone}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          customerId: '',
                          customerName: '',
                          customerEmail: '',
                          customerPhone: ''
                        }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags and Options */}
            <Card>
              <CardHeader>
                <CardTitle>Taggar och alternativ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Taggar</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      placeholder="Lägg till tagg..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer">
                          {tag}
                          <X 
                            className="h-3 w-3 ml-1" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent"
                      checked={formData.isUrgent}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isUrgent: checked as boolean }))
                      }
                    />
                    <Label htmlFor="urgent">Markera som akut ärende</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires-response"
                      checked={formData.requiresResponse}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, requiresResponse: checked as boolean }))
                      }
                    />
                    <Label htmlFor="requires-response">Kräver svar från kund</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="escalate"
                      checked={formData.escalate}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, escalate: checked as boolean }))
                      }
                    />
                    <Label htmlFor="escalate">Eskalera direkt till chef</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Tilldelning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={formData.assignedTo} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tilldela personal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ej tilldelad</SelectItem>
                    <SelectItem value="staff-1">Erik Andersson</SelectItem>
                    <SelectItem value="staff-2">Sofia Lindberg</SelectItem>
                    <SelectItem value="staff-3">Henrik Karlsson</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Paperclip className="h-5 w-5 mr-2" />
                  Bilagor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" className="w-full">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Bifoga filer
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Max 10MB per fil. Tillåtna format: PDF, JPG, PNG, DOC, DOCX
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#002A5C] hover:bg-[#001a42]"
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Skapar ärende...' : 'Skapa ärende'}
                  </Button>
                  <Link href="/crm/arenden">
                    <Button type="button" variant="outline" className="w-full">
                      Avbryt
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  AlertCircle,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'

const availableSkills = [
  'Packning av kundens bohag', // Obligatorisk för alla roller
  'Projektledning',
  'Teamledning',
  'Kundservice',
  'Kvalitetssäkring',
  'Schemaläggning',
  'Tunga lyft',
  'Möbelmontering',
  'Lastbilskörning',
  'Lyfttruck-behörighet',
  'B-körkort',
  'C-körkort',
  'CE-körkort',
  'Inventering',
  'Flyttstädning',
  'Fönsterputsning',
  'Städning',
  'Språk (Engelska)',
  'Språk (Tyska)',
  'Språk (Franska)',
  'Stortransporter',
  'Geografikunskap',
  'Säkerhetsrutiner',
  'IT-support',
  'Ekonomi',
  'Försäljning'
]

export default function NewStaffPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Packning av kundens bohag'])
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, variant?: 'default' | 'destructive'} | null>(null)
  
  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    address: '',
    emergencyContact: '',
    hireDate: '',
    notes: '',
    salary: '',
    employmentType: 'full_time'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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
      newErrors.phone = 'Telefon är obligatoriskt'
    }

    if (!formData.role) {
      newErrors.role = 'Roll är obligatorisk'
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Avdelning är obligatorisk'
    }

    if (!formData.hireDate) {
      // Set default hire date to today
      formData.hireDate = new Date().toISOString().split('T')[0]
    }
    
    // Validate salary if provided
    if (formData.salary && isNaN(parseFloat(formData.salary))) {
      newErrors.salary = 'Lön måste vara ett nummer'
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

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setToastMessage({
        title: "Formulärfel",
        description: "Vänligen korrigera felen innan du fortsätter.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const newStaff = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        hireDate: formData.hireDate || new Date().toISOString(),
        skills: selectedSkills,
        notes: formData.notes,
        department: formData.department,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        employmentType: formData.employmentType
      }

      // Call API to create staff member
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStaff)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create staff member' }))
        throw new Error(errorData.error || 'Failed to create staff member')
      }

      await response.json() // Vi behöver inte resultatet
      
      setToastMessage({
        title: "Anställd skapad",
        description: `${formData.name} har lagts till i systemet.`,
        variant: "default"
      })

      // Vänta lite så användaren ser meddelandet
      setTimeout(() => {
        router.push('/crm/anstallda')
      }, 1000)
    } catch (error: any) {
      setToastMessage({
        title: "Fel",
        description: error.message || "Kunde inte skapa anställd. Försök igen.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/anstallda">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Personal
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ny Anställd</h1>
          <p className="text-gray-600">Lägg till en ny medarbetare i systemet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Grundläggande Information
            </CardTitle>
            <CardDescription>
              Fyll i den anställdes personliga uppgifter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fullständigt Namn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Förnamn Efternamn"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-postadress *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="namn@nordflytt.se"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+46 70 123 45 67"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adress</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Stad eller region"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Nödkontakt</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Namn, telefonnummer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Arbetsinformation
            </CardTitle>
            <CardDescription>
              Definiera roll, avdelning och anställningsdetaljer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Roll *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Välj roll" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administratör</SelectItem>
                    <SelectItem value="manager">Chef</SelectItem>
                    <SelectItem value="mover">Flyttare</SelectItem>
                    <SelectItem value="driver">Chaufför</SelectItem>
                    <SelectItem value="customer_service">Kundtjänst</SelectItem>
                    <SelectItem value="cleaner">Städare</SelectItem>
                    <SelectItem value="office">Kontorspersonal</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.role}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Avdelning *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="T.ex. Operations, Ledning"
                  className={errors.department ? 'border-red-500' : ''}
                />
                {errors.department && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.department}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Anställningsform</Label>
                <Select value={formData.employmentType} onValueChange={(value) => handleInputChange('employmentType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Heltid</SelectItem>
                    <SelectItem value="part_time">Deltid</SelectItem>
                    <SelectItem value="contractor">Konsult</SelectItem>
                    <SelectItem value="intern">Praktikant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hireDate">Anställningsdatum *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  className={errors.hireDate ? 'border-red-500' : ''}
                />
                {errors.hireDate && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.hireDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Lön (valfritt)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  placeholder="Månadslön i SEK"
                  className={errors.salary ? 'border-red-500' : ''}
                />
                {errors.salary && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.salary}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Kompetenser
            </CardTitle>
            <CardDescription>
              Välj relevanta färdigheter och certifieringar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableSkills.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill}
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <Label htmlFor={skill} className="text-sm cursor-pointer">
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Anteckningar</CardTitle>
            <CardDescription>
              Ytterligare information om den anställde
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Särskilda kvalifikationer, tidigare erfarenhet, arbetsinstruktioner..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/crm/anstallda">
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="bg-[#002A5C] hover:bg-[#001a42]">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sparar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Skapa Anställd
              </>
            )}
          </Button>
        </div>
      </form>
      
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg ${
            toastMessage.variant === 'destructive' 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            <h3 className="font-bold">{toastMessage.title}</h3>
            <p>{toastMessage.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}
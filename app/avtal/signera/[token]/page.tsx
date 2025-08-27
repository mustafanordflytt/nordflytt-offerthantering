'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Building, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  PenTool,
  Clock,
  Shield
} from 'lucide-react'

interface ContractData {
  contract: any
  employee: any
  template: any
  companyInfo: any
  signingRequirements: any
}

export default function ContractSigningPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [contractData, setContractData] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Signeringsformulär
  const [formData, setFormData] = useState({
    bank: '',
    clearingNumber: '',
    accountNumber: '',
    clothingSize: '',
    emergencyContact: '',
    specialRequests: '',
    signature: ''
  })

  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    fetchContractData()
  }, [token])

  const fetchContractData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contracts/${token}`)
      const data = await response.json()

      if (response.ok) {
        setContractData(data)
      } else {
        setError(data.error || 'Kunde inte ladda avtalet')
      }
    } catch (error) {
      console.error('Fel vid hämtning av avtalsdata:', error)
      setError('Ett oväntat fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.bank) {
      errors.push('Bank är obligatorisk')
    }

    if (!formData.clearingNumber.trim()) {
      errors.push('Clearingnummer är obligatoriskt')
    } else if (!/^\d{4}$/.test(formData.clearingNumber)) {
      errors.push('Clearingnummer måste vara 4 siffror')
    }

    if (!formData.accountNumber.trim()) {
      errors.push('Kontonummer är obligatoriskt')
    } else if (!/^\d{7,10}$/.test(formData.accountNumber.replace(/\s+/g, ''))) {
      errors.push('Kontonummer måste vara 7-10 siffror')
    }

    if (!formData.clothingSize) {
      errors.push('Klädstorlek är obligatorisk')
    }

    if (!formData.signature.trim()) {
      errors.push('Digital signatur är obligatorisk')
    } else if (formData.signature.trim().length < 2) {
      errors.push('Signaturen måste innehålla minst 2 tecken')
    }

    if (!acceptedTerms) {
      errors.push('Du måste acceptera avtalsvillkoren')
    }

    return errors
  }

  const handleSignContract = async () => {
    console.log('handleSignContract called')
    console.log('Form data:', formData)
    console.log('Accepted terms:', acceptedTerms)
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors)
      toast({
        title: "Valideringsfel",
        description: validationErrors.join(', '),
        variant: "destructive"
      })
      return
    }

    setSigning(true)
    console.log('Signing contract with token:', token)

    try {
      const response = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signingToken: token,
          signature: formData.signature,
          bank: formData.bank,
          clearingNumber: formData.clearingNumber,
          accountNumber: formData.accountNumber,
          clothingSize: formData.clothingSize,
          emergencyContact: formData.emergencyContact || null,
          specialRequests: formData.specialRequests || null,
          signatureMethod: 'digital'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Avtal signerat!",
          description: "Ditt anställningsavtal har signerats framgångsrikt"
        })

        // Redirect till bekräftelsesida efter 2 sekunder
        setTimeout(() => {
          router.push('/avtal/bekraftelse')
        }, 2000)
      } else {
        toast({
          title: "Fel vid signering",
          description: data.error || "Kunde inte signera avtalet",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Fel vid signering:', error)
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod",
        variant: "destructive"
      })
    } finally {
      setSigning(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE')
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      flyttpersonal_utan_korkort: 'Flyttpersonal utan körkort',
      flyttpersonal_b_korkort: 'Flyttpersonal med B-körkort',
      flyttpersonal_c_korkort: 'Flyttpersonal med C-körkort',
      flyttstadning: 'Flyttstädning',
      flytt_stad_utan_korkort: 'Flytt & Städ utan körkort',
      flytt_stad_med_korkort: 'Flytt & Städ med körkort',
      kundtjanst: 'Kundtjänst',
      flyttledare: 'Flyttledare',
      // Bakåtkompatibilitet
      flyttpersonal: 'Flyttpersonal',
      flytt_stad: 'Flytt & Städ'
    }
    return roleNames[role] || role
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#002A5C]" />
          <p className="text-gray-600">Laddar avtal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fel</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contractData) {
    return null
  }

  const { contract, employee, template, companyInfo } = contractData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-[#002A5C] rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Anställningsavtal</h1>
                <p className="text-gray-600">{companyInfo.brand}</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 mr-1" />
              Väntar på signering
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Avtalsöversikt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Avtalsöversikt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Företag</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{companyInfo.name}</p>
                  <p className="text-gray-600">Varumärke: {companyInfo.brand}</p>
                  <p className="text-gray-600">{companyInfo.address}</p>
                  <p className="text-gray-600">Org.nr: {companyInfo.orgNumber}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Anställning</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Namn:</span> {employee.name}</p>
                  <p><span className="font-medium">E-post:</span> {employee.email}</p>
                  <p><span className="font-medium">Position:</span> {getRoleDisplayName(contract.type)}</p>
                  <p><span className="font-medium">Timlön:</span> {template.hourlyRate} kr/h</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kvalitetskrav */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Kvalitetskrav för {getRoleDisplayName(contract.type)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="space-y-2">
                {template.qualityRequirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-yellow-800">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* PDF Visning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fullständigt Avtal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800">Ladda ner och granska det fullständiga avtalet</p>
                  <p className="text-sm text-blue-600">PDF-dokument med alla detaljer och villkor</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(contract.pdfUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Ladda ner PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signeringsformulär */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Signering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bank">Bank *</Label>
                <Select value={formData.bank} onValueChange={(value) => handleInputChange('bank', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEB">SEB</SelectItem>
                    <SelectItem value="Swedbank">Swedbank</SelectItem>
                    <SelectItem value="Nordea">Nordea</SelectItem>
                    <SelectItem value="Handelsbanken">Handelsbanken</SelectItem>
                    <SelectItem value="Danske Bank">Danske Bank</SelectItem>
                    <SelectItem value="ICA Banken">ICA Banken</SelectItem>
                    <SelectItem value="Länsförsäkringar">Länsförsäkringar</SelectItem>
                    <SelectItem value="SBAB">SBAB</SelectItem>
                    <SelectItem value="Skandiabanken">Skandiabanken</SelectItem>
                    <SelectItem value="Sparbanken">Sparbanken</SelectItem>
                    <SelectItem value="Övrig bank">Övrig bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="clearingNumber">Clearingnummer *</Label>
                <Input
                  id="clearingNumber"
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={formData.clearingNumber}
                  onChange={(e) => handleInputChange('clearingNumber', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">4 siffror (t.ex. 1234)</p>
              </div>
              
              <div>
                <Label htmlFor="accountNumber">Kontonummer *</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="1234567890"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">7-10 siffror</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clothingSize">Klädstorlek *</Label>
                <Select value={formData.clothingSize} onValueChange={(value) => handleInputChange('clothingSize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj storlek" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XS">XS</SelectItem>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                    <SelectItem value="XXL">XXL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="emergencyContact">Nödkontakt (frivilligt)</Label>
                <Input
                  id="emergencyContact"
                  type="text"
                  placeholder="Namn och telefonnummer"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialRequests">Särskilda önskemål (frivilligt)</Label>
              <Textarea
                id="specialRequests"
                placeholder="Eventuella allergier, tillgänglighetsbehov, etc."
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="signature">Digital signatur *</Label>
              <Input
                id="signature"
                type="text"
                placeholder="Skriv ditt fullständiga namn som signatur"
                value={formData.signature}
                onChange={(e) => handleInputChange('signature', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Genom att skriva ditt namn accepterar du att detta gäller som legal signatur
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <Label htmlFor="acceptTerms" className="text-sm">
                Jag har läst och förstått anställningsavtalet och accepterar alla villkor. 
                Jag bekräftar att alla uppgifter är korrekta och att min digitala signatur 
                är juridiskt bindande.
              </Label>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSignContract}
                disabled={signing}
                className="w-full bg-[#002A5C] hover:bg-[#001A3D]"
                size="lg"
              >
                {signing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signerar avtal...
                  </>
                ) : (
                  <>
                    <PenTool className="h-4 w-4 mr-2" />
                    Signera anställningsavtal
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information om säkerhet */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Säker signering</p>
                <p>
                  Denna signeringsprocess är säker och krypterad. Din information skyddas enligt GDPR 
                  och används endast för anställningsändamål. Avtalet blir juridiskt bindande när det signerats.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
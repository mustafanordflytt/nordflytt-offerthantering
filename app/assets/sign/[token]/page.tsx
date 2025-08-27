'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Package, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  PenTool,
  Clock,
  Shield
} from 'lucide-react'

interface AssetDocumentData {
  document: {
    id: string
    type: 'assets'
    employeeId: string
    employeeName: string
    status: string
    createdAt: string
    htmlPath: string
    totalItems: number
    totalCost: number
    signingToken: string
  }
  employee: {
    id: string
    name: string
    email: string
    position: string
  }
  assets: Array<{
    name: string
    category: string
    cost: number
    supplier: string
    status: string
    expectedLifespan: string
  }>
}

export default function AssetSigningPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [documentData, setDocumentData] = useState<AssetDocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Signeringsformulär
  const [formData, setFormData] = useState({
    signature: '',
    confirmTerms: false,
    comments: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Ladda dokument data
  useEffect(() => {
    async function loadDocumentData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/assets/${token}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Dokumentet hittades inte eller är ogiltigt')
          } else if (response.status === 410) {
            setError('Signeringslänken har upphört att gälla')
          } else {
            setError('Kunde inte ladda dokument')
          }
          return
        }

        const data = await response.json()
        setDocumentData(data)
        
      } catch (err) {
        console.error('Error loading document:', err)
        setError('Kunde inte ladda dokument')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadDocumentData()
    }
  }, [token])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.signature.trim()) {
      newErrors.signature = 'Signatur krävs'
    }

    if (!formData.confirmTerms) {
      newErrors.confirmTerms = 'Du måste acceptera villkoren'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Formulärfel",
        description: "Vänligen korrigera felen i formuläret",
        variant: "destructive"
      })
      return
    }

    try {
      setSigning(true)
      
      const signingData = {
        signingToken: token,
        signature: formData.signature,
        comments: formData.comments,
        signatureMethod: 'digital',
        signedAt: new Date().toISOString(),
        signedDate: new Date().toLocaleDateString('sv-SE'),
        employeeName: documentData?.employee.name || 'Okänd'
      }

      const response = await fetch('/api/assets/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signering misslyckades')
      }

      toast({
        title: "Signering slutförd",
        description: "Tillgångsförteckningen har signerats framgångsrikt",
      })

      // Redirect till bekräftelsesida
      router.push('/assets/bekraftelse')
      
    } catch (err) {
      console.error('Signing error:', err)
      toast({
        title: "Signeringsfel",
        description: err instanceof Error ? err.message : 'Ett oväntat fel uppstod',
        variant: "destructive"
      })
    } finally {
      setSigning(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Laddar dokument...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !documentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Kunde inte ladda dokument</h3>
                <p className="text-gray-600 mt-2">{error}</p>
              </div>
              <Button onClick={() => router.push('/')} variant="outline">
                Tillbaka till startsidan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { document, employee, assets } = documentData

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">NordFlytt</h1>
          </div>
          <h2 className="text-xl text-gray-600">Signering av Tillgångsförteckning</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Dokumentinformation */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Dokumentdetaljer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">Dokument-ID</Label>
                    <p className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      {document.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Anställd</Label>
                    <p className="font-medium">{employee.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Antal tillgångar</Label>
                    <p className="font-medium">{document.totalItems} st</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Totalt värde</Label>
                    <p className="font-medium">{document.totalCost} kr</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Skapad</Label>
                    <p>{new Date(document.createdAt).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                      Väntar på signering
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <Button 
                    onClick={() => window.open(document.htmlPath, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Granska fullständig förteckning
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tillgångsöversikt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Tillgångsöversikt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assets.slice(0, 5).map((asset, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-gray-600">{asset.category}</p>
                      </div>
                      <p className="font-medium">{asset.cost} kr</p>
                    </div>
                  ))}
                  {assets.length > 5 && (
                    <p className="text-sm text-gray-600 text-center">
                      ... och {assets.length - 5} tillgångar till
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signeringsformulär */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenTool className="h-5 w-5 mr-2" />
                  Digital Signatur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Viktiga villkor */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Viktigt att komma ihåg</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Du ansvarar för alla tilldelade tillgångar</li>
                        <li>• Rapportera skador eller förluster omedelbart</li>
                        <li>• Tillgångarna ska återlämnas vid anställningens slut</li>
                        <li>• Håll tillgångarna i gott skick och använd dem varsamt</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Signaturfeld */}
                <div className="space-y-2">
                  <Label htmlFor="signature">Digital Signatur *</Label>
                  <Input
                    id="signature"
                    placeholder="Skriv ditt fullständiga namn här"
                    value={formData.signature}
                    onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
                    className={errors.signature ? 'border-red-500' : ''}
                  />
                  {errors.signature && (
                    <p className="text-sm text-red-600">{errors.signature}</p>
                  )}
                </div>

                {/* Kommentarer */}
                <div className="space-y-2">
                  <Label htmlFor="comments">Kommentarer (valfritt)</Label>
                  <Textarea
                    id="comments"
                    placeholder="Eventuella kommentarer eller anmärkningar..."
                    value={formData.comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Acceptera villkor */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="confirmTerms"
                    checked={formData.confirmTerms}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, confirmTerms: checked as boolean }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="confirmTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Jag bekräftar att jag har mottagit ovanstående tillgångar *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Genom att markera denna ruta bekräftar du att du har fått alla listade tillgångar och förstår ditt ansvar för dem.
                    </p>
                    {errors.confirmTerms && (
                      <p className="text-xs text-red-600">{errors.confirmTerms}</p>
                    )}
                  </div>
                </div>

                {/* Signera knapp */}
                <Button 
                  onClick={handleSubmit}
                  disabled={signing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {signing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signerar...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Signera Tillgångsförteckning
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-600 text-center">
                  Genom att signera bekräftar du att alla uppgifter är korrekta och att du accepterar ansvaret för de tilldelade tillgångarna.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
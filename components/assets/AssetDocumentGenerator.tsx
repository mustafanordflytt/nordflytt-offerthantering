'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Package, 
  User, 
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Send
} from 'lucide-react'

interface Asset {
  id: string
  type: string
  name?: string
  category: string
  size?: string
  quantity?: number
  cost?: number
  originalCost?: number
  supplier?: string
  status: string
  assignedDate?: Date | string
  distributedDate?: string
}

interface AssetDocumentGeneratorProps {
  employeeId: string
  employeeName: string
  employeeEmail?: string
  employeeRole?: string
  assets: Asset[]
  onDocumentGenerated?: (document: any) => void
}

export default function AssetDocumentGenerator({
  employeeId,
  employeeName,
  employeeEmail = '',
  employeeRole = '',
  assets = [],
  onDocumentGenerated
}: AssetDocumentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)
  const { toast } = useToast()

  // Filtrera endast utdelade tillgångar
  const activeAssets = assets.filter(asset => 
    asset.status === 'utdelad' || asset.status === 'utdelat'
  )

  // Beräkna totaler
  const totalItems = activeAssets.reduce((sum, asset) => sum + (asset.quantity || 1), 0)
  const totalCost = activeAssets.reduce((sum, asset) => 
    sum + ((asset.originalCost || asset.cost || 0) * (asset.quantity || 1)), 0
  )

  const handleGenerateDocument = async () => {
    if (activeAssets.length === 0) {
      toast({
        title: "Inga tillgångar att dokumentera",
        description: "Anställda måste ha utdelade tillgångar för att generera dokument.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/assets/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          employeeName,
          employeeEmail,
          employeeRole,
          assets: activeAssets,
          documentType: 'assets'
        }),
      })

      if (!response.ok) {
        throw new Error('Kunde inte generera dokument')
      }

      const data = await response.json()
      setGeneratedDocument(data.document)
      
      if (onDocumentGenerated) {
        onDocumentGenerated(data.document)
      }

      toast({
        title: "Dokument genererat",
        description: `Tillgångsförteckning skapad för ${employeeName}`,
      })
    } catch (error) {
      console.error('Error generating document:', error)
      toast({
        title: "Fel vid generering",
        description: "Kunde inte skapa tillgångsdokument. Försök igen.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendDocument = async () => {
    if (!generatedDocument || !employeeEmail) {
      toast({
        title: "Kan inte skicka dokument",
        description: "Saknar dokument eller e-postadress.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/assets/send-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: generatedDocument.id,
          employeeEmail,
          employeeName
        }),
      })

      if (!response.ok) {
        throw new Error('Kunde inte skicka dokument')
      }

      const data = await response.json()
      
      // Uppdatera dokument status
      const updatedDocument = {
        ...generatedDocument,
        status: 'sent',
        sentAt: new Date().toISOString(),
        signingUrl: data.signingUrl
      }
      
      setGeneratedDocument(updatedDocument)
      
      // Informera parent komponent
      if (onDocumentGenerated) {
        onDocumentGenerated(updatedDocument)
      }

      toast({
        title: "Dokument skickat (Demo)",
        description: `📧 I produktion skulle e-post skickas till ${employeeEmail}. Nu loggas meddelandet i konsolen.`,
      })
    } catch (error) {
      console.error('Error sending document:', error)
      toast({
        title: "Fel vid sändning",
        description: "Kunde inte skicka dokument. Försök igen.",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'bg-blue-100 text-blue-800'
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
      case 'signed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'generated':
        return 'Genererat'
      case 'sent':
        return 'Skickat'
      case 'signed':
        return 'Signerat'
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tillgångsförteckning
            </CardTitle>
            <CardDescription>
              Skapa och skicka tillgångsdokument för signering
            </CardDescription>
          </div>
          
          {!generatedDocument && (
            <Button 
              onClick={handleGenerateDocument}
              disabled={isGenerating || activeAssets.length === 0}
              className="bg-[#002A5C] hover:bg-[#003d7a]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Genererar...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Skapa Dokument
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sammanfattning av tillgångar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Aktiva Tillgångar</p>
              <p className="text-xl font-bold text-blue-600">{totalItems}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt Värde</p>
              <p className="text-xl font-bold text-green-600">{totalCost.toLocaleString('sv-SE')} kr</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <User className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Anställd</p>
              <p className="text-lg font-bold text-purple-600">{employeeName}</p>
            </div>
          </div>
        </div>

        {/* Tillgångar förhandsvisning */}
        {activeAssets.length > 0 && (
          <div>
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Visa Tillgångar ({activeAssets.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tillgångar för {employeeName}</DialogTitle>
                  <DialogDescription>
                    Dessa tillgångar kommer att inkluderas i dokumentet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  {activeAssets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{asset.type || asset.name}</div>
                        <div className="text-sm text-gray-500">{asset.category} • {asset.size || 'One Size'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{asset.quantity || 1}st</div>
                        <div className="text-sm text-gray-500">{(asset.originalCost || asset.cost || 0)} kr</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Totalt:</span>
                    <span>{totalItems} st • {totalCost.toLocaleString('sv-SE')} kr</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Genererat dokument status */}
        {generatedDocument && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Dokument Genererat</span>
                <Badge className={getStatusColor(generatedDocument.status)}>
                  {getStatusLabel(generatedDocument.status)}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(generatedDocument.createdAt).toLocaleString('sv-SE')}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-600">Dokument-ID:</span>
                <div className="font-mono bg-white px-2 py-1 rounded border">
                  {generatedDocument.id}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Tillgångar:</span>
                <div>{generatedDocument.totalItems} st • {generatedDocument.totalCost} kr</div>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Visa Dokument finns i AssetDocumentStatus som Förhandsgranska */}
              
              {generatedDocument.status === 'generated' && employeeEmail && (
                <Button 
                  size="sm"
                  onClick={handleSendDocument}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Skicka för Signering
                </Button>
              )}
              
              {generatedDocument.status === 'sent' && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Väntar på signering
                </div>
              )}
              
              {generatedDocument.status === 'signed' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Signerat av {employeeName}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Varning om inga tillgångar */}
        {activeAssets.length === 0 && (
          <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-medium text-yellow-800 mb-2">Inga Aktiva Tillgångar</h3>
            <p className="text-sm text-yellow-700">
              {employeeName} har inga utdelade tillgångar att dokumentera. 
              Dela ut tillgångar först innan du skapar dokumentet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
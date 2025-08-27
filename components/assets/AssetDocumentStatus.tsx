'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Eye, 
  Download, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Mail,
  Calendar,
  User,
  Package,
  RefreshCw
} from 'lucide-react'

interface AssetDocument {
  id: string
  type: 'assets'
  employeeId: string
  employeeName: string
  employeeEmail?: string
  status: 'generated' | 'sent' | 'signed'
  createdAt: string
  sentAt?: string
  signedAt?: string
  htmlPath: string
  pdfPath?: string
  totalItems: number
  totalCost: number
  signingToken?: string
  signingUrl?: string
  signingData?: {
    signature: string
    signatureMethod: string
    employeeName: string
    signedAt: string
    signedDate: string
  }
}

interface AssetDocumentStatusProps {
  document: AssetDocument | null
  employeeEmail?: string
  employeeId: string
  onDocumentSent?: (document: AssetDocument) => void
  onDocumentSigned?: (document: AssetDocument) => void
}

export default function AssetDocumentStatus({
  document,
  employeeEmail = '',
  employeeId,
  onDocumentSent,
  onDocumentSigned
}: AssetDocumentStatusProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const { toast } = useToast()


  if (!document) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Inget tillgångsdokument genererat än</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Demo-signering borttagen - riktig signering sker via e-postlänk

  const getStatusIcon = () => {
    switch (document.status) {
      case 'generated':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'sent':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    switch (document.status) {
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

  const getStatusLabel = () => {
    switch (document.status) {
      case 'generated':
        return 'Genererat'
      case 'sent':
        return 'Skickat för signering'
      case 'signed':
        return 'Signerat'
      default:
        return document.status
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">Tillgångsförteckning</CardTitle>
              <CardDescription>
                {document.employeeName} • {document.totalItems} tillgångar • {document.totalCost} kr
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusLabel()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dokument information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Dokument-ID:</span>
            <div className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
              {document.id}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Skapat:</span>
            <div>{new Date(document.createdAt).toLocaleString('sv-SE')}</div>
          </div>
          {document.sentAt && (
            <>
              <div>
                <span className="text-gray-600">Skickat:</span>
                <div>{new Date(document.sentAt).toLocaleString('sv-SE')}</div>
              </div>
              <div>
                <span className="text-gray-600">Skickat till:</span>
                <div>{employeeEmail}</div>
              </div>
            </>
          )}
          {document.signedAt && document.signingData && (
            <>
              <div>
                <span className="text-gray-600">Signerat:</span>
                <div>{new Date(document.signedAt).toLocaleString('sv-SE')}</div>
              </div>
              <div>
                <span className="text-gray-600">Signerat av:</span>
                <div>{document.signingData.employeeName}</div>
              </div>
            </>
          )}
        </div>

        {/* Åtgärder baserat på status */}
        <div className="flex flex-wrap gap-2">
          {/* Förhandsgranska och ladda ned */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Förhandsgranska
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[98vw] md:max-w-6xl h-[90vh] md:h-[85vh] p-0 gap-0">
              <DialogHeader className="p-4 border-b">
                <DialogTitle>Tillgångsförteckning - {document.employeeName}</DialogTitle>
                <div className="flex justify-end">
                  <Button 
                    size="sm"
                    onClick={() => window.open(document.htmlPath, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ladda ned PDF
                  </Button>
                </div>
              </DialogHeader>
              <div className="flex-1 p-2">
                <iframe 
                  src={document.htmlPath} 
                  className="w-full h-full border-0 rounded" 
                  title="Tillgångsförteckning"
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Skicka för signering - hanteras av AssetDocumentGenerator */}

        </div>

        {/* Status meddelanden */}
        {document.status === 'sent' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Väntar på signering</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Dokumentet har skickats till {employeeEmail} för signering.
            </p>
            <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3 animate-pulse" />
              Kontrollerar status automatiskt...
            </p>
          </div>
        )}

        {document.status === 'signed' && document.signingData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Dokument signerat</span>
            </div>
            <div className="text-sm text-green-700 mt-2 space-y-1">
              <p><strong>Signerat av:</strong> {document.signingData.employeeName}</p>
              <p><strong>Datum:</strong> {document.signingData.signedDate}</p>
              <p><strong>Metod:</strong> {document.signingData.signatureMethod === 'digital' ? 'Digital signatur' : 'Elektronisk signatur'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
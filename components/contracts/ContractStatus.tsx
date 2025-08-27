'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Send, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface ContractStatusProps {
  contract: any
  employeeEmail: string
  employeeId: string
  onContractSent?: () => void
}

// Hjälpfunktioner
const getContractDisplayName = (contractType: string) => {
  const displayNames: Record<string, string> = {
    flyttpersonal_utan_korkort: 'Flyttpersonal utan körkort',
    flyttpersonal_b_korkort: 'Flyttpersonal med B-körkort',
    flyttpersonal_c_korkort: 'Flyttpersonal med C-körkort',
    flyttstadning: 'Flyttstädning',
    flytt_stad_utan_korkort: 'Flytt & Städ utan körkort',
    flytt_stad_med_korkort: 'Flytt & Städ med körkort',
    kundtjanst: 'Kundtjänst',
    flyttledare: 'Flyttledare'
  }
  return displayNames[contractType] || contractType
}

const ContractStatus = ({ contract, employeeEmail, employeeId, onContractSent }: ContractStatusProps) => {
  const [isSending, setIsSending] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  
  // Debug
  console.log('ContractStatus - contract:', contract)
  console.log('ContractStatus - status:', contract?.status)

  if (!contract) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Anställningsavtal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Inget anställningsavtal genererat än</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      signed: 'Signerat',
      sent: 'Skickat',
      draft: 'Utkast',
      expired: 'Utgånget'
    }
    return labels[status as keyof typeof labels] || status
  }

  const handleSendContract = async () => {
    setIsSending(true)
    try {
      const response = await fetch('/api/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeId,
          contractId: contract.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Uppdatera kontraktstatus direkt i UI:t
        contract.status = 'sent'
        contract.sentDate = new Date().toISOString()
        contract.expiryDate = data.expiryDate
        
        toast({
          title: "✉️ Avtal skickat",
          description: `Anställningsavtalet har skickats till ${employeeEmail}. Giltigt till ${new Date(data.expiryDate).toLocaleDateString('sv-SE')}.`
        })
        
        // Trigga uppdatering i parent-komponenten
        if (onContractSent) onContractSent()
      } else {
        toast({
          title: "Fel vid skickande",
          description: data.error || "Kunde inte skicka avtal",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDownloadContract = async () => {
    if (contract.pdfUrl) {
      const link = document.createElement('a')
      link.href = contract.pdfUrl
      link.download = `anställningsavtal-${contract.type}-${contract.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE')
  }
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Hämta uppdaterad data utan att ladda om sidan
      const response = await fetch(`/api/employees/${employeeId}`)
      if (response.ok) {
        const result = await response.json()
        const employeeData = result.data || result
        if (employeeData.contracts?.current) {
          // Uppdatera kontraktet direkt i state
          if (onContractSent) {
            onContractSent()
          }
        }
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Anställningsavtal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{getContractDisplayName(contract.type)}</p>
              <p className="text-sm text-gray-600">
                Version {contract.version} • Timlön: {contract.hourlyRate} kr/h
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {contract.signedDate ? (
                  <>Signerat: {formatDate(contract.signedDate)}</>
                ) : contract.sentDate ? (
                  <>Skickat: {formatDate(contract.sentDate)}</>
                ) : (
                  <>Skapad: {formatDate(contract.createdDate)}</>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(contract.status)}>
                {getStatusLabel(contract.status)}
              </Badge>
              
              {contract.status === 'sent' && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
              
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    Visa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh] p-0">
                  <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Förhandsgranskning - {getContractDisplayName(contract.type)}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 p-4 overflow-hidden">
                    {contract.pdfUrl ? (
                      <iframe
                        src={contract.pdfUrl}
                        className="w-full h-full border rounded-lg"
                        title="Avtalsförhandsgranskning"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <p>PDF-fil kunde inte laddas</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button size="sm" variant="outline" onClick={handleDownloadContract}>
                <Download className="h-4 w-4 mr-1" />
                Ladda ned
              </Button>
              
              {contract.status === 'draft' && (
                <Button 
                  size="sm" 
                  onClick={handleSendContract}
                  disabled={isSending}
                  className="bg-[#002A5C] hover:bg-[#001A3C]"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Skicka avtal
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Visa status-meddelanden */}
          {contract.status === 'sent' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-start">
                <Send className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="font-medium text-blue-800">Avtalet är skickat för signering</p>
                  <p className="text-blue-600">
                    Skickat till: {employeeEmail}<br />
                    {contract.expiryDate && <>Giltigt till: {formatDate(contract.expiryDate)}</>}
                  </p>
                  <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3 animate-pulse" />
                    Kontrollerar status automatiskt...
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {contract.status === 'signed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">Avtalet är signerat</p>
                  <p className="text-green-600">
                    Signerat: {formatDate(contract.signedDate)}<br />
                    Metod: {contract.signatureMethod || 'Digital signatur'}
                  </p>
                  {contract.signatureData && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-green-700 font-medium">Signeringsuppgifter:</p>
                      {contract.signatureData.bankAccount && (
                        <p className="text-xs text-green-600">Bank: {contract.signatureData.bankAccount}</p>
                      )}
                      {contract.signatureData.clothingSize && (
                        <p className="text-xs text-green-600">Klädstorlek: {contract.signatureData.clothingSize}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ContractStatus
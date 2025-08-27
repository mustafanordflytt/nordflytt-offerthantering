'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Plus, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  User,
  Calendar,
  Filter,
  Search,
  Signature,
  Shield,
  Archive
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Contract {
  id: string
  employeeId: string
  employeeName: string
  contractType: 'flyttare' | 'städare' | 'chaufför' | 'kundtjänst' | 'ledning'
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'rejected'
  createdDate: Date
  sentDate?: Date
  signedDate?: Date
  expiryDate?: Date
  contractVersion: string
  signatureMethod: 'bankid' | 'oneflow' | 'physical'
  pdfUrl?: string
  notes?: string
  signedBy?: string
  witnessName?: string
  witnessEmail?: string
}

const mockContracts: Contract[] = [
  {
    id: 'contract-001',
    employeeId: 'staff-001',
    employeeName: 'Lars Andersson',
    contractType: 'ledning',
    status: 'signed',
    createdDate: new Date('2024-01-15'),
    sentDate: new Date('2024-01-15'),
    signedDate: new Date('2024-01-16'),
    contractVersion: '2024.1',
    signatureMethod: 'bankid',
    pdfUrl: '/contracts/lars-andersson-2024.pdf',
    notes: 'Ledningsavtal med förlängning 2024',
    signedBy: 'Lars Andersson'
  },
  {
    id: 'contract-002',
    employeeId: 'staff-002',
    employeeName: 'Maria Eriksson',
    contractType: 'flyttare',
    status: 'sent',
    createdDate: new Date('2024-01-10'),
    sentDate: new Date('2024-01-11'),
    expiryDate: new Date('2024-01-25'),
    contractVersion: '2024.1',
    signatureMethod: 'oneflow',
    notes: 'Väntar på signering'
  },
  {
    id: 'contract-003',
    employeeId: 'staff-003',
    employeeName: 'Johan Karlsson',
    contractType: 'chaufför',
    status: 'signed',
    createdDate: new Date('2024-01-08'),
    sentDate: new Date('2024-01-09'),
    signedDate: new Date('2024-01-10'),
    contractVersion: '2024.1',
    signatureMethod: 'bankid',
    pdfUrl: '/contracts/johan-karlsson-2024.pdf',
    signedBy: 'Johan Karlsson'
  }
]

const contractTemplates = {
  flyttare: {
    name: 'Flyttare - Anställningsavtal',
    description: 'Standardavtal för flyttpersonal med fysiska arbetsuppgifter',
    clauses: ['Arbetsmiljöansvar', 'Lyftrutiner', 'Skadeansvar', 'Arbetstider']
  },
  städare: {
    name: 'Städare - Anställningsavtal',
    description: 'Avtal för städpersonal med specifika hygienrutiner',
    clauses: ['Hygienrutiner', 'Kemikaliehantering', 'Kvalitetsstandarder', 'Arbetstider']
  },
  chaufför: {
    name: 'Chaufför - Anställningsavtal',
    description: 'Avtal för chaufförer med körkortsrelaterade krav',
    clauses: ['Körkortskrav', 'Trafiksäkerhet', 'Fordonsansvar', 'Arbetstider']
  },
  kundtjänst: {
    name: 'Kundtjänst - Anställningsavtal',
    description: 'Avtal för kundtjänstpersonal med kommunikationsfokus',
    clauses: ['Kommunikationsstandarder', 'Sekretess', 'Dataskydd', 'Arbetstider']
  },
  ledning: {
    name: 'Ledning - Anställningsavtal',
    description: 'Avtal för ledningspersonal med utökade befogenheter',
    clauses: ['Ledningsansvar', 'Sekretess', 'Konkurrensklausul', 'Arbetstider']
  }
}

export default function ContractPage() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('all')
  const [isNewContractOpen, setIsNewContractOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  const [newContract, setNewContract] = useState({
    employeeId: '',
    employeeName: '',
    contractType: 'flyttare' as Contract['contractType'],
    signatureMethod: 'bankid' as Contract['signatureMethod'],
    notes: '',
    witnessName: '',
    witnessEmail: ''
  })

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    const matchesType = contractTypeFilter === 'all' || contract.contractType === contractTypeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'signed': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'rejected': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Contract['status']) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />
      case 'sent': return <Send className="h-4 w-4" />
      case 'signed': return <CheckCircle className="h-4 w-4" />
      case 'expired': return <Clock className="h-4 w-4" />
      case 'rejected': return <AlertCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: Contract['status']) => {
    const labels = {
      draft: 'Utkast',
      sent: 'Skickat',
      signed: 'Signerat',
      expired: 'Utgånget',
      rejected: 'Avvisat'
    }
    return labels[status]
  }

  const getContractTypeLabel = (type: Contract['contractType']) => {
    const labels = {
      flyttare: 'Flyttare',
      städare: 'Städare',
      chaufför: 'Chaufför',
      kundtjänst: 'Kundtjänst',
      ledning: 'Ledning'
    }
    return labels[type]
  }

  const handleCreateContract = () => {
    const contract: Contract = {
      id: `contract-${Date.now()}`,
      employeeId: newContract.employeeId,
      employeeName: newContract.employeeName,
      contractType: newContract.contractType,
      status: 'draft',
      createdDate: new Date(),
      contractVersion: '2024.1',
      signatureMethod: newContract.signatureMethod,
      notes: newContract.notes
    }
    
    setContracts([...contracts, contract])
    setNewContract({
      employeeId: '',
      employeeName: '',
      contractType: 'flyttare',
      signatureMethod: 'bankid',
      notes: '',
      witnessName: '',
      witnessEmail: ''
    })
    setIsNewContractOpen(false)
  }

  const handleSendContract = (contractId: string) => {
    setContracts(contracts.map(contract => 
      contract.id === contractId 
        ? { ...contract, status: 'sent' as const, sentDate: new Date(), expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
        : contract
    ))
  }

  const handleSignContract = (contractId: string) => {
    setContracts(contracts.map(contract => 
      contract.id === contractId 
        ? { 
            ...contract, 
            status: 'signed' as const, 
            signedDate: new Date(),
            pdfUrl: `/contracts/${contract.employeeName.toLowerCase().replace(' ', '-')}-${new Date().getFullYear()}.pdf`
          }
        : contract
    ))
  }

  const handleDownloadContract = (contract: Contract) => {
    if (contract.pdfUrl) {
      window.open(contract.pdfUrl, '_blank')
    }
  }

  // Calculate stats
  const totalContracts = contracts.length
  const signedContracts = contracts.filter(c => c.status === 'signed').length
  const pendingContracts = contracts.filter(c => c.status === 'sent').length
  const expiredContracts = contracts.filter(c => c.status === 'expired').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avtalshantering</h1>
          <p className="text-gray-600">Digital signering och avtalsarkiv</p>
        </div>
        <Dialog open={isNewContractOpen} onOpenChange={setIsNewContractOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#002A5C] hover:bg-[#001a42]">
              <Plus className="mr-2 h-4 w-4" />
              Nytt Avtal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Skapa Nytt Anställningsavtal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeName">Anställd</Label>
                  <Input
                    id="employeeName"
                    placeholder="Namn på anställd"
                    value={newContract.employeeName}
                    onChange={(e) => setNewContract({...newContract, employeeName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="contractType">Avtalstyp</Label>
                  <Select 
                    value={newContract.contractType} 
                    onValueChange={(value) => setNewContract({...newContract, contractType: value as Contract['contractType']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(contractTemplates).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="signatureMethod">Signeringsmetod</Label>
                <Select 
                  value={newContract.signatureMethod} 
                  onValueChange={(value) => setNewContract({...newContract, signatureMethod: value as Contract['signatureMethod']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bankid">BankID</SelectItem>
                    <SelectItem value="oneflow">Oneflow</SelectItem>
                    <SelectItem value="physical">Fysisk signering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Anteckningar</Label>
                <Textarea
                  id="notes"
                  placeholder="Eventuella anteckningar eller specialklausuler..."
                  value={newContract.notes}
                  onChange={(e) => setNewContract({...newContract, notes: e.target.value})}
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Avtalsinnehåll för {contractTemplates[newContract.contractType].name}</h4>
                <p className="text-sm text-blue-700 mb-2">{contractTemplates[newContract.contractType].description}</p>
                <div className="flex flex-wrap gap-2">
                  {contractTemplates[newContract.contractType].clauses.map((clause, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {clause}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsNewContractOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateContract}>
                  Skapa Avtal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt Avtal</p>
                <p className="text-2xl font-bold">{totalContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Signerade</p>
                <p className="text-2xl font-bold text-green-600">{signedContracts}</p>
                <p className="text-xs text-gray-500">{totalContracts > 0 ? Math.round((signedContracts / totalContracts) * 100) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Väntar Signering</p>
                <p className="text-2xl font-bold text-blue-600">{pendingContracts}</p>
                <p className="text-xs text-gray-500">Kräver uppföljning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Utgångna</p>
                <p className="text-2xl font-bold text-red-600">{expiredContracts}</p>
                <p className="text-xs text-gray-500">Behöver förnyas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrera Avtal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök efter anställd eller avtals-ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Status</SelectItem>
                <SelectItem value="draft">Utkast</SelectItem>
                <SelectItem value="sent">Skickat</SelectItem>
                <SelectItem value="signed">Signerat</SelectItem>
                <SelectItem value="expired">Utgånget</SelectItem>
                <SelectItem value="rejected">Avvisat</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Avtalstyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Typer</SelectItem>
                <SelectItem value="flyttare">Flyttare</SelectItem>
                <SelectItem value="städare">Städare</SelectItem>
                <SelectItem value="chaufför">Chaufför</SelectItem>
                <SelectItem value="kundtjänst">Kundtjänst</SelectItem>
                <SelectItem value="ledning">Ledning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <Card>
        <CardHeader>
          <CardTitle>Avtal ({filteredContracts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anställd
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avtalstyp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signering
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                            {contract.employeeName.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{contract.employeeName}</div>
                          <div className="text-sm text-gray-500">{contract.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getContractTypeLabel(contract.contractType)}</div>
                      <div className="text-sm text-gray-500">Version {contract.contractVersion}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={cn("flex items-center gap-1", getStatusColor(contract.status))}>
                        {getStatusIcon(contract.status)}
                        {getStatusLabel(contract.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Signature className="h-4 w-4 mr-1" />
                        {contract.signatureMethod === 'bankid' && 'BankID'}
                        {contract.signatureMethod === 'oneflow' && 'Oneflow'}
                        {contract.signatureMethod === 'physical' && 'Fysisk'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Skapad: {contract.createdDate.toLocaleDateString('sv-SE')}</div>
                      {contract.signedDate && (
                        <div className="text-green-600">Signerad: {contract.signedDate.toLocaleDateString('sv-SE')}</div>
                      )}
                      {contract.expiryDate && contract.status === 'sent' && (
                        <div className="text-orange-600">Utgår: {contract.expiryDate.toLocaleDateString('sv-SE')}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {contract.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendContract(contract.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Skicka
                          </Button>
                        )}
                        
                        {contract.status === 'sent' && (
                          <Button
                            size="sm"
                            onClick={() => handleSignContract(contract.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Markera Signerad
                          </Button>
                        )}
                        
                        {contract.pdfUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadContract(contract)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Ladda ned
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedContract(contract)
                            setIsPreviewOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredContracts.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Inga avtal hittades</h3>
              <p className="mt-1 text-sm text-gray-500">
                Prova att ändra dina sökkriterier eller skapa ett nytt avtal
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Avtalsdetaljer</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Anställd</Label>
                  <p className="font-medium">{selectedContract.employeeName}</p>
                </div>
                <div>
                  <Label>Avtalstyp</Label>
                  <p className="font-medium">{getContractTypeLabel(selectedContract.contractType)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedContract.status)}>
                    {getStatusLabel(selectedContract.status)}
                  </Badge>
                </div>
                <div>
                  <Label>Signeringsmetod</Label>
                  <p className="font-medium">{selectedContract.signatureMethod}</p>
                </div>
              </div>
              
              <div>
                <Label>Tidslinje</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Skapad: {selectedContract.createdDate.toLocaleDateString('sv-SE')}</span>
                  </div>
                  {selectedContract.sentDate && (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm">Skickat: {selectedContract.sentDate.toLocaleDateString('sv-SE')}</span>
                    </div>
                  )}
                  {selectedContract.signedDate && (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Signerat: {selectedContract.signedDate.toLocaleDateString('sv-SE')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedContract.notes && (
                <div>
                  <Label>Anteckningar</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedContract.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
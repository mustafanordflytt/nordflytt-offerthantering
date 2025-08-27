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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Shirt,
  HardHat,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Edit3,
  Trash2,
  Download,
  Upload,
  BarChart3,
  ShoppingCart,
  Archive
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Asset {
  id: string
  employeeId: string
  employeeName: string
  category: 'klader' | 'utrustning' | 'fordon'
  type: string
  size?: string
  quantity: number
  issuedDate: Date
  returnDate?: Date
  status: 'utdelat' | 'returnerat' | 'forlorat' | 'skadat'
  condition: 'nytt' | 'bra' | 'slit' | 'dåligt'
  notes?: string
  cost?: number
  supplier?: string
  warrantyUntil?: Date
}

interface AssetType {
  id: string
  name: string
  category: 'klader' | 'utrustning' | 'fordon'
  sizes?: string[]
  standardCost: number
  description: string
  supplier: string
  warrantyMonths: number
}

const assetTypes: AssetType[] = [
  // Kläder
  {
    id: 'tshirt',
    name: 'Nordflytt T-shirt',
    category: 'klader',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    standardCost: 249,
    description: 'Officiell Nordflytt T-shirt med logotyp',
    supplier: 'Profilprodukter AB',
    warrantyMonths: 6
  },
  {
    id: 'jacket',
    name: 'Arbetsjacka',
    category: 'klader',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    standardCost: 899,
    description: 'Vattentät arbetsjacka med reflex',
    supplier: 'Workwear Nordic',
    warrantyMonths: 12
  },
  {
    id: 'pants',
    name: 'Arbetsbyxor',
    category: 'klader',
    sizes: ['46', '48', '50', '52', '54', '56', '58', '60'],
    standardCost: 699,
    description: 'Förstärkta arbetsbyxor med knäskydd',
    supplier: 'Workwear Nordic',
    warrantyMonths: 12
  },
  {
    id: 'shoes',
    name: 'Säkerhetsskor',
    category: 'klader',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
    standardCost: 1299,
    description: 'S3-klassade säkerhetsskor med stålhätta',
    supplier: 'Safety First AB',
    warrantyMonths: 12
  },
  {
    id: 'gloves',
    name: 'Arbetshandskar',
    category: 'klader',
    sizes: ['S', 'M', 'L', 'XL'],
    standardCost: 149,
    description: 'Greppvänliga arbetshandskar',
    supplier: 'Safety First AB',
    warrantyMonths: 3
  },
  
  // Utrustning
  {
    id: 'lifting_belt',
    name: 'Lyftbälte',
    category: 'utrustning',
    sizes: ['S', 'M', 'L', 'XL'],
    standardCost: 899,
    description: 'Ergonomiskt lyftbälte för tunga lyft',
    supplier: 'Ergonomic Tools',
    warrantyMonths: 24
  },
  {
    id: 'trolley',
    name: 'Transportkärra',
    category: 'utrustning',
    standardCost: 1899,
    description: 'Professionell transportkärra, 200kg',
    supplier: 'Moving Equipment AB',
    warrantyMonths: 24
  },
  {
    id: 'straps',
    name: 'Spännband',
    category: 'utrustning',
    standardCost: 199,
    description: 'Spännband för säker transport',
    supplier: 'Transport Safety',
    warrantyMonths: 12
  },
  {
    id: 'blankets',
    name: 'Flyttfilt',
    category: 'utrustning',
    standardCost: 299,
    description: 'Skyddande flyttfilt för möbler',
    supplier: 'Moving Equipment AB',
    warrantyMonths: 6
  },
  {
    id: 'tools',
    name: 'Verktygsset',
    category: 'utrustning',
    standardCost: 1499,
    description: 'Komplett verktygsset för montering',
    supplier: 'Professional Tools',
    warrantyMonths: 36
  }
]

const mockAssets: Asset[] = [
  {
    id: 'asset-001',
    employeeId: 'staff-001',
    employeeName: 'Lars Andersson',
    category: 'klader',
    type: 'tshirt',
    size: 'L',
    quantity: 3,
    issuedDate: new Date('2024-01-15'),
    status: 'utdelat',
    condition: 'nytt',
    cost: 249,
    supplier: 'Profilprodukter AB',
    warrantyUntil: new Date('2024-07-15')
  },
  {
    id: 'asset-002',
    employeeId: 'staff-002',
    employeeName: 'Maria Eriksson',
    category: 'utrustning',
    type: 'lifting_belt',
    size: 'M',
    quantity: 1,
    issuedDate: new Date('2024-01-10'),
    status: 'utdelat',
    condition: 'bra',
    cost: 899,
    supplier: 'Ergonomic Tools',
    warrantyUntil: new Date('2026-01-10')
  },
  {
    id: 'asset-003',
    employeeId: 'staff-003',
    employeeName: 'Johan Karlsson',
    category: 'klader',
    type: 'jacket',
    size: 'XL',
    quantity: 1,
    issuedDate: new Date('2024-01-08'),
    status: 'skadat',
    condition: 'dåligt',
    cost: 899,
    supplier: 'Workwear Nordic',
    notes: 'Trasig dragkedja, behöver reparation'
  },
  {
    id: 'asset-004',
    employeeId: 'staff-004',
    employeeName: 'Emma Nilsson',
    category: 'utrustning',
    type: 'trolley',
    quantity: 1,
    issuedDate: new Date('2024-01-05'),
    returnDate: new Date('2024-01-20'),
    status: 'returnerat',
    condition: 'bra',
    cost: 1899,
    supplier: 'Moving Equipment AB'
  }
]

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(mockAssets)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false)
  const [isOrderReportOpen, setIsOrderReportOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const [newAsset, setNewAsset] = useState({
    employeeId: '',
    employeeName: '',
    category: 'klader' as Asset['category'],
    type: '',
    size: '',
    quantity: 1,
    notes: ''
  })

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
    const matchesEmployee = employeeFilter === 'all' || asset.employeeId === employeeFilter
    return matchesSearch && matchesCategory && matchesStatus && matchesEmployee
  })

  const getAssetTypeName = (typeId: string) => {
    const type = assetTypes.find(t => t.id === typeId)
    return type?.name || typeId
  }

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'utdelat': return 'bg-blue-100 text-blue-800'
      case 'returnerat': return 'bg-green-100 text-green-800'
      case 'forlorat': return 'bg-red-100 text-red-800'
      case 'skadat': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Asset['status']) => {
    switch (status) {
      case 'utdelat': return <CheckCircle className="h-4 w-4" />
      case 'returnerat': return <Archive className="h-4 w-4" />
      case 'forlorat': return <XCircle className="h-4 w-4" />
      case 'skadat': return <AlertTriangle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: Asset['status']) => {
    const labels = {
      utdelat: 'Utdelat',
      returnerat: 'Returnerat',
      forlorat: 'Förlorat',
      skadat: 'Skadat'
    }
    return labels[status]
  }

  const getCategoryIcon = (category: Asset['category']) => {
    switch (category) {
      case 'klader': return <Shirt className="h-4 w-4" />
      case 'utrustning': return <HardHat className="h-4 w-4" />
      case 'fordon': return <Truck className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: Asset['category']) => {
    const labels = {
      klader: 'Kläder',
      utrustning: 'Utrustning',
      fordon: 'Fordon'
    }
    return labels[category]
  }

  const getConditionColor = (condition: Asset['condition']) => {
    switch (condition) {
      case 'nytt': return 'bg-green-100 text-green-800'
      case 'bra': return 'bg-blue-100 text-blue-800'
      case 'slit': return 'bg-yellow-100 text-yellow-800'
      case 'dåligt': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateAsset = () => {
    const selectedType = assetTypes.find(t => t.id === newAsset.type)
    if (!selectedType) return

    const asset: Asset = {
      id: `asset-${Date.now()}`,
      employeeId: newAsset.employeeId,
      employeeName: newAsset.employeeName,
      category: newAsset.category,
      type: newAsset.type,
      size: newAsset.size,
      quantity: newAsset.quantity,
      issuedDate: new Date(),
      status: 'utdelat',
      condition: 'nytt',
      cost: selectedType.standardCost,
      supplier: selectedType.supplier,
      warrantyUntil: new Date(Date.now() + (selectedType.warrantyMonths * 30 * 24 * 60 * 60 * 1000)),
      notes: newAsset.notes
    }
    
    setAssets([...assets, asset])
    setNewAsset({
      employeeId: '',
      employeeName: '',
      category: 'klader',
      type: '',
      size: '',
      quantity: 1,
      notes: ''
    })
    setIsNewAssetOpen(false)
  }

  const handleReturnAsset = (assetId: string) => {
    setAssets(assets.map(asset => 
      asset.id === assetId 
        ? { ...asset, status: 'returnerat' as const, returnDate: new Date() }
        : asset
    ))
  }

  const handleMarkLost = (assetId: string) => {
    setAssets(assets.map(asset => 
      asset.id === assetId 
        ? { ...asset, status: 'forlorat' as const, returnDate: new Date() }
        : asset
    ))
  }

  const handleMarkDamaged = (assetId: string) => {
    setAssets(assets.map(asset => 
      asset.id === assetId 
        ? { ...asset, status: 'skadat' as const, condition: 'dåligt' as const }
        : asset
    ))
  }

  // Calculate stats
  const totalAssets = assets.length
  const activeAssets = assets.filter(a => a.status === 'utdelat').length
  const returnedAssets = assets.filter(a => a.status === 'returnerat').length
  const lostAssets = assets.filter(a => a.status === 'forlorat').length
  const damagedAssets = assets.filter(a => a.status === 'skadat').length
  const totalValue = assets.reduce((sum, a) => sum + (a.cost || 0) * a.quantity, 0)

  // Generate order report data
  const generateOrderReport = () => {
    const clothingSummary = new Map<string, { total: number, sizes: Map<string, number> }>()
    
    assets.filter(a => a.category === 'klader').forEach(asset => {
      const key = asset.type
      if (!clothingSummary.has(key)) {
        clothingSummary.set(key, { total: 0, sizes: new Map() })
      }
      
      const summary = clothingSummary.get(key)!
      summary.total += asset.quantity
      
      if (asset.size) {
        const sizeCount = summary.sizes.get(asset.size) || 0
        summary.sizes.set(asset.size, sizeCount + asset.quantity)
      }
    })
    
    return Array.from(clothingSummary.entries()).map(([type, data]) => ({
      type,
      name: getAssetTypeName(type),
      total: data.total,
      sizes: Array.from(data.sizes.entries()).map(([size, count]) => ({ size, count }))
    }))
  }

  const availableTypes = assetTypes.filter(t => t.category === newAsset.category)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tillgångshantering</h1>
          <p className="text-gray-600">Hantera arbetskläder, utrustning och inventarier</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isOrderReportOpen} onOpenChange={setIsOrderReportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Beställningsrapport
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Beställningsrapport - Arbetskläder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Sammanställning av utdelade arbetskläder för beställning till ny personal
                </div>
                
                <div className="space-y-4">
                  {generateOrderReport().map((item) => (
                    <Card key={item.type}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant="outline">Total: {item.total} st</Badge>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {item.sizes.map(({ size, count }) => (
                            <div key={size} className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-medium">{size}</div>
                              <div className="text-xs text-gray-600">{count} st</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportera PDF
                  </Button>
                  <Button>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Skicka till leverantör
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isNewAssetOpen} onOpenChange={setIsNewAssetOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#002A5C] hover:bg-[#001a42]">
                <Plus className="mr-2 h-4 w-4" />
                Utdela Tillgång
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Utdela Ny Tillgång</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeName">Anställd</Label>
                    <Input
                      id="employeeName"
                      placeholder="Namn på anställd"
                      value={newAsset.employeeName}
                      onChange={(e) => setNewAsset({...newAsset, employeeName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Select 
                      value={newAsset.category} 
                      onValueChange={(value) => setNewAsset({...newAsset, category: value as Asset['category'], type: ''})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="klader">Kläder</SelectItem>
                        <SelectItem value="utrustning">Utrustning</SelectItem>
                        <SelectItem value="fordon">Fordon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Typ</Label>
                    <Select 
                      value={newAsset.type} 
                      onValueChange={(value) => setNewAsset({...newAsset, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj typ" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.standardCost} kr)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Antal</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={newAsset.quantity}
                      onChange={(e) => setNewAsset({...newAsset, quantity: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                
                {newAsset.type && assetTypes.find(t => t.id === newAsset.type)?.sizes && (
                  <div>
                    <Label htmlFor="size">Storlek</Label>
                    <Select 
                      value={newAsset.size} 
                      onValueChange={(value) => setNewAsset({...newAsset, size: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj storlek" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetTypes.find(t => t.id === newAsset.type)?.sizes?.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="notes">Anteckningar</Label>
                  <Textarea
                    id="notes"
                    placeholder="Eventuella anteckningar..."
                    value={newAsset.notes}
                    onChange={(e) => setNewAsset({...newAsset, notes: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewAssetOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleCreateAsset}>
                    Utdela Tillgång
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="assets">Tillgångar</TabsTrigger>
          <TabsTrigger value="reports">Rapporter</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-[#002A5C]" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Totalt</p>
                    <p className="text-2xl font-bold">{totalAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Utdelat</p>
                    <p className="text-2xl font-bold text-blue-600">{activeAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Archive className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Returnerat</p>
                    <p className="text-2xl font-bold text-green-600">{returnedAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Förlorat</p>
                    <p className="text-2xl font-bold text-red-600">{lostAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Skadat</p>
                    <p className="text-2xl font-bold text-orange-600">{damagedAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Totalt värde</p>
                    <p className="text-2xl font-bold text-purple-600">{totalValue.toLocaleString('sv-SE')} kr</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['klader', 'utrustning', 'fordon'].map((category) => {
              const categoryAssets = assets.filter(a => a.category === category)
              const categoryValue = categoryAssets.reduce((sum, a) => sum + (a.cost || 0) * a.quantity, 0)
              
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {getCategoryIcon(category as Asset['category'])}
                      <span className="ml-2">{getCategoryLabel(category as Asset['category'])}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Antal tillgångar:</span>
                        <span className="font-medium">{categoryAssets.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Totalt värde:</span>
                        <span className="font-medium">{categoryValue.toLocaleString('sv-SE')} kr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Utdelat:</span>
                        <span className="font-medium text-blue-600">
                          {categoryAssets.filter(a => a.status === 'utdelat').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtrera Tillgångar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Sök efter anställd, typ eller ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla Kategorier</SelectItem>
                    <SelectItem value="klader">Kläder</SelectItem>
                    <SelectItem value="utrustning">Utrustning</SelectItem>
                    <SelectItem value="fordon">Fordon</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla Status</SelectItem>
                    <SelectItem value="utdelat">Utdelat</SelectItem>
                    <SelectItem value="returnerat">Returnerat</SelectItem>
                    <SelectItem value="forlorat">Förlorat</SelectItem>
                    <SelectItem value="skadat">Skadat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Assets List */}
          <Card>
            <CardHeader>
              <CardTitle>Tillgångar ({filteredAssets.length})</CardTitle>
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
                        Tillgång
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skick
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
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                                {asset.employeeName.split(' ').map(n => n[0]).join('')}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{asset.employeeName}</div>
                              <div className="text-sm text-gray-500">{asset.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getCategoryIcon(asset.category)}
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{getAssetTypeName(asset.type)}</div>
                              <div className="text-sm text-gray-500">
                                {asset.size && `Storlek: ${asset.size} • `}
                                Antal: {asset.quantity}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={cn("flex items-center gap-1", getStatusColor(asset.status))}>
                            {getStatusIcon(asset.status)}
                            {getStatusLabel(asset.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getConditionColor(asset.condition)}>
                            {asset.condition}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Utdelat: {asset.issuedDate.toLocaleDateString('sv-SE')}</div>
                          {asset.returnDate && (
                            <div>Returnerat: {asset.returnDate.toLocaleDateString('sv-SE')}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {asset.status === 'utdelat' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReturnAsset(asset.id)}
                                >
                                  <Archive className="h-4 w-4 mr-1" />
                                  Returnera
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkDamaged(asset.id)}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Skada
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkLost(asset.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Förlorat
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredAssets.length === 0 && (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Inga tillgångar hittades</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Prova att ändra dina sökkriterier eller utdela en ny tillgång
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kostnadsspårning</CardTitle>
                <CardDescription>Månadsvis kostnadsutveckling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Diagramvisning kommer här</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Populäraste tillgångar</CardTitle>
                <CardDescription>Mest utdelade produkter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assetTypes.slice(0, 5).map((type) => {
                    const count = assets.filter(a => a.type === type.id).length
                    return (
                      <div key={type.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getCategoryIcon(type.category)}
                          <span className="ml-2 text-sm">{type.name}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
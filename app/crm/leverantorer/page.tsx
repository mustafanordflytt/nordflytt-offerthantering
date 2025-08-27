'use client';

import React, { useState, useEffect } from 'react';
import { Truck, TrendingUp, AlertCircle, Building2, Package, BarChart3, Shield, CheckCircle, Eye, Plus, Download, Upload, Search, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAuthHeaders } from '@/lib/token-helper';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Supplier {
  id: number;
  supplierName: string;
  supplierCode: string;
  category?: any;
  supplierType: string;
  status: string;
  primaryContact?: {
    id: string;
    name: string;
    role?: string;
    email?: string;
    phone?: string;
  };
  contactsCount: number;
  address?: string;
  city?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  rating?: number;
  performanceScore?: number;
  performanceTier?: string;
  riskScore?: number;
  riskLevel?: string;
  activeContracts: number;
  contractValue: number;
  isCritical: boolean;
  tags: string[];
}

interface SupplierCategory {
  id: string;
  name: string;
  description?: string;
}

export default function LeverantörerPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    criticalSuppliers: 0,
    highRiskSuppliers: 0,
    premiumSuppliers: 0,
    totalContractValue: 0,
    avgPerformanceScore: 0
  });
  const [newSupplier, setNewSupplier] = useState({
    supplierName: '',
    supplierType: 'company',
    categoryId: '',
    primaryContact: {
      name: '',
      email: '',
      phone: '',
      role: ''
    },
    paymentTerms: '30 dagar netto',
    isCritical: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/crm/supplier-categories', {
        headers
      });
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }
      
      // Fetch suppliers
      const response = await fetch('/api/crm/suppliers?limit=50', {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      
      const data = await response.json();
      setSuppliers(data.suppliers || []);
      setStats(data.stats || {
        totalSuppliers: 0,
        activeSuppliers: 0,
        criticalSuppliers: 0,
        highRiskSuppliers: 0,
        premiumSuppliers: 0,
        totalContractValue: 0,
        avgPerformanceScore: 0
      });
      
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Kunde inte hämta leverantörsdata');
    } finally {
      setIsLoading(false);
    }
  };

  const createSupplier = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/crm/suppliers', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSupplier)
      });

      if (!response.ok) {
        throw new Error('Failed to create supplier');
      }

      toast.success('Leverantör skapad');
      setShowCreateDialog(false);
      setNewSupplier({
        supplierName: '',
        supplierType: 'company',
        categoryId: '',
        primaryContact: {
          name: '',
          email: '',
          phone: '',
          role: ''
        },
        paymentTerms: '30 dagar netto',
        isCritical: false
      });
      fetchData();
    } catch (error) {
      toast.error('Kunde inte skapa leverantör');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-500', label: 'Aktiv' },
      inactive: { color: 'bg-gray-500', label: 'Inaktiv' },
      review: { color: 'bg-yellow-500', label: 'Granskning' },
      suspended: { color: 'bg-red-500', label: 'Avstängd' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-500', label: status };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getPerformanceBadge = (tier?: string) => {
    if (!tier) return null;
    
    const tierConfig: Record<string, { color: string; label: string }> = {
      premium: { color: 'bg-green-500', label: 'Premium' },
      standard: { color: 'bg-blue-500', label: 'Standard' },
      review: { color: 'bg-yellow-500', label: 'Granskning' },
      at_risk: { color: 'bg-red-500', label: 'Risk' }
    };

    const config = tierConfig[tier] || { color: 'bg-gray-500', label: tier };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getRiskBadge = (level?: string) => {
    if (!level) return null;
    
    const levelConfig: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-green-500', label: 'Låg' },
      medium: { color: 'bg-yellow-500', label: 'Medel' },
      high: { color: 'bg-orange-500', label: 'Hög' },
      critical: { color: 'bg-red-500', label: 'Kritisk' }
    };

    const config = levelConfig[level] || { color: 'bg-gray-500', label: level };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchTerm || 
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.primaryContact?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || supplier.category?.id === filterCategory;
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt leverantörer</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeSuppliers} aktiva</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritiska leverantörer</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Kräver särskild övervakning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig prestanda</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPerformanceScore.toFixed(1)}/5.0</div>
            <p className="text-xs text-muted-foreground">{stats.premiumSuppliers} premiumnivå</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avtalsvärde</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalContractValue / 1000).toFixed(0)}k kr</div>
            <p className="text-xs text-muted-foreground">Totalt aktivt värde</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {stats.highRiskSuppliers > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.highRiskSuppliers} leverantörer har hög eller kritisk risknivå och kräver uppmärksamhet.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Senaste leverantörsaktivitet</CardTitle>
          <CardDescription>Viktiga händelser och uppdateringar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Avtal löper ut snart</p>
                  <p className="text-sm text-muted-foreground">3 leverantörsavtal inom 90 dagar</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Visa</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Prestandautvärdering klar</p>
                  <p className="text-sm text-muted-foreground">5 leverantörer utvärderade denna månad</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Granska</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuppliers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök leverantörer..."
              className="pl-8 w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alla kategorier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla kategorier</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Alla status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
              <SelectItem value="review">Granskning</SelectItem>
              <SelectItem value="suspended">Avstängd</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny leverantör
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lägg till ny leverantör</DialogTitle>
              <DialogDescription>
                Registrera en ny leverantör i systemet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierName">Leverantörsnamn</Label>
                  <Input
                    id="supplierName"
                    value={newSupplier.supplierName}
                    onChange={(e) => setNewSupplier({ ...newSupplier, supplierName: e.target.value })}
                    placeholder="AB Exempel"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select 
                    value={newSupplier.categoryId} 
                    onValueChange={(value) => setNewSupplier({ ...newSupplier, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Primär kontakt</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input
                    placeholder="Namn"
                    value={newSupplier.primaryContact.name}
                    onChange={(e) => setNewSupplier({
                      ...newSupplier,
                      primaryContact: { ...newSupplier.primaryContact, name: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="Roll"
                    value={newSupplier.primaryContact.role}
                    onChange={(e) => setNewSupplier({
                      ...newSupplier,
                      primaryContact: { ...newSupplier.primaryContact, role: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="E-post"
                    type="email"
                    value={newSupplier.primaryContact.email}
                    onChange={(e) => setNewSupplier({
                      ...newSupplier,
                      primaryContact: { ...newSupplier.primaryContact, email: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="Telefon"
                    value={newSupplier.primaryContact.phone}
                    onChange={(e) => setNewSupplier({
                      ...newSupplier,
                      primaryContact: { ...newSupplier.primaryContact, phone: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Betalningsvillkor</Label>
                <Input
                  id="paymentTerms"
                  value={newSupplier.paymentTerms}
                  onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="critical"
                  checked={newSupplier.isCritical}
                  onCheckedChange={(checked) => setNewSupplier({ ...newSupplier, isCritical: checked as boolean })}
                />
                <Label htmlFor="critical">Kritisk leverantör</Label>
              </div>

              <Button onClick={createSupplier} className="w-full">
                Skapa leverantör
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left p-4">Leverantör</th>
                  <th className="text-left p-4">Kontakt</th>
                  <th className="text-left p-4">Kategori</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Prestanda</th>
                  <th className="text-left p-4">Risk</th>
                  <th className="text-left p-4">Avtal</th>
                  <th className="text-left p-4">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{supplier.supplierName}</p>
                        <p className="text-sm text-muted-foreground">{supplier.supplierCode}</p>
                        {supplier.isCritical && (
                          <Badge variant="outline" className="mt-1">
                            <Shield className="h-3 w-3 mr-1" />
                            Kritisk
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {supplier.primaryContact ? (
                        <div>
                          <p className="font-medium">{supplier.primaryContact.name}</p>
                          <p className="text-sm text-muted-foreground">{supplier.primaryContact.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {supplier.category?.category_name || '-'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(supplier.status)}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {supplier.performanceScore ? (
                          <>
                            <p className="font-medium">{supplier.performanceScore.toFixed(1)}/5.0</p>
                            {getPerformanceBadge(supplier.performanceTier)}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Ej utvärderad</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {supplier.riskScore ? (
                        <div className="space-y-1">
                          <p className="font-medium">{supplier.riskScore.toFixed(0)}</p>
                          {getRiskBadge(supplier.riskLevel)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{supplier.activeContracts} aktiva</p>
                        {supplier.contractValue > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {(supplier.contractValue / 1000).toFixed(0)}k kr
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar leverantörsdata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leverantörer</h1>
        <p className="text-muted-foreground">Hantera leverantörer, avtal och prestanda</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="suppliers">Leverantörer</TabsTrigger>
          <TabsTrigger value="contracts">Avtal</TabsTrigger>
          <TabsTrigger value="performance">Prestanda</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          {renderSuppliers()}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leverantörsavtal</CardTitle>
              <CardDescription>Kommande funktionalitet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Avtalshantering kommer snart...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leverantörsprestanda</CardTitle>
              <CardDescription>Kommande funktionalitet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Prestandaanalys kommer snart...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
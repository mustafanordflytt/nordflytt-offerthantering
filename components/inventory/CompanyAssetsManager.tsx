'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus,
  BarChart3,
  Eye,
  Edit3,
  ShoppingCart
} from 'lucide-react';

interface Asset {
  id: number;
  asset_code: string;
  asset_name: string;
  category: string;
  current_quantity: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  cost_per_unit: number;
  supplier: string;
  location: string;
  status: string;
  last_usage_date?: string;
  lead_time?: number;
  reorder_quantity?: number;
  auto_reorder_enabled?: boolean;
}

interface CategoryCard {
  title: string;
  totalValue: number;
  itemsCount: number;
  lowStockItems: number;
  color: string;
}

export function CompanyAssetsManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, selectedCategory]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/inventory/assets');
      const data = await response.json();
      setAssets(data.assets || getMockAssets());
    } catch (error) {
      console.error('Error fetching assets:', error);
      setAssets(getMockAssets());
    } finally {
      setLoading(false);
    }
  };

  const getMockAssets = (): Asset[] => [
    {
      id: 1,
      asset_code: 'BOX-STD-001',
      asset_name: 'Standard flyttkartonger (50x40x40cm)',
      category: 'Flyttkartonger',
      current_quantity: 180,
      minimum_stock_level: 100,
      maximum_stock_level: 500,
      cost_per_unit: 25,
      supplier: 'Packaging Solutions AB',
      location: 'Huvudlager Stockholm',
      status: 'active',
      last_usage_date: '2024-06-10',
      lead_time: 5,
      reorder_quantity: 200,
      auto_reorder_enabled: true
    },
    {
      id: 2,
      asset_code: 'PACK-BBL-001',
      asset_name: 'Bubbelplast (rulle 100m)',
      category: 'Packematerial',
      current_quantity: 8,
      minimum_stock_level: 10,
      maximum_stock_level: 50,
      cost_per_unit: 200,
      supplier: 'Protective Materials Sweden',
      location: 'Huvudlager Stockholm',
      status: 'active',
      last_usage_date: '2024-06-12',
      lead_time: 3,
      reorder_quantity: 20,
      auto_reorder_enabled: true
    },
    {
      id: 3,
      asset_code: 'TOOL-REM-001',
      asset_name: 'Flyttremmar (set om 4)',
      category: 'Flyttverktyg',
      current_quantity: 12,
      minimum_stock_level: 5,
      maximum_stock_level: 20,
      cost_per_unit: 450,
      supplier: 'Professional Moving Equipment',
      location: 'Huvudlager Stockholm',
      status: 'active',
      last_usage_date: '2024-06-08',
      lead_time: 10,
      reorder_quantity: 10
    },
    {
      id: 4,
      asset_code: 'CLEN-UNI-001',
      asset_name: 'Universalrengöring (5L)',
      category: 'Städmaterial',
      current_quantity: 45,
      minimum_stock_level: 50,
      maximum_stock_level: 200,
      cost_per_unit: 85,
      supplier: 'Eco Clean Supplies',
      location: 'Huvudlager Stockholm',
      status: 'active',
      last_usage_date: '2024-06-11',
      lead_time: 3,
      reorder_quantity: 100,
      auto_reorder_enabled: true
    }
  ];

  const filterAssets = () => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory);
    }

    setFilteredAssets(filtered);
  };

  const getStockLevel = (asset: Asset): 'critical' | 'low' | 'good' | 'excess' => {
    const percentage = (asset.current_quantity / asset.minimum_stock_level) * 100;
    if (percentage === 0) return 'critical';
    if (percentage < 50) return 'low';
    if (percentage > 200) return 'excess';
    return 'good';
  };

  const getStockLevelColor = (level: string) => {
    const colors = {
      critical: 'destructive',
      low: 'warning',
      good: 'success',
      excess: 'secondary'
    };
    return colors[level as keyof typeof colors] || 'default';
  };

  const getStockLevelText = (level: string) => {
    const texts = {
      critical: 'Kritisk',
      low: 'Låg',
      good: 'God',
      excess: 'Överskott'
    };
    return texts[level as keyof typeof texts] || level;
  };

  const categories: CategoryCard[] = [
    {
      title: 'Flyttkartonger',
      totalValue: 25000,
      itemsCount: 5,
      lowStockItems: 0,
      color: '#3B82F6'
    },
    {
      title: 'Packematerial',
      totalValue: 18500,
      itemsCount: 4,
      lowStockItems: 1,
      color: '#8B5CF6'
    },
    {
      title: 'Flyttverktyg',
      totalValue: 67000,
      itemsCount: 3,
      lowStockItems: 0,
      color: '#10B981'
    },
    {
      title: 'Städmaterial',
      totalValue: 12300,
      itemsCount: 5,
      lowStockItems: 1,
      color: '#F59E0B'
    }
  ];

  const lowStockAssets = assets.filter(a => a.current_quantity <= a.minimum_stock_level);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Företagstillgångar
          </h2>
          <p className="text-muted-foreground">Hantera och spåra alla företagets tillgångar</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Lägg till Tillgång
          </Button>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Inventering
          </Button>
          <Button variant="outline">
            Generera Rapport
          </Button>
        </div>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card key={category.title} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{category.title}</CardTitle>
                {category.lowStockItems > 0 && (
                  <Badge variant="warning" className="ml-2">
                    {category.lowStockItems} låg
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{category.totalValue.toLocaleString()} SEK</div>
              <p className="text-sm text-muted-foreground mt-1">
                {category.itemsCount} artiklar
              </p>
              <div 
                className="h-2 rounded-full mt-3" 
                style={{ backgroundColor: category.color, opacity: 0.2 }}
              >
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    backgroundColor: category.color,
                    width: `${(category.itemsCount - category.lowStockItems) / category.itemsCount * 100}%`
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockAssets.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Återbeställning Krävs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Nuvarande Antal</TableHead>
                  <TableHead>Minimum Nivå</TableHead>
                  <TableHead>Leverantör</TableHead>
                  <TableHead>Beställningsförslag</TableHead>
                  <TableHead>Kostnad</TableHead>
                  <TableHead>Åtgärd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.asset_name}</p>
                        <p className="text-sm text-muted-foreground">{asset.asset_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStockLevelColor(getStockLevel(asset))}>
                        {asset.current_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.minimum_stock_level}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.supplier}</p>
                        <p className="text-sm text-muted-foreground">
                          Leveranstid: {asset.lead_time} dagar
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.reorder_quantity} st</p>
                        <p className="text-sm text-muted-foreground">Fyller till max nivå</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold">
                        {((asset.reorder_quantity || 0) * asset.cost_per_unit).toLocaleString()} SEK
                      </p>
                    </TableCell>
                    <TableCell>
                      {asset.auto_reorder_enabled ? (
                        <Button size="sm" variant="default">
                          Auto-beställ
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Beställ
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Sök tillgångar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Alla kategorier</option>
          {categories.map(cat => (
            <option key={cat.title} value={cat.title}>{cat.title}</option>
          ))}
        </select>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alla Tillgångar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tillgång</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Aktuell Mängd</TableHead>
                <TableHead>Lagerstatus</TableHead>
                <TableHead>Plats</TableHead>
                <TableHead>Värde</TableHead>
                <TableHead>Senaste Användning</TableHead>
                <TableHead>Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const stockLevel = getStockLevel(asset);
                return (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.asset_name}</p>
                        <p className="text-sm text-muted-foreground">{asset.asset_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{asset.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{asset.current_quantity}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStockLevelColor(stockLevel)}>
                        {getStockLevelText(stockLevel)}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>
                      <p className="font-bold">
                        {(asset.current_quantity * asset.cost_per_unit).toLocaleString()} SEK
                      </p>
                    </TableCell>
                    <TableCell>
                      {asset.last_usage_date 
                        ? new Date(asset.last_usage_date).toLocaleDateString('sv-SE')
                        : 'Aldrig'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
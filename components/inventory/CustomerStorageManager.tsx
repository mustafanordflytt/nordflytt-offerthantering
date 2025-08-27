'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Plus,
  CreditCard,
  FileText,
  Eye,
  Calendar,
  Search,
  Users,
  TrendingUp,
  Building,
  Shield
} from 'lucide-react';

interface StorageUnit {
  id: number;
  customer_name: string;
  customer_email: string;
  storage_unit_id: string;
  storage_start_date: string;
  total_volume: number;
  storage_type: string;
  monthly_rate: number;
  payment_status: string;
  last_access?: string;
  facility_name?: string;
  items_count?: number;
}

interface Facility {
  id: number;
  facility_name: string;
  total_capacity: number;
  available_capacity: number;
  climate_controlled: boolean;
  security_level: string;
}

export function CustomerStorageManager() {
  const [storageUnits, setStorageUnits] = useState<StorageUnit[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch storage units
      const storageResponse = await fetch('/api/storage/units');
      const storageData = await storageResponse.json();
      
      // Fetch facilities
      const facilitiesResponse = await fetch('/api/storage/facilities');
      const facilitiesData = await facilitiesResponse.json();
      
      setStorageUnits(storageData.units || getMockStorageUnits());
      setFacilities(facilitiesData.facilities || getMockFacilities());
    } catch (error) {
      console.error('Error fetching data:', error);
      setStorageUnits(getMockStorageUnits());
      setFacilities(getMockFacilities());
    } finally {
      setLoading(false);
    }
  };

  const getMockStorageUnits = (): StorageUnit[] => [
    {
      id: 1,
      customer_name: 'Anna Andersson',
      customer_email: 'anna@example.com',
      storage_unit_id: 'STG-2024-A1B',
      storage_start_date: '2024-03-15',
      total_volume: 15,
      storage_type: 'long_term',
      monthly_rate: 1800,
      payment_status: 'current',
      last_access: '2024-05-20',
      facility_name: 'Kundmagasin Solna',
      items_count: 45
    },
    {
      id: 2,
      customer_name: 'Erik Eriksson',
      customer_email: 'erik@example.com',
      storage_unit_id: 'STG-2024-C3D',
      storage_start_date: '2024-04-01',
      total_volume: 8,
      storage_type: 'seasonal',
      monthly_rate: 800,
      payment_status: 'current',
      facility_name: 'Säsongsmagasin',
      items_count: 20
    },
    {
      id: 3,
      customer_name: 'Maria Nilsson',
      customer_email: 'maria@example.com',
      storage_unit_id: 'STG-2024-E5F',
      storage_start_date: '2024-01-10',
      total_volume: 25,
      storage_type: 'long_term',
      monthly_rate: 3000,
      payment_status: 'overdue',
      last_access: '2024-06-01',
      facility_name: 'Kundmagasin Solna',
      items_count: 78
    }
  ];

  const getMockFacilities = (): Facility[] => [
    {
      id: 1,
      facility_name: 'Huvudlager Stockholm',
      total_capacity: 5000,
      available_capacity: 4200,
      climate_controlled: true,
      security_level: 'high'
    },
    {
      id: 2,
      facility_name: 'Kundmagasin Solna',
      total_capacity: 3000,
      available_capacity: 2100,
      climate_controlled: true,
      security_level: 'maximum'
    },
    {
      id: 3,
      facility_name: 'Säsongsmagasin',
      total_capacity: 2000,
      available_capacity: 1800,
      climate_controlled: false,
      security_level: 'basic'
    }
  ];

  const filteredUnits = storageUnits.filter(unit =>
    unit.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.storage_unit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'success';
      case 'overdue': return 'warning';
      case 'delinquent': return 'destructive';
      default: return 'default';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'current': return 'Aktuell';
      case 'overdue': return 'Försenad';
      case 'delinquent': return 'Inkasso';
      default: return status;
    }
  };

  const getStorageTypeText = (type: string) => {
    const types: Record<string, string> = {
      short_term: 'Korttid',
      long_term: 'Långtid',
      seasonal: 'Säsong',
      document_storage: 'Dokument'
    };
    return types[type] || type;
  };

  const totalMonthlyRevenue = storageUnits.reduce((sum, unit) => sum + unit.monthly_rate, 0);
  const annualProjection = totalMonthlyRevenue * 12;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Kundmagasinering
          </h2>
          <p className="text-muted-foreground">Hantera kunders magasinerade föremål</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nytt Magasin
          </Button>
          <Button variant="outline">
            <CreditCard className="w-4 h-4 mr-2" />
            Bearbeta Betalningar
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generera Rapport
          </Button>
        </div>
      </div>

      {/* Storage Facilities Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Magasinsfaciliteter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {facilities.map((facility) => {
            const utilizationRate = ((facility.total_capacity - facility.available_capacity) / facility.total_capacity) * 100;
            return (
              <Card key={facility.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {facility.facility_name}
                    <div className="flex gap-2">
                      {facility.climate_controlled && (
                        <Badge variant="secondary" className="text-xs">Klimat</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {facility.security_level === 'maximum' && '🔒 Max'}
                        {facility.security_level === 'high' && '🔒 Hög'}
                        {facility.security_level === 'basic' && '🔓 Bas'}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Kapacitet</span>
                        <span className="font-medium">{utilizationRate.toFixed(0)}%</span>
                      </div>
                      <Progress value={utilizationRate} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Använt</span>
                      <span>{facility.total_capacity - facility.available_capacity} m³</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tillgängligt</span>
                      <span className="font-medium text-green-600">
                        {facility.available_capacity} m³
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Månadsintäkter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMonthlyRevenue.toLocaleString()} SEK</div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Årsprognos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{annualProjection.toLocaleString()} SEK</div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600">+15%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Genomsnitt per Kund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storageUnits.length > 0 
                ? Math.round(totalMonthlyRevenue / storageUnits.length).toLocaleString()
                : 0
              } SEK/mån
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-purple-600">{storageUnits.length} kunder</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Sök kund, magasin-ID eller e-post..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md w-full"
          />
        </div>
      </div>

      {/* Storage Units Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aktiva Magasin</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kund</TableHead>
                <TableHead>Magasin-ID</TableHead>
                <TableHead>Startdatum</TableHead>
                <TableHead>Volym</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Månadshyra</TableHead>
                <TableHead>Betalningsstatus</TableHead>
                <TableHead>Senaste Besök</TableHead>
                <TableHead>Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{unit.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{unit.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {unit.storage_unit_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    {new Date(unit.storage_start_date).toLocaleDateString('sv-SE')}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{unit.total_volume} m³</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getStorageTypeText(unit.storage_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{unit.monthly_rate.toLocaleString()} SEK</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusColor(unit.payment_status)}>
                      {getPaymentStatusText(unit.payment_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {unit.last_access 
                      ? new Date(unit.last_access).toLocaleDateString('sv-SE')
                      : 'Aldrig'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
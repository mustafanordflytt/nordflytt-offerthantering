"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Target,
  Activity,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { getAuthHeaders } from '@/lib/token-helper';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface CustomerData {
  topCustomers: any[];
  growth: any[];
}

interface PipelineData {
  pipeline: any[];
  funnel: any[];
}

interface EmployeeData {
  name: string;
  email: string;
  role: string;
  jobs: number;
  completedJobs: number;
  inProgressJobs: number;
  avgDuration: number;
  daysWorked: number;
  uniqueCustomers: number;
}

interface JobAnalytics {
  analytics: any[];
  types: any[];
}

interface SatisfactionData {
  average: number;
  totalRatings: number;
  distribution: any[];
}

interface SupplierData {
  supplier_name: string;
  total_spent: number;
  total_transactions: number;
  performanceScore: number | null;
  onTimeDelivery: number | null;
  qualityScore: number | null;
}

interface OverviewData {
  currentMonthRevenue: number;
  currentMonthInvoices: number;
  pipelineValue: number;
  activeLeads: number;
  completedJobs: number;
  activeEmployees: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RapporterPage() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  
  // Report data states
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);
  const [jobAnalytics, setJobAnalytics] = useState<JobAnalytics | null>(null);
  const [satisfactionData, setSatisfactionData] = useState<SatisfactionData | null>(null);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/crm/reports?type=overview', {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch overview data');
      }
      
      const result = await response.json();
      setOverviewData(result.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
      toast.error('Kunde inte hämta översiktsdata');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async (reportType: string) => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/crm/reports?type=${reportType}&period=${selectedPeriod}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${reportType} data`);
      }
      
      const result = await response.json();
      
      switch (reportType) {
        case 'revenue':
          setRevenueData(result.data);
          break;
        case 'customers':
          setCustomerData(result.data);
          break;
        case 'leads':
          setPipelineData(result.data);
          break;
        case 'employees':
          setEmployeeData(result.data);
          break;
        case 'jobs':
          setJobAnalytics(result.data);
          break;
        case 'satisfaction':
          setSatisfactionData(result.data);
          break;
        case 'suppliers':
          setSupplierData(result.data);
          break;
      }
      
      toast.success('Rapport uppdaterad');
    } catch (error) {
      console.error(`Error fetching ${reportType}:`, error);
      toast.error(`Kunde inte hämta ${reportType} data`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/crm/reports/export?type=${selectedReport}&format=${format}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Rapport exporterad');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kunde inte exportera rapport');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to format numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('sv-SE').format(Math.round(num));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapporter & Analytics</h1>
          <p className="text-muted-foreground">
            Avancerad business intelligence för Nordflytt
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Välj period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Senaste 7 dagarna</SelectItem>
              <SelectItem value="30">Senaste 30 dagarna</SelectItem>
              <SelectItem value="90">Senaste 90 dagarna</SelectItem>
              <SelectItem value="365">Senaste året</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                Exportera
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportReport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Exportera som CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReport('json')}>
                <FileText className="h-4 w-4 mr-2" />
                Exportera som JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReportData(selectedReport)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
        </div>
      </div>

      <Tabs defaultValue="oversikt" className="w-full" onValueChange={(value) => {
        setSelectedReport(value);
        if (value !== 'oversikt') {
          fetchReportData(value === 'forsaljning' ? 'revenue' : 
                        value === 'kunder' ? 'customers' :
                        value === 'verksamhet' ? 'jobs' : value);
        }
      }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="oversikt">Översikt</TabsTrigger>
          <TabsTrigger value="forsaljning">Försäljning</TabsTrigger>
          <TabsTrigger value="kunder">Kunder</TabsTrigger>
          <TabsTrigger value="verksamhet">Verksamhet</TabsTrigger>
        </TabsList>

        <TabsContent value="oversikt" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Omsättning</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(overviewData?.currentMonthRevenue || 0)} kr
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  Denna månad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totala Uppdrag</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData?.completedJobs || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  Slutförda denna månad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totala Kunder</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData?.activeEmployees || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  Aktiva anställda
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(overviewData?.pipelineValue || 0)} kr
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {overviewData?.activeLeads || 0} aktiva leads
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Omsättningstrend (12 månader)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${formatNumber(Number(value))} kr`, 
                        name === 'revenue' ? 'Omsättning' : name === 'expenses' ? 'Kostnader' : 'Vinst'
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      name="Omsättning"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ff7300" 
                      name="Kostnader"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tjänstetyper</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobAnalytics?.types || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(jobAnalytics?.types || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forsaljning" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Genomsnittligt Ordervärde</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(revenueData.reduce((sum, month) => sum + month.revenue, 0) / (revenueData.length || 1))} kr
                </div>
                <Badge variant="secondary" className="mt-2">
                  Genomsnitt per månad
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Månatlig Tillväxt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+12.3%</div>
                <p className="text-sm text-muted-foreground">
                  Jämfört med föregående månad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pipeline Värde</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(pipelineData?.pipeline?.reduce((sum, stage) => sum + (stage.total_pipeline_value || 0), 0) || 0)} kr
                </div>
                <p className="text-sm text-muted-foreground">
                  {pipelineData?.pipeline?.reduce((sum, stage) => sum + (stage.lead_count || 0), 0) || 0} aktiva leads
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Försäljningsprestanda per Månad</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${formatNumber(Number(value))} kr`,
                      name === 'revenue' ? 'Omsättning' : name === 'expenses' ? 'Kostnader' : 'Vinst'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Omsättning" />
                  <Bar dataKey="expenses" fill="#ff7300" name="Kostnader" />
                  <Bar dataKey="profit" fill="#82ca9d" name="Vinst" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kunder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kundsegmentering</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={customerData?.growth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="#8884d8" 
                      name="Totalt antal kunder"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Kunder (Livstidsvärde)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(customerData?.topCustomers || [])
                    .slice(0, 5)
                    .map((customer, index) => (
                      <div key={customer.customer_id} className="flex items-center space-x-4">
                        <div className="flex-1">
                          <p className="font-medium">{customer.company_name || customer.contact_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.total_jobs} uppdrag
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatNumber(customer.total_revenue || 0)} kr
                          </p>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Återkommande Kunder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(customerData?.topCustomers || []).filter(c => (c.total_jobs || 0) > 1).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Av top {(customerData?.topCustomers || []).length} kunder
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Genomsnittligt Kundvärde</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(
                    (customerData?.topCustomers || []).length > 0 
                      ? (customerData?.topCustomers || []).reduce((sum, c) => sum + (c.total_revenue || 0), 0) / (customerData?.topCustomers || []).length 
                      : 0
                  )} kr
                </div>
                <p className="text-xs text-muted-foreground">
                  Genomsnitt top kunder
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Kundretention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.2%</div>
                <p className="text-xs text-muted-foreground">
                  12-månaders retention
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verksamhet" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aktiva Uppdrag</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobAnalytics?.analytics?.[0]?.total_jobs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Totalt denna månad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Slutförda Uppdrag</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobAnalytics?.analytics?.[0]?.completed_jobs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Slutförda denna månad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Genomsnittlig Ledtid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5.2 dagar</div>
                <p className="text-xs text-muted-foreground">
                  Från offert till start
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Kundnöjdhet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{satisfactionData?.average || 0}/5.0</div>
                <p className="text-xs text-muted-foreground">
                  {satisfactionData?.totalRatings || 0} omdömen
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leads Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={pipelineData?.pipeline || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pipeline_stage" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'lead_count' ? `${value} st` : `${formatNumber(Number(value))} kr`,
                      name === 'lead_count' ? 'Antal leads' : 'Uppskattat värde'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="lead_count" fill="#8884d8" name="Antal leads" />
                  <Bar dataKey="total_pipeline_value" fill="#82ca9d" name="Uppskattat värde" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operativa Nyckeltal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Genomsnittlig uppdragstid</span>
                  <Badge>6.5 timmar</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Kapacitetsutnyttjande</span>
                  <Badge variant="secondary">78%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Punktlighet</span>
                  <Badge variant="outline">96.2%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Återkommande uppdrag</span>
                  <Badge>23%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kvalitetsmätningar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Kundklagomål</span>
                  <Badge variant="destructive">2.1%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Återkommande kunder</span>
                  <Badge variant="secondary">45%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>NPS Score</span>
                  <Badge>67</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rekommendationer</span>
                  <Badge variant="outline">89%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
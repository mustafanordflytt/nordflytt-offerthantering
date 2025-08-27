'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Receipt, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  PieChart,
  Calculator,
  Banknote,
  Plus,
  Send,
  Download,
  Search,
  Filter,
  Calendar,
  CreditCard
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: number;
  customer: any;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotalAmount: number;
  vatAmount: number;
  rutDeductionAmount: number;
  totalAmount: number;
  paidAmount: number;
  rutEligible: boolean;
  fortnoxId?: string;
  fortnoxStatus?: string;
  autoCreated: boolean;
  aiReviewScore?: number;
  aiApproved?: boolean;
  lineItems: any[];
  payments: any[];
}

interface Expense {
  id: string;
  expenseNumber: string;
  supplierId: number;
  supplier: any;
  supplierInvoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  expenseCategory?: string;
  aiCategorySuggestion?: string;
  aiFraudRiskScore?: number;
  aiApprovalRecommendation?: boolean;
  description?: string;
  approvedAt?: string;
  approvedBy?: any;
}

export default function EkonomiPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [showCreateExpenseDialog, setShowCreateExpenseDialog] = useState(false);
  const [invoiceFilters, setInvoiceFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [expenseFilters, setExpenseFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    unpaidInvoices: 0,
    pendingExpenses: 0,
    profitMargin: 0,
    cashFlow: 0
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      
      // Fetch invoices
      const invoiceResponse = await fetch('/api/crm/invoices?limit=50', {
        headers
      });
      
      if (!invoiceResponse.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const invoiceData = await invoiceResponse.json();
      setInvoices(invoiceData.invoices || []);
      
      // Fetch expenses
      const expenseResponse = await fetch('/api/crm/expenses?limit=50', {
        headers
      });
      
      if (!expenseResponse.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      const expenseData = await expenseResponse.json();
      setExpenses(expenseData.expenses || []);
      
      // Calculate stats
      calculateStats(invoiceData.invoices || [], expenseData.expenses || []);
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Kunde inte hämta ekonomidata');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (invoices: Invoice[], expenses: Expense[]) => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
    const pendingExpenses = expenses.filter(exp => exp.status === 'pending').length;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    const cashFlow = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0) - expenses.reduce((sum, exp) => sum + exp.paidAmount, 0);
    
    setStats({
      totalRevenue,
      totalExpenses,
      unpaidInvoices,
      pendingExpenses,
      profitMargin,
      cashFlow
    });
  };

  const sendInvoice = async (invoiceId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/crm/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to send invoice');
      }

      toast.success('Faktura skickad');
      fetchFinancialData();
    } catch (error) {
      toast.error('Kunde inte skicka faktura');
    }
  };

  const recordPayment = async (invoiceId: string, amount: number) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/crm/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          paymentDate: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      toast.success('Betalning registrerad');
      fetchFinancialData();
    } catch (error) {
      toast.error('Kunde inte registrera betalning');
    }
  };

  const approveExpense = async (expenseId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/crm/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'approved'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve expense');
      }

      toast.success('Utgift godkänd');
      fetchFinancialData();
    } catch (error) {
      toast.error('Kunde inte godkänna utgift');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-500', label: 'Utkast' },
      sent: { color: 'bg-blue-500', label: 'Skickad' },
      viewed: { color: 'bg-yellow-500', label: 'Visad' },
      paid: { color: 'bg-green-500', label: 'Betald' },
      overdue: { color: 'bg-red-500', label: 'Förfallen' },
      pending: { color: 'bg-yellow-500', label: 'Väntar' },
      approved: { color: 'bg-green-500', label: 'Godkänd' },
      rejected: { color: 'bg-red-500', label: 'Avvisad' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-500', label: status };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total intäkt</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('sv-SE')} kr</div>
            <p className="text-xs text-muted-foreground">denna månad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala utgifter</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExpenses.toLocaleString('sv-SE')} kr</div>
            <p className="text-xs text-muted-foreground">denna månad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obetalda fakturor</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unpaidInvoices.toLocaleString('sv-SE')} kr</div>
            <p className="text-xs text-muted-foreground">{invoices.filter(i => i.status !== 'paid').length} fakturor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kassaflöde</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.cashFlow >= 0 ? '+' : ''}{stats.cashFlow.toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-muted-foreground">netto denna månad</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Senaste aktivitet</CardTitle>
          <CardDescription>Nyligen skapade fakturor och utgifter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...invoices.slice(0, 3).map(inv => ({
              type: 'invoice',
              id: inv.id,
              title: `Faktura ${inv.invoiceNumber}`,
              subtitle: inv.customer?.customer_name,
              amount: inv.totalAmount,
              date: inv.invoiceDate,
              status: inv.status
            })), ...expenses.slice(0, 3).map(exp => ({
              type: 'expense',
              id: exp.id,
              title: `Utgift ${exp.expenseNumber}`,
              subtitle: exp.supplier?.supplier_name,
              amount: exp.totalAmount,
              date: exp.invoiceDate,
              status: exp.status
            }))]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.type === 'invoice' ? 
                    <FileText className="h-5 w-5 text-blue-600" /> : 
                    <Receipt className="h-5 w-5 text-red-600" />
                  }
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.amount.toLocaleString('sv-SE')} kr</p>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök fakturor..."
              className="pl-8 w-[300px]"
              value={invoiceFilters.search}
              onChange={(e) => setInvoiceFilters({ ...invoiceFilters, search: e.target.value })}
            />
          </div>
          <Select 
            value={invoiceFilters.status} 
            onValueChange={(value) => setInvoiceFilters({ ...invoiceFilters, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alla status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla status</SelectItem>
              <SelectItem value="draft">Utkast</SelectItem>
              <SelectItem value="sent">Skickade</SelectItem>
              <SelectItem value="paid">Betalda</SelectItem>
              <SelectItem value="overdue">Förfallna</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny faktura
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa ny faktura</DialogTitle>
              <DialogDescription>
                Skapa en ny faktura manuellt
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fakturaskapande kommer snart...
              </p>
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
                  <th className="text-left p-4">Fakturanummer</th>
                  <th className="text-left p-4">Kund</th>
                  <th className="text-left p-4">Datum</th>
                  <th className="text-left p-4">Förfallodatum</th>
                  <th className="text-right p-4">Belopp</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter(inv => 
                    (invoiceFilters.status === 'all' || inv.status === invoiceFilters.status) &&
                    (!invoiceFilters.search || 
                      inv.invoiceNumber.toLowerCase().includes(invoiceFilters.search.toLowerCase()) ||
                      inv.customer?.customer_name?.toLowerCase().includes(invoiceFilters.search.toLowerCase())
                    )
                  )
                  .map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{invoice.invoiceNumber}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{invoice.customer?.customer_name || 'Okänd kund'}</p>
                          <p className="text-sm text-muted-foreground">{invoice.customer?.customer_email}</p>
                        </div>
                      </td>
                      <td className="p-4">{new Date(invoice.invoiceDate).toLocaleDateString('sv-SE')}</td>
                      <td className="p-4">{new Date(invoice.dueDate).toLocaleDateString('sv-SE')}</td>
                      <td className="p-4 text-right">
                        <div>
                          <p className="font-medium">{invoice.totalAmount.toLocaleString('sv-SE')} kr</p>
                          {invoice.rutDeductionAmount > 0 && (
                            <p className="text-sm text-green-600">RUT: -{invoice.rutDeductionAmount.toLocaleString('sv-SE')} kr</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(invoice.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {invoice.status === 'draft' && (
                            <Button 
                              size="sm" 
                              onClick={() => sendInvoice(invoice.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Skicka
                            </Button>
                          )}
                          {invoice.status === 'sent' && invoice.paidAmount < invoice.totalAmount && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => recordPayment(invoice.id, invoice.totalAmount - invoice.paidAmount)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Registrera betalning
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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

  const renderExpenses = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök utgifter..."
              className="pl-8 w-[300px]"
              value={expenseFilters.search}
              onChange={(e) => setExpenseFilters({ ...expenseFilters, search: e.target.value })}
            />
          </div>
          <Select 
            value={expenseFilters.status} 
            onValueChange={(value) => setExpenseFilters({ ...expenseFilters, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alla status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla status</SelectItem>
              <SelectItem value="pending">Väntar på godkännande</SelectItem>
              <SelectItem value="approved">Godkända</SelectItem>
              <SelectItem value="paid">Betalda</SelectItem>
              <SelectItem value="rejected">Avvisade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showCreateExpenseDialog} onOpenChange={setShowCreateExpenseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny utgift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrera ny utgift</DialogTitle>
              <DialogDescription>
                Lägg till en ny leverantörsfaktura
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Utgiftsregistrering kommer snart...
              </p>
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
                  <th className="text-left p-4">Utgiftsnummer</th>
                  <th className="text-left p-4">Leverantör</th>
                  <th className="text-left p-4">Datum</th>
                  <th className="text-left p-4">Kategori</th>
                  <th className="text-right p-4">Belopp</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">AI-analys</th>
                  <th className="text-left p-4">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {expenses
                  .filter(exp => 
                    (expenseFilters.status === 'all' || exp.status === expenseFilters.status) &&
                    (!expenseFilters.search || 
                      exp.expenseNumber.toLowerCase().includes(expenseFilters.search.toLowerCase()) ||
                      exp.supplier?.supplier_name?.toLowerCase().includes(expenseFilters.search.toLowerCase()) ||
                      exp.description?.toLowerCase().includes(expenseFilters.search.toLowerCase())
                    )
                  )
                  .map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{expense.expenseNumber}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{expense.supplier?.supplier_name || 'Okänd leverantör'}</p>
                          <p className="text-sm text-muted-foreground">{expense.supplierInvoiceNumber}</p>
                        </div>
                      </td>
                      <td className="p-4">{new Date(expense.invoiceDate).toLocaleDateString('sv-SE')}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {expense.expenseCategory || expense.aiCategorySuggestion || 'Okategoriserad'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {expense.totalAmount.toLocaleString('sv-SE')} kr
                      </td>
                      <td className="p-4">{getStatusBadge(expense.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {expense.aiFraudRiskScore !== undefined && (
                            <Badge 
                              className={expense.aiFraudRiskScore > 0.7 ? 'bg-red-500' : 'bg-green-500'}
                            >
                              Risk: {Math.round(expense.aiFraudRiskScore * 100)}%
                            </Badge>
                          )}
                          {expense.aiApprovalRecommendation && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {expense.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => approveExpense(expense.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Godkänn
                          </Button>
                        )}
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
          <p className="mt-4 text-gray-600">Laddar ekonomidata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ekonomi</h1>
        <p className="text-muted-foreground">Hantera fakturor, utgifter och finansiell rapportering</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="invoices">Fakturor</TabsTrigger>
          <TabsTrigger value="expenses">Utgifter</TabsTrigger>
          <TabsTrigger value="reports">Rapporter</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {renderInvoices()}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          {renderExpenses()}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Finansiella rapporter</CardTitle>
              <CardDescription>Kommande funktionalitet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4" />
                <p>Finansiella rapporter kommer snart...</p>
                <p className="text-sm mt-2">Resultaträkning, balansräkning, kassaflödesanalys</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
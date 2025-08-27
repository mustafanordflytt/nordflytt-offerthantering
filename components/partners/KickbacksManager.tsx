'use client'

import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  FileText,
  Building2,
  CreditCard,
  Calculator,
  Zap,
  Award,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Send,
  RefreshCw,
  Banknote,
  Receipt,
  AlertTriangle,
  CheckSquare
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DynamicKickbackEngine, KickbackCalculation } from '@/lib/partners/DynamicKickbackEngine'

interface KickbackPayment {
  id: number
  partnerId: number
  partnerName: string
  partnerCategory: string
  partnerTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  agentId?: number
  agentName?: string
  paymentPeriod: string
  periodStart: Date
  periodEnd: Date
  referralsIncluded: number
  baseKickbackAmount: number
  volumeBonus: number
  qualityBonus: number
  tierBonus: number
  performanceBonus: number
  specialPromotionBonus: number
  totalGrossAmount: number
  taxDeduction: number
  adminFee: number
  netPaymentAmount: number
  paymentMethod: 'bank_transfer' | 'swish' | 'invoice'
  paymentReference: string
  paymentStatus: 'pending' | 'calculated' | 'approved' | 'processing' | 'paid' | 'failed'
  paymentDate?: Date
  paymentConfirmation?: string
  invoiceRequired: boolean
  invoiceSent: boolean
  invoiceFilePath?: string
  bankAccount?: {
    accountNumber: string
    bankName: string
    swiftCode?: string
    accountHolder: string
  }
  swishNumber?: string
  notes?: string
}

interface PaymentMetrics {
  totalPending: number
  totalApproved: number
  totalPaid: number
  currentMonthTotal: number
  avgKickbackPerPartner: number
  topEarningPartner: string
  nextPaymentRun: Date
  totalTaxWithheld: number
}

interface KickbacksManagerProps {
  onPaymentsChange?: (payments: KickbackPayment[]) => void
}

export function KickbacksManager({ onPaymentsChange }: KickbacksManagerProps) {
  const [payments, setPayments] = useState<KickbackPayment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<KickbackPayment[]>([])
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
    currentMonthTotal: 0,
    avgKickbackPerPartner: 0,
    topEarningPartner: '',
    nextPaymentRun: new Date(),
    totalTaxWithheld: 0
  })
  
  const [selectedPayment, setSelectedPayment] = useState<KickbackPayment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedPartner, setSelectedPartner] = useState('all')
  const [isCalculationModalOpen, setIsCalculationModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false)
  const [selectedPayments, setSelectedPayments] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentCalculation, setCurrentCalculation] = useState<KickbackCalculation | null>(null)
  
  const [kickbackEngine] = useState(new DynamicKickbackEngine())

  const paymentStatuses = [
    { id: 'all', name: 'Alla statusar', color: 'bg-gray-100 text-gray-800' },
    { id: 'pending', name: 'Väntande', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'calculated', name: 'Beräknad', color: 'bg-blue-100 text-blue-800' },
    { id: 'approved', name: 'Godkänd', color: 'bg-green-100 text-green-800' },
    { id: 'processing', name: 'Behandlas', color: 'bg-purple-100 text-purple-800' },
    { id: 'paid', name: 'Betald', color: 'bg-green-100 text-green-800' },
    { id: 'failed', name: 'Misslyckad', color: 'bg-red-100 text-red-800' }
  ]

  // Mock data for demonstration
  useEffect(() => {
    const mockPayments: KickbackPayment[] = [
      {
        id: 1,
        partnerId: 1,
        partnerName: 'Svensk Fastighetsförmedling Stockholm',
        partnerCategory: 'mäklare',
        partnerTier: 'gold',
        paymentPeriod: 'Januari 2025',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        referralsIncluded: 28,
        baseKickbackAmount: 23800,
        volumeBonus: 1190,
        qualityBonus: 714,
        tierBonus: 2380,
        performanceBonus: 476,
        specialPromotionBonus: 14000,
        totalGrossAmount: 42560,
        taxDeduction: 12768,
        adminFee: 851,
        netPaymentAmount: 28941,
        paymentMethod: 'bank_transfer',
        paymentReference: 'KICKBACK-1-ORG-20250115',
        paymentStatus: 'approved',
        invoiceRequired: true,
        invoiceSent: false,
        bankAccount: {
          accountNumber: '1234567890',
          bankName: 'Handelsbanken',
          accountHolder: 'Svensk Fastighetsförmedling Stockholm AB'
        }
      },
      {
        id: 2,
        partnerId: 2,
        partnerName: 'Fonus Stockholm',
        partnerCategory: 'begravningsbyråer',
        partnerTier: 'platinum',
        paymentPeriod: 'Januari 2025',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        referralsIncluded: 15,
        baseKickbackAmount: 25920,
        volumeBonus: 0,
        qualityBonus: 778,
        tierBonus: 3370,
        performanceBonus: 518,
        specialPromotionBonus: 7500,
        totalGrossAmount: 38086,
        taxDeduction: 11426,
        adminFee: 762,
        netPaymentAmount: 25898,
        paymentMethod: 'bank_transfer',
        paymentReference: 'KICKBACK-2-ORG-20250115',
        paymentStatus: 'processing',
        invoiceRequired: true,
        invoiceSent: true,
        invoiceFilePath: '/invoices/2025/01/fonus-stockholm.pdf',
        bankAccount: {
          accountNumber: '9876543210',
          bankName: 'SEB',
          accountHolder: 'Fonus Stockholm AB'
        }
      },
      {
        id: 3,
        partnerId: 4,
        partnerName: 'Handelsbanken Private Banking',
        partnerCategory: 'bankRådgivare',
        partnerTier: 'silver',
        paymentPeriod: 'Januari 2025',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        referralsIncluded: 18,
        baseKickbackAmount: 7776,
        volumeBonus: 0,
        qualityBonus: 233,
        tierBonus: 778,
        performanceBonus: 156,
        specialPromotionBonus: 0,
        totalGrossAmount: 8943,
        taxDeduction: 2683,
        adminFee: 179,
        netPaymentAmount: 6081,
        paymentMethod: 'bank_transfer',
        paymentReference: 'KICKBACK-4-ORG-20250115',
        paymentStatus: 'paid',
        paymentDate: new Date('2025-01-15'),
        paymentConfirmation: 'TXN-2025011500123',
        invoiceRequired: false,
        invoiceSent: false,
        bankAccount: {
          accountNumber: '5555666677',
          bankName: 'Handelsbanken',
          accountHolder: 'Handelsbanken Private Banking'
        }
      },
      {
        id: 4,
        partnerId: 5,
        partnerName: 'Stockholm Städservice',
        partnerCategory: 'flyttstädning',
        partnerTier: 'bronze',
        paymentPeriod: 'Januari 2025',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        referralsIncluded: 12,
        baseKickbackAmount: 9720,
        volumeBonus: 0,
        qualityBonus: 0,
        tierBonus: 0,
        performanceBonus: 0,
        specialPromotionBonus: 6000,
        totalGrossAmount: 15720,
        taxDeduction: 4716,
        adminFee: 314,
        netPaymentAmount: 10690,
        paymentMethod: 'swish',
        paymentReference: 'KICKBACK-5-ORG-20250115',
        paymentStatus: 'calculated',
        swishNumber: '0701234567',
        invoiceRequired: false,
        invoiceSent: false
      },
      {
        id: 5,
        partnerId: 3,
        partnerName: 'Stockholmshem',
        partnerCategory: 'fastighetsförvaltare',
        partnerTier: 'silver',
        paymentPeriod: 'December 2024',
        periodStart: new Date('2024-12-01'),
        periodEnd: new Date('2024-12-31'),
        referralsIncluded: 22,
        baseKickbackAmount: 13200,
        volumeBonus: 660,
        qualityBonus: 396,
        tierBonus: 1320,
        performanceBonus: 264,
        specialPromotionBonus: 0,
        totalGrossAmount: 15840,
        taxDeduction: 4752,
        adminFee: 317,
        netPaymentAmount: 10771,
        paymentMethod: 'bank_transfer',
        paymentReference: 'KICKBACK-3-ORG-20241215',
        paymentStatus: 'paid',
        paymentDate: new Date('2024-12-15'),
        paymentConfirmation: 'TXN-2024121500456',
        invoiceRequired: true,
        invoiceSent: true,
        invoiceFilePath: '/invoices/2024/12/stockholmshem.pdf',
        bankAccount: {
          accountNumber: '3333444455',
          bankName: 'Nordea',
          accountHolder: 'Stockholmshem AB'
        }
      }
    ]
    
    setPayments(mockPayments)
  }, [])

  // Calculate metrics
  useEffect(() => {
    if (payments.length > 0) {
      const totalPending = payments
        .filter(p => p.paymentStatus === 'pending')
        .reduce((sum, p) => sum + p.netPaymentAmount, 0)
      
      const totalApproved = payments
        .filter(p => p.paymentStatus === 'approved')
        .reduce((sum, p) => sum + p.netPaymentAmount, 0)
      
      const totalPaid = payments
        .filter(p => p.paymentStatus === 'paid')
        .reduce((sum, p) => sum + p.netPaymentAmount, 0)
      
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const currentMonthTotal = payments
        .filter(p => p.periodStart.getMonth() === currentMonth && p.periodStart.getFullYear() === currentYear)
        .reduce((sum, p) => sum + p.netPaymentAmount, 0)
      
      const avgKickbackPerPartner = payments.reduce((sum, p) => sum + p.netPaymentAmount, 0) / payments.length
      
      const totalTaxWithheld = payments.reduce((sum, p) => sum + p.taxDeduction, 0)
      
      // Find top earning partner
      const partnerEarnings = payments.reduce((acc, p) => {
        acc[p.partnerName] = (acc[p.partnerName] || 0) + p.netPaymentAmount
        return acc
      }, {} as Record<string, number>)
      
      const topEarningPartner = Object.entries(partnerEarnings).reduce((a, b) => 
        a[1] > b[1] ? a : b
      )?.[0] || ''
      
      // Next payment run date (15th of next month)
      const nextPaymentRun = new Date()
      nextPaymentRun.setMonth(nextPaymentRun.getMonth() + 1)
      nextPaymentRun.setDate(15)
      
      setMetrics({
        totalPending,
        totalApproved,
        totalPaid,
        currentMonthTotal,
        avgKickbackPerPartner,
        topEarningPartner,
        nextPaymentRun,
        totalTaxWithheld
      })
    }
  }, [payments])

  // Filter payments
  useEffect(() => {
    let filtered = payments.filter(payment => {
      const matchesSearch = payment.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.paymentReference.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || payment.paymentStatus === selectedStatus
      const matchesPartner = selectedPartner === 'all' || payment.partnerName === selectedPartner
      
      // Filter by period
      let matchesPeriod = true
      if (selectedPeriod === 'current') {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        matchesPeriod = payment.periodStart.getMonth() === currentMonth && 
                       payment.periodStart.getFullYear() === currentYear
      } else if (selectedPeriod === 'previous') {
        const previousMonth = new Date()
        previousMonth.setMonth(previousMonth.getMonth() - 1)
        matchesPeriod = payment.periodStart.getMonth() === previousMonth.getMonth() && 
                       payment.periodStart.getFullYear() === previousMonth.getFullYear()
      }
      
      return matchesSearch && matchesStatus && matchesPartner && matchesPeriod
    })

    setFilteredPayments(filtered)
  }, [payments, searchTerm, selectedStatus, selectedPartner, selectedPeriod])

  // Notify parent component of changes
  useEffect(() => {
    if (onPaymentsChange) {
      onPaymentsChange(payments)
    }
  }, [payments, onPaymentsChange])

  const handleCalculateKickback = async (partnerId: number) => {
    setIsLoading(true)
    try {
      const calculation = await kickbackEngine.calculateMonthlyKickback(partnerId)
      setCurrentCalculation(calculation)
      setIsCalculationModalOpen(true)
      
      // Create payment record from calculation
      const newPayment: KickbackPayment = {
        id: Date.now(),
        partnerId: calculation.partnerId,
        partnerName: `Partner ${partnerId}`, // In real app, fetch from database
        partnerCategory: 'mäklare', // In real app, fetch from database
        partnerTier: 'silver', // In real app, fetch from database
        agentId: calculation.agentId,
        paymentPeriod: calculation.calculationPeriod,
        periodStart: calculation.periodStart,
        periodEnd: calculation.periodEnd,
        referralsIncluded: calculation.referralsIncluded.length,
        baseKickbackAmount: calculation.baseAmount,
        volumeBonus: calculation.bonuses.volume.amount,
        qualityBonus: calculation.bonuses.quality.amount,
        tierBonus: calculation.bonuses.tier.amount,
        performanceBonus: calculation.bonuses.performance.amount,
        specialPromotionBonus: calculation.bonuses.specialPromotions.reduce((sum, p) => sum + p.bonusAmount, 0),
        totalGrossAmount: calculation.baseAmount + calculation.bonuses.total,
        taxDeduction: calculation.deductions.taxWithholding,
        adminFee: calculation.deductions.adminFee,
        netPaymentAmount: calculation.finalAmount,
        paymentMethod: calculation.paymentInstructions.paymentMethod,
        paymentReference: calculation.paymentInstructions.paymentReference,
        paymentStatus: 'calculated',
        invoiceRequired: calculation.paymentInstructions.invoiceRequired,
        invoiceSent: false,
        bankAccount: calculation.paymentInstructions.bankAccount,
        swishNumber: calculation.paymentInstructions.swishNumber
      }
      
      setPayments([...payments, newPayment])
    } catch (error) {
      console.error('Error calculating kickback:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCalculateAll = async () => {
    setIsLoading(true)
    try {
      // In real app, fetch all partners and calculate kickbacks
      console.log('Calculating kickbacks for all partners...')
      // Mock implementation
      setTimeout(() => {
        setIsLoading(false)
        alert('Kickbacks beräknade för alla partners!')
      }, 2000)
    } catch (error) {
      console.error('Error calculating all kickbacks:', error)
      setIsLoading(false)
    }
  }

  const handleApprovePayment = async (paymentId: number) => {
    setIsLoading(true)
    try {
      setPayments(payments.map(p => 
        p.id === paymentId ? { ...p, paymentStatus: 'approved' } : p
      ))
    } catch (error) {
      console.error('Error approving payment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessPayment = async (paymentId: number) => {
    setIsLoading(true)
    try {
      setPayments(payments.map(p => 
        p.id === paymentId ? { ...p, paymentStatus: 'processing' } : p
      ))
      
      // Simulate payment processing
      setTimeout(() => {
        setPayments(payments.map(p => 
          p.id === paymentId 
            ? { 
                ...p, 
                paymentStatus: 'paid',
                paymentDate: new Date(),
                paymentConfirmation: `TXN-${Date.now()}`
              } 
            : p
        ))
      }, 3000)
    } catch (error) {
      console.error('Error processing payment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkApprove = async () => {
    setIsLoading(true)
    try {
      setPayments(payments.map(p => 
        selectedPayments.includes(p.id) && p.paymentStatus === 'calculated'
          ? { ...p, paymentStatus: 'approved' }
          : p
      ))
      setSelectedPayments([])
      setIsBulkActionModalOpen(false)
    } catch (error) {
      console.error('Error bulk approving payments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkProcess = async () => {
    setIsLoading(true)
    try {
      setPayments(payments.map(p => 
        selectedPayments.includes(p.id) && p.paymentStatus === 'approved'
          ? { ...p, paymentStatus: 'processing' }
          : p
      ))
      
      // Simulate payment processing
      setTimeout(() => {
        setPayments(payments.map(p => 
          selectedPayments.includes(p.id)
            ? { 
                ...p, 
                paymentStatus: 'paid',
                paymentDate: new Date(),
                paymentConfirmation: `TXN-${Date.now()}`
              }
            : p
        ))
        setSelectedPayments([])
      }, 3000)
      
      setIsBulkActionModalOpen(false)
    } catch (error) {
      console.error('Error bulk processing payments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportReport = () => {
    // In real app, generate and download CSV/Excel report
    console.log('Exporting payment report...')
  }

  const handleSendInvoice = async (paymentId: number) => {
    setIsLoading(true)
    try {
      setPayments(payments.map(p => 
        p.id === paymentId 
          ? { 
              ...p, 
              invoiceSent: true,
              invoiceFilePath: `/invoices/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${p.partnerName.toLowerCase().replace(/\s+/g, '-')}.pdf`
            }
          : p
      ))
    } catch (error) {
      console.error('Error sending invoice:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePaymentSelection = (paymentId: number) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    )
  }

  const selectAllPayments = () => {
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([])
    } else {
      setSelectedPayments(filteredPayments.map(p => p.id))
    }
  }

  const getStatusColor = (status: string) => {
    const statusConfig = paymentStatuses.find(s => s.id === status)
    return statusConfig ? statusConfig.color : 'bg-gray-100 text-gray-800'
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'bronze': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getUniquePartners = () => {
    const partners = Array.from(new Set(payments.map(p => p.partnerName)))
    return [{ id: 'all', name: 'Alla partners' }, ...partners.map(p => ({ id: p, name: p }))]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kickback betalningar</h2>
          <p className="text-gray-600">Hantera och behandla partner kickbacks</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportera rapport
          </Button>
          <Button size="sm" onClick={handleCalculateAll} disabled={isLoading}>
            <Calculator className="w-4 h-4 mr-2" />
            Beräkna alla
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Väntande betalningar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              Att behandla
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Godkända</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalApproved)}</div>
            <p className="text-xs text-muted-foreground">
              Redo att betala
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utbetalat</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              Totalt utbetalat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nästa utbetalning</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(metrics.nextPaymentRun)}</div>
            <p className="text-xs text-muted-foreground">
              Schemalagd körning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending actions */}
      {payments.filter(p => p.paymentStatus === 'calculated').length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Åtgärd krävs</AlertTitle>
          <AlertDescription>
            Det finns {payments.filter(p => p.paymentStatus === 'calculated').length} beräknade betalningar som väntar på godkännande.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">Betalningar</TabsTrigger>
          <TabsTrigger value="processing">Behandlas</TabsTrigger>
          <TabsTrigger value="history">Historik</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Sök betalningar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getUniquePartners().map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Denna månad</SelectItem>
                  <SelectItem value="previous">Förra månaden</SelectItem>
                  <SelectItem value="all">Alla perioder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedPayments.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedPayments.length} betalningar valda
              </span>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedPayments([])}
                >
                  Avmarkera alla
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setIsBulkActionModalOpen(true)}
                >
                  Bulk åtgärder
                </Button>
              </div>
            </div>
          )}

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Betalningar ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                        onChange={() => selectAllPayments()}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Brutto</TableHead>
                    <TableHead>Bonusar</TableHead>
                    <TableHead>Avdrag</TableHead>
                    <TableHead>Netto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedPayments.includes(payment.id)}
                          onChange={() => togglePaymentSelection(payment.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.partnerName}</div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge variant="outline" className="text-xs">{payment.partnerCategory}</Badge>
                            <Badge className={getTierColor(payment.partnerTier)}>{payment.partnerTier}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{payment.paymentPeriod}</TableCell>
                      <TableCell>{payment.referralsIncluded}</TableCell>
                      <TableCell>{formatCurrency(payment.totalGrossAmount)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.volumeBonus > 0 && (
                            <div className="text-green-600">+{formatCurrency(payment.volumeBonus)}</div>
                          )}
                          {payment.tierBonus > 0 && (
                            <div className="text-blue-600">+{formatCurrency(payment.tierBonus)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-red-600">
                          -{formatCurrency(payment.taxDeduction + payment.adminFee)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.netPaymentAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.paymentStatus)}>
                          {paymentStatuses.find(s => s.id === payment.paymentStatus)?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedPayment(payment)
                              setIsDetailsModalOpen(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visa detaljer
                            </DropdownMenuItem>
                            {payment.paymentStatus === 'calculated' && (
                              <DropdownMenuItem onClick={() => handleApprovePayment(payment.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Godkänn
                              </DropdownMenuItem>
                            )}
                            {payment.paymentStatus === 'approved' && (
                              <DropdownMenuItem onClick={() => handleProcessPayment(payment.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Behandla betalning
                              </DropdownMenuItem>
                            )}
                            {payment.invoiceRequired && !payment.invoiceSent && (
                              <DropdownMenuItem onClick={() => handleSendInvoice(payment.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Skicka faktura
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Ladda ner kvitto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Betalningar som behandlas</CardTitle>
              <CardDescription>
                Betalningar som för närvarande processas i banksystemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.filter(p => p.paymentStatus === 'processing').map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{payment.partnerName}</div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(payment.netPaymentAmount)} • {payment.paymentMethod}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      </div>
                      <span className="text-sm text-gray-500">Behandlas...</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Betalningshistorik</CardTitle>
              <CardDescription>
                Alla genomförda betalningar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Belopp</TableHead>
                    <TableHead>Betalningsdatum</TableHead>
                    <TableHead>Bekräftelse</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.filter(p => p.paymentStatus === 'paid').map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.partnerName}</TableCell>
                      <TableCell>{payment.paymentPeriod}</TableCell>
                      <TableCell>{formatCurrency(payment.netPaymentAmount)}</TableCell>
                      <TableCell>{payment.paymentDate ? formatDate(payment.paymentDate) : '-'}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {payment.paymentConfirmation}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Receipt className="w-4 h-4 mr-2" />
                          Kvitto
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kickback fördelning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bas kickback</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volym bonus</span>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                  <Progress value={12} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tier bonus</span>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Special kampanjer</span>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Partner kategorier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mäklare</span>
                    <span className="text-sm font-medium">{formatCurrency(42560)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Begravningsbyråer</span>
                    <span className="text-sm font-medium">{formatCurrency(38086)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bankrådgivare</span>
                    <span className="text-sm font-medium">{formatCurrency(8943)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Flyttstädning</span>
                    <span className="text-sm font-medium">{formatCurrency(15720)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skatteöversikt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(metrics.totalTaxWithheld)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Total skatt innehållen
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    30% skattesats
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Calculation Modal */}
      <Dialog open={isCalculationModalOpen} onOpenChange={setIsCalculationModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kickback beräkning</DialogTitle>
            <DialogDescription>
              Detaljerad beräkning för partner kickback
            </DialogDescription>
          </DialogHeader>
          {currentCalculation && (
            <CalculationDetailsView calculation={currentCalculation} />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Betalningsdetaljer</DialogTitle>
            <DialogDescription>
              Fullständig information om betalning
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <PaymentDetailsView payment={selectedPayment} />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Modal */}
      <Dialog open={isBulkActionModalOpen} onOpenChange={setIsBulkActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk åtgärder</DialogTitle>
            <DialogDescription>
              Välj åtgärd för {selectedPayments.length} valda betalningar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Button
              className="w-full"
              onClick={handleBulkApprove}
              disabled={isLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Godkänn alla
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleBulkProcess}
              disabled={isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Behandla alla
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setIsBulkActionModalOpen(false)}
            >
              Avbryt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Calculation Details View Component
function CalculationDetailsView({ calculation }: { calculation: KickbackCalculation }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Period</Label>
          <p className="text-sm text-gray-600">{calculation.calculationPeriod}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Referrals inkluderade</Label>
          <p className="text-sm text-gray-600">{calculation.referralsIncluded.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="font-medium">Beräkning</div>
        
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm">Bas kickback ({(calculation.baseRate * 100).toFixed(0)}%)</span>
            <span className="text-sm font-medium">{formatCurrency(calculation.baseAmount)}</span>
          </div>
          
          {calculation.bonuses.volume.amount > 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-green-600">Volym bonus</span>
              <span className="text-sm font-medium text-green-600">
                +{formatCurrency(calculation.bonuses.volume.amount)}
              </span>
            </div>
          )}
          
          {calculation.bonuses.quality.amount > 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-blue-600">Kvalitets bonus</span>
              <span className="text-sm font-medium text-blue-600">
                +{formatCurrency(calculation.bonuses.quality.amount)}
              </span>
            </div>
          )}
          
          {calculation.bonuses.tier.amount > 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-purple-600">
                {calculation.bonuses.tier.currentTier} tier bonus
              </span>
              <span className="text-sm font-medium text-purple-600">
                +{formatCurrency(calculation.bonuses.tier.amount)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between py-2 border-b font-medium">
            <span>Brutto belopp</span>
            <span>{formatCurrency(calculation.baseAmount + calculation.bonuses.total)}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-red-600">Skatt (30%)</span>
            <span className="text-sm font-medium text-red-600">
              -{formatCurrency(calculation.deductions.taxWithholding)}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-red-600">Admin avgift (2%)</span>
            <span className="text-sm font-medium text-red-600">
              -{formatCurrency(calculation.deductions.adminFee)}
            </span>
          </div>
          
          <div className="flex justify-between py-3 text-lg font-bold">
            <span>Netto belopp</span>
            <span>{formatCurrency(calculation.finalAmount)}</span>
          </div>
        </div>
      </div>

      {calculation.nextTierRequirements && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Nästa tier: {calculation.nextTierRequirements.nextTier}</AlertTitle>
          <AlertDescription>
            Potential bonus ökning: +{calculation.nextTierRequirements.potentialBonusIncrease}%
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Payment Details View Component
function PaymentDetailsView({ payment }: { payment: KickbackPayment }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Partner information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs">Partner</Label>
              <p className="text-sm font-medium">{payment.partnerName}</p>
            </div>
            <div>
              <Label className="text-xs">Kategori</Label>
              <p className="text-sm">{payment.partnerCategory}</p>
            </div>
            <div>
              <Label className="text-xs">Tier</Label>
              <Badge className={
                payment.partnerTier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                payment.partnerTier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                payment.partnerTier === 'silver' ? 'bg-gray-100 text-gray-800' :
                'bg-orange-100 text-orange-800'
              }>
                {payment.partnerTier}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Betalningsinformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs">Period</Label>
              <p className="text-sm font-medium">{payment.paymentPeriod}</p>
            </div>
            <div>
              <Label className="text-xs">Referens</Label>
              <p className="text-sm font-mono">{payment.paymentReference}</p>
            </div>
            <div>
              <Label className="text-xs">Metod</Label>
              <p className="text-sm">{payment.paymentMethod}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Beräkningsdetaljer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-1">
              <span className="text-sm">Bas kickback</span>
              <span className="text-sm font-medium">{formatCurrency(payment.baseKickbackAmount)}</span>
            </div>
            {payment.volumeBonus > 0 && (
              <div className="flex justify-between py-1 text-green-600">
                <span className="text-sm">Volym bonus</span>
                <span className="text-sm font-medium">+{formatCurrency(payment.volumeBonus)}</span>
              </div>
            )}
            {payment.qualityBonus > 0 && (
              <div className="flex justify-between py-1 text-blue-600">
                <span className="text-sm">Kvalitets bonus</span>
                <span className="text-sm font-medium">+{formatCurrency(payment.qualityBonus)}</span>
              </div>
            )}
            {payment.tierBonus > 0 && (
              <div className="flex justify-between py-1 text-purple-600">
                <span className="text-sm">Tier bonus</span>
                <span className="text-sm font-medium">+{formatCurrency(payment.tierBonus)}</span>
              </div>
            )}
            {payment.specialPromotionBonus > 0 && (
              <div className="flex justify-between py-1 text-orange-600">
                <span className="text-sm">Kampanj bonus</span>
                <span className="text-sm font-medium">+{formatCurrency(payment.specialPromotionBonus)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t">
              <span className="text-sm font-medium">Brutto</span>
              <span className="text-sm font-medium">{formatCurrency(payment.totalGrossAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-red-600">
              <span className="text-sm">Skatt</span>
              <span className="text-sm font-medium">-{formatCurrency(payment.taxDeduction)}</span>
            </div>
            <div className="flex justify-between py-1 text-red-600">
              <span className="text-sm">Admin avgift</span>
              <span className="text-sm font-medium">-{formatCurrency(payment.adminFee)}</span>
            </div>
            <div className="flex justify-between py-2 border-t text-lg font-bold">
              <span>Netto</span>
              <span>{formatCurrency(payment.netPaymentAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {payment.bankAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bankuppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs">Bank</Label>
              <p className="text-sm">{payment.bankAccount.bankName}</p>
            </div>
            <div>
              <Label className="text-xs">Kontonummer</Label>
              <p className="text-sm font-mono">{payment.bankAccount.accountNumber}</p>
            </div>
            <div>
              <Label className="text-xs">Kontoinnehavare</Label>
              <p className="text-sm">{payment.bankAccount.accountHolder}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {payment.paymentStatus === 'paid' && payment.paymentConfirmation && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Betalning genomförd</AlertTitle>
          <AlertDescription>
            Bekräftelse: {payment.paymentConfirmation} • {formatDate(payment.paymentDate!)}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
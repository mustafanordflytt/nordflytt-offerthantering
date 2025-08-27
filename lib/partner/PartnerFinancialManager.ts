// =============================================================================
// NORDFLYTT PARTNER FINANCIAL MANAGER
// Finansiell hantering och avräkning för partners
// =============================================================================

import { supabase } from '../supabase';
import { Partner } from './PartnerOnboardingSystem';
import { PartnerJob } from './PartnerJobManager';

export interface PartnerPayment {
  id: number;
  partner_id: number;
  payment_period_start: string;
  payment_period_end: string;
  total_jobs: number;
  total_hours: number;
  base_payment: number;
  commission_payment: number;
  bonus_payment: number;
  deductions: number;
  net_payment: number;
  tax_amount: number;
  social_fees: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  payment_method: string;
  payment_reference?: string;
  paid_at?: string;
  invoice_number?: string;
  invoice_pdf_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface PaymentPeriod {
  start_date: string;
  end_date: string;
  jobs: PartnerJob[];
  total_hours: number;
  total_revenue: number;
  deductions: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

export interface FinancialSummary {
  partner_id: number;
  current_period: PaymentPeriod;
  total_earnings_ytd: number;
  total_jobs_ytd: number;
  average_hourly_rate: number;
  tax_summary: {
    total_tax_withheld: number;
    total_social_fees: number;
    estimated_quarterly_tax: number;
  };
  payment_history: PartnerPayment[];
  pending_payments: PartnerPayment[];
}

export interface InvoiceData {
  partner: Partner;
  payment: PartnerPayment;
  jobs: PartnerJob[];
  tax_info: {
    company_name: string;
    organization_number: string;
    address: string;
    vat_number: string;
  };
}

export class PartnerFinancialManager {
  private static instance: PartnerFinancialManager;
  
  public static getInstance(): PartnerFinancialManager {
    if (!PartnerFinancialManager.instance) {
      PartnerFinancialManager.instance = new PartnerFinancialManager();
    }
    return PartnerFinancialManager.instance;
  }

  // =============================================================================
  // BETALNINGSPERIODER OCH AVRÄKNING
  // =============================================================================

  async generatePaymentPeriod(
    partnerId: number,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; payment?: PartnerPayment; error?: string }> {
    try {
      console.log('💰 Genererar betalningsperiod för partner:', partnerId);

      // Hämta jobb för perioden
      const jobs = await this.getJobsForPeriod(partnerId, startDate, endDate);
      
      if (jobs.length === 0) {
        return {
          success: false,
          error: 'Inga jobb hittades för perioden'
        };
      }

      // Beräkna betalningsdetaljer
      const paymentCalculation = this.calculatePaymentDetails(jobs);
      
      // Skapa betalningspost
      const payment = await this.createPaymentRecord(
        partnerId,
        startDate,
        endDate,
        paymentCalculation
      );

      // Generera faktura
      await this.generateInvoice(payment);

      console.log('✅ Betalningsperiod genererad:', payment.id);
      
      return {
        success: true,
        payment
      };
      
    } catch (error) {
      console.error('❌ Fel vid generering av betalningsperiod:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private async getJobsForPeriod(
    partnerId: number,
    startDate: string,
    endDate: string
  ): Promise<PartnerJob[]> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_jobs')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('status', 'completed')
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .order('completed_at');

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return [
      {
        id: 1,
        partner_id: partnerId,
        booking_id: 123,
        job_type: 'primary',
        base_rate: 500,
        commission_rate: 15,
        bonus_eligibility: true,
        status: 'completed',
        assigned_at: '2025-01-01T10:00:00Z',
        accepted_at: '2025-01-01T10:30:00Z',
        started_at: '2025-01-01T11:00:00Z',
        completed_at: '2025-01-01T19:00:00Z',
        quality_score: 4.5,
        customer_rating: 4.8,
        time_efficiency: 1.1,
        estimated_hours: 8,
        actual_hours: 7.5,
        partner_payment: 3500,
        nordflytt_revenue: 2500,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T19:00:00Z'
      },
      {
        id: 2,
        partner_id: partnerId,
        booking_id: 124,
        job_type: 'support',
        base_rate: 400,
        commission_rate: 12,
        bonus_eligibility: false,
        status: 'completed',
        assigned_at: '2025-01-03T09:00:00Z',
        accepted_at: '2025-01-03T09:15:00Z',
        started_at: '2025-01-03T10:00:00Z',
        completed_at: '2025-01-03T16:00:00Z',
        quality_score: 4.2,
        customer_rating: 4.5,
        time_efficiency: 0.95,
        estimated_hours: 6,
        actual_hours: 6.3,
        partner_payment: 2800,
        nordflytt_revenue: 1900,
        created_at: '2025-01-03T09:00:00Z',
        updated_at: '2025-01-03T16:00:00Z'
      }
    ];
  }

  private calculatePaymentDetails(jobs: PartnerJob[]): {
    total_jobs: number;
    total_hours: number;
    base_payment: number;
    commission_payment: number;
    bonus_payment: number;
    gross_payment: number;
    tax_amount: number;
    social_fees: number;
    deductions: number;
    net_payment: number;
  } {
    const total_jobs = jobs.length;
    const total_hours = jobs.reduce((sum, job) => sum + (job.actual_hours || 0), 0);
    
    // Beräkna base payment
    const base_payment = jobs.reduce((sum, job) => {
      const hourlyRate = job.base_rate;
      const hours = job.actual_hours || 0;
      return sum + (hourlyRate * hours);
    }, 0);

    // Beräkna commission payment
    const commission_payment = jobs.reduce((sum, job) => {
      const hourlyRate = job.base_rate;
      const hours = job.actual_hours || 0;
      const commission = (hourlyRate * hours) * (job.commission_rate / 100);
      return sum + commission;
    }, 0);

    // Beräkna bonus payment
    const bonus_payment = jobs.reduce((sum, job) => {
      if (job.bonus_eligibility && (job.quality_score || 0) >= 4.5) {
        const hourlyRate = job.base_rate;
        const hours = job.actual_hours || 0;
        const bonus = (hourlyRate * hours) * 0.1; // 10% bonus
        return sum + bonus;
      }
      return sum;
    }, 0);

    const gross_payment = base_payment + commission_payment + bonus_payment;

    // Beräkna skatter (förenklade regler)
    const tax_rate = 0.30; // 30% preliminärskatt
    const tax_amount = gross_payment * tax_rate;
    
    const social_fee_rate = 0.0462; // 4.62% för egenavgifter
    const social_fees = gross_payment * social_fee_rate;

    // Övriga avdrag
    const deductions = 0; // Kan inkludera material, resor, etc.

    const net_payment = gross_payment - tax_amount - social_fees - deductions;

    return {
      total_jobs,
      total_hours,
      base_payment,
      commission_payment,
      bonus_payment,
      gross_payment,
      tax_amount,
      social_fees,
      deductions,
      net_payment
    };
  }

  private async createPaymentRecord(
    partnerId: number,
    startDate: string,
    endDate: string,
    calculation: any
  ): Promise<PartnerPayment> {
    const paymentData = {
      partner_id: partnerId,
      payment_period_start: startDate,
      payment_period_end: endDate,
      total_jobs: calculation.total_jobs,
      total_hours: calculation.total_hours,
      base_payment: calculation.base_payment,
      commission_payment: calculation.commission_payment,
      bonus_payment: calculation.bonus_payment,
      deductions: calculation.deductions,
      net_payment: calculation.net_payment,
      tax_amount: calculation.tax_amount,
      social_fees: calculation.social_fees,
      status: 'pending',
      payment_method: 'bank_transfer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return {
      id: Date.now(),
      ...paymentData
    } as PartnerPayment;
  }

  // =============================================================================
  // FAKTURERING OCH DOKUMENTATION
  // =============================================================================

  async generateInvoice(payment: PartnerPayment): Promise<{
    success: boolean;
    invoice_url?: string;
    error?: string;
  }> {
    try {
      console.log('📄 Genererar faktura för betalning:', payment.id);

      // Hämta partner-information
      const partner = await this.getPartner(payment.partner_id);
      if (!partner) {
        return { success: false, error: 'Partner inte hittad' };
      }

      // Hämta jobb för perioden
      const jobs = await this.getJobsForPeriod(
        payment.partner_id,
        payment.payment_period_start,
        payment.payment_period_end
      );

      // Skapa faktura-data
      const invoiceData: InvoiceData = {
        partner,
        payment,
        jobs,
        tax_info: {
          company_name: 'Nordflytt AB',
          organization_number: '556789-0123',
          address: 'Storgatan 1, 111 22 Stockholm',
          vat_number: 'SE556789012301'
        }
      };

      // Generera fakturanummer
      const invoice_number = this.generateInvoiceNumber(payment);
      
      // Skapa PDF (mock)
      const invoice_url = await this.createInvoicePDF(invoiceData, invoice_number);

      // Uppdatera betalningspost
      await this.updatePaymentRecord(payment.id, {
        invoice_number,
        invoice_pdf_url: invoice_url
      });

      console.log('✅ Faktura genererad:', invoice_number);
      
      return {
        success: true,
        invoice_url
      };
      
    } catch (error) {
      console.error('❌ Fel vid generering av faktura:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private generateInvoiceNumber(payment: PartnerPayment): string {
    const date = new Date(payment.payment_period_end);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const partnerId = String(payment.partner_id).padStart(3, '0');
    const paymentId = String(payment.id).padStart(4, '0');
    
    return `NF${year}${month}${partnerId}${paymentId}`;
  }

  private async createInvoicePDF(
    invoiceData: InvoiceData,
    invoiceNumber: string
  ): Promise<string> {
    // I produktion: Använd PDF-generator (puppeteer, jsPDF, etc.)
    const mockUrl = `https://invoices.nordflytt.se/${invoiceNumber}.pdf`;
    
    console.log('📄 Skapar PDF-faktura:', invoiceNumber);
    
    // Mock PDF-generation
    return mockUrl;
  }

  // =============================================================================
  // BETALNINGSHANTERING
  // =============================================================================

  async approvePayment(
    paymentId: number,
    approvedBy: number,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        status: 'approved',
        notes: notes || undefined,
        updated_at: new Date().toISOString()
      };

      await this.updatePaymentRecord(paymentId, updateData);

      // Skicka till betalningssystem
      await this.processPayment(paymentId);

      return { success: true };
      
    } catch (error) {
      console.error('❌ Fel vid godkännande av betalning:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  async markPaymentAsPaid(
    paymentId: number,
    paymentReference: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        status: 'paid',
        payment_reference: paymentReference,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.updatePaymentRecord(paymentId, updateData);

      // Skicka bekräftelse till partner
      await this.notifyPartnerOfPayment(paymentId);

      return { success: true };
      
    } catch (error) {
      console.error('❌ Fel vid markering som betald:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private async processPayment(paymentId: number): Promise<void> {
    console.log('💳 Processerar betalning:', paymentId);
    // I produktion: Integrera med betalningssystem (Swish, bankgiro, etc.)
  }

  private async notifyPartnerOfPayment(paymentId: number): Promise<void> {
    console.log('📧 Notifierar partner om betalning:', paymentId);
    // I produktion: Skicka e-post och push-notifiering
  }

  // =============================================================================
  // FINANSIELL RAPPORTERING
  // =============================================================================

  async getFinancialSummary(partnerId: number): Promise<FinancialSummary> {
    try {
      const partner = await this.getPartner(partnerId);
      if (!partner) {
        throw new Error('Partner inte hittad');
      }

      // Hämta aktuell period
      const currentPeriod = await this.getCurrentPaymentPeriod(partnerId);
      
      // Hämta YTD-statistik
      const ytdStats = await this.getYTDStatistics(partnerId);
      
      // Hämta betalningshistorik
      const paymentHistory = await this.getPaymentHistory(partnerId);
      
      // Hämta väntande betalningar
      const pendingPayments = await this.getPendingPayments(partnerId);

      return {
        partner_id: partnerId,
        current_period: currentPeriod,
        total_earnings_ytd: ytdStats.total_earnings,
        total_jobs_ytd: ytdStats.total_jobs,
        average_hourly_rate: ytdStats.average_hourly_rate,
        tax_summary: {
          total_tax_withheld: ytdStats.total_tax_withheld,
          total_social_fees: ytdStats.total_social_fees,
          estimated_quarterly_tax: ytdStats.estimated_quarterly_tax
        },
        payment_history: paymentHistory,
        pending_payments: pendingPayments
      };
      
    } catch (error) {
      console.error('❌ Fel vid hämtning av finansiell sammanfattning:', error);
      throw error;
    }
  }

  private async getCurrentPaymentPeriod(partnerId: number): Promise<PaymentPeriod> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const jobs = await this.getJobsForPeriod(
      partnerId,
      startOfMonth.toISOString(),
      endOfMonth.toISOString()
    );

    const total_hours = jobs.reduce((sum, job) => sum + (job.actual_hours || 0), 0);
    const total_revenue = jobs.reduce((sum, job) => sum + (job.partner_payment || 0), 0);

    return {
      start_date: startOfMonth.toISOString(),
      end_date: endOfMonth.toISOString(),
      jobs,
      total_hours,
      total_revenue,
      deductions: [] // Kan läggas till senare
    };
  }

  private async getYTDStatistics(partnerId: number): Promise<{
    total_earnings: number;
    total_jobs: number;
    average_hourly_rate: number;
    total_tax_withheld: number;
    total_social_fees: number;
    estimated_quarterly_tax: number;
  }> {
    // I produktion: Kör SQL-aggregation
    // Mock för utveckling
    return {
      total_earnings: 125000,
      total_jobs: 45,
      average_hourly_rate: 520,
      total_tax_withheld: 37500,
      total_social_fees: 5775,
      estimated_quarterly_tax: 31250
    };
  }

  private async getPaymentHistory(partnerId: number): Promise<PartnerPayment[]> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_payments')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return [
      {
        id: 1,
        partner_id: partnerId,
        payment_period_start: '2024-12-01',
        payment_period_end: '2024-12-31',
        total_jobs: 8,
        total_hours: 62.5,
        base_payment: 25000,
        commission_payment: 3750,
        bonus_payment: 2500,
        deductions: 0,
        net_payment: 21875,
        tax_amount: 7875,
        social_fees: 1200,
        status: 'paid',
        payment_method: 'bank_transfer',
        payment_reference: 'REF123456',
        paid_at: '2025-01-05T10:00:00Z',
        invoice_number: 'NF20241200123456',
        invoice_pdf_url: 'https://invoices.nordflytt.se/NF20241200123456.pdf',
        created_at: '2024-12-31T20:00:00Z',
        updated_at: '2025-01-05T10:00:00Z'
      }
    ];
  }

  private async getPendingPayments(partnerId: number): Promise<PartnerPayment[]> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_payments')
        .select('*')
        .eq('partner_id', partnerId)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return [
      {
        id: 2,
        partner_id: partnerId,
        payment_period_start: '2025-01-01',
        payment_period_end: '2025-01-31',
        total_jobs: 3,
        total_hours: 24,
        base_payment: 12000,
        commission_payment: 1800,
        bonus_payment: 1200,
        deductions: 0,
        net_payment: 10500,
        tax_amount: 3780,
        social_fees: 720,
        status: 'pending',
        payment_method: 'bank_transfer',
        created_at: '2025-01-31T20:00:00Z',
        updated_at: '2025-01-31T20:00:00Z'
      }
    ];
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async getPartner(partnerId: number): Promise<Partner | null> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error) return null;
      return data;
    }

    // Mock för utveckling
    return {
      id: partnerId,
      name: 'Johan Andersson',
      company_name: 'Andersons Flytthjälp AB',
      organization_number: '556789-1234',
      partner_type: 'company',
      phone: '+46701234567',
      email: 'johan@anderssonsflyttjalp.se',
      address: 'Storgatan 123',
      city: 'Stockholm',
      postal_code: '11122',
      specializations: ['moving', 'packing'],
      service_areas: ['stockholm'],
      capacity_level: 'medium',
      status: 'active',
      onboarding_step: 'completed',
      onboarding_progress: 100,
      quality_rating: 4.5,
      completed_jobs: 25,
      total_revenue: 125000,
      certifications: ['ISO9001'],
      insurance_valid_until: '2025-12-31',
      created_at: '2024-12-01T10:00:00Z',
      updated_at: '2025-01-05T10:00:00Z'
    };
  }

  private async updatePaymentRecord(
    paymentId: number,
    updates: Partial<PartnerPayment>
  ): Promise<void> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { error } = await supabase
        .from('partner_payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;
    }
  }

  // =============================================================================
  // RAPPORTER FÖR ADMIN
  // =============================================================================

  async getFinancialReport(
    startDate: string,
    endDate: string
  ): Promise<{
    total_partner_payments: number;
    total_nordflytt_revenue: number;
    total_jobs_completed: number;
    average_partner_payment: number;
    top_earning_partners: Array<{
      partner_id: number;
      partner_name: string;
      total_earnings: number;
      jobs_completed: number;
    }>;
    payment_status_breakdown: {
      pending: number;
      approved: number;
      paid: number;
      disputed: number;
    };
  }> {
    // I produktion: Kör SQL-aggregation
    // Mock för utveckling
    return {
      total_partner_payments: 785000,
      total_nordflytt_revenue: 1250000,
      total_jobs_completed: 125,
      average_partner_payment: 6280,
      top_earning_partners: [
        {
          partner_id: 1,
          partner_name: 'Johan Andersson',
          total_earnings: 125000,
          jobs_completed: 25
        },
        {
          partner_id: 3,
          partner_name: 'Erik Pettersson',
          total_earnings: 280000,
          jobs_completed: 45
        }
      ],
      payment_status_breakdown: {
        pending: 8,
        approved: 3,
        paid: 85,
        disputed: 1
      }
    };
  }
}
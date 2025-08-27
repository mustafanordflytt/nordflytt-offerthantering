import { supabase } from '@/lib/supabase';

interface StorageRequirements {
  estimated_volume: number;
  storage_type: 'short_term' | 'long_term' | 'seasonal' | 'document_storage';
  climate_controlled?: boolean;
  high_security?: boolean;
  customer_access?: boolean;
  special_needs?: any;
  insurance_value?: number;
}

interface StorageAllocation {
  facility_id: number;
  available_space: number;
  section: string;
}

interface StoragePricing {
  base_rate: number;
  volume: number;
  monthly_base: number;
  service_fees: number;
  monthly_insurance: number;
  monthly_rate: number;
  setup_fee: number;
  minimum_period: number;
  total_first_month: number;
}

interface StorageReport {
  storage_summary: any;
  inventory_summary: any;
  financial_summary: any;
  access_summary: any;
}

export class CustomerStorageManager {
  constructor() {}

  async createCustomerStorage(customerId: number, storageRequest: any) {
    // Analyze storage requirements
    const requirements = await this.analyzeStorageRequirements(storageRequest);
    
    // Find optimal facility and space
    const allocation = await this.allocateStorageSpace(requirements);
    
    // Calculate pricing
    const pricing = await this.calculateStorageRates(requirements, allocation);
    
    // Create storage record
    const storage = {
      customer_id: customerId,
      storage_unit_id: await this.generateStorageUnitId(),
      facility_id: allocation.facility_id,
      storage_start_date: storageRequest.start_date,
      planned_end_date: storageRequest.planned_end_date,
      monthly_rate: pricing.monthly_rate,
      total_volume: requirements.estimated_volume,
      storage_type: this.classifyStorageType(requirements),
      access_level: storageRequest.access_level || 'nordflytt_only',
      insurance_value: storageRequest.insurance_value,
      special_requirements: requirements.special_needs,
      access_code: this.generateAccessCode(),
      status: 'active',
      payment_status: 'current'
    };

    const { data: createdStorage, error } = await supabase
      .from('customer_storage')
      .insert(storage)
      .select()
      .single();

    if (error) throw error;
    
    // Setup billing schedule
    await this.setupAutomaticBilling(createdStorage.id, pricing);
    
    // Create initial inventory if provided
    if (storageRequest.initial_inventory) {
      await this.createInitialInventory(createdStorage.id, storageRequest.initial_inventory);
    }
    
    // Generate storage agreement
    const agreement = await this.generateStorageAgreement(createdStorage);
    
    return {
      storage: createdStorage,
      pricing: pricing,
      agreement: agreement,
      access_instructions: await this.generateAccessInstructions(createdStorage)
    };
  }

  private async analyzeStorageRequirements(request: any): Promise<StorageRequirements> {
    return {
      estimated_volume: request.volume || this.calculateVolumeFromItems(request.items),
      storage_type: request.storage_type || 'short_term',
      climate_controlled: request.climate_controlled || false,
      high_security: request.high_security || false,
      customer_access: request.customer_access || false,
      special_needs: request.special_requirements,
      insurance_value: request.insurance_value || 0
    };
  }

  private calculateVolumeFromItems(items: any[]): number {
    if (!items || items.length === 0) return 5; // Default 5m³
    
    let totalVolume = 0;
    items.forEach(item => {
      if (item.dimensions) {
        const volume = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 1000000; // cm³ to m³
        totalVolume += volume * (item.quantity || 1);
      } else {
        // Estimate based on item type
        totalVolume += this.estimateItemVolume(item.category) * (item.quantity || 1);
      }
    });
    
    return Math.max(1, Math.ceil(totalVolume));
  }

  private estimateItemVolume(category: string): number {
    const volumeEstimates: Record<string, number> = {
      'furniture': 2,
      'appliances': 1.5,
      'boxes': 0.2,
      'documents': 0.1,
      'artwork': 0.5,
      'general': 0.5
    };
    
    return volumeEstimates[category] || 0.5;
  }

  private async allocateStorageSpace(requirements: StorageRequirements): Promise<StorageAllocation> {
    // Find facility with available space
    const { data: facilities } = await supabase
      .from('storage_facilities')
      .select('*')
      .gte('available_capacity', requirements.estimated_volume)
      .eq('status', 'active')
      .order('available_capacity', { ascending: true });

    let selectedFacility = facilities?.[0];
    
    // Prefer climate controlled if required
    if (requirements.climate_controlled) {
      selectedFacility = facilities?.find(f => f.climate_controlled) || selectedFacility;
    }
    
    // Prefer high security if required
    if (requirements.high_security) {
      selectedFacility = facilities?.find(f => f.security_level === 'maximum' || f.security_level === 'high') || selectedFacility;
    }

    if (!selectedFacility) {
      throw new Error('No suitable storage facility available');
    }

    // Update available capacity
    await supabase
      .from('storage_facilities')
      .update({ 
        available_capacity: selectedFacility.available_capacity - requirements.estimated_volume 
      })
      .eq('id', selectedFacility.id);

    return {
      facility_id: selectedFacility.id,
      available_space: selectedFacility.available_capacity,
      section: await this.assignStorageSection(selectedFacility.id, requirements.estimated_volume)
    };
  }

  private async assignStorageSection(facilityId: number, volume: number): Promise<string> {
    // Simple section assignment logic
    const sections = ['A', 'B', 'C', 'D', 'E'];
    const randomSection = sections[Math.floor(Math.random() * sections.length)];
    const randomShelf = Math.floor(Math.random() * 20) + 1;
    return `${randomSection}-${randomShelf}`;
  }

  async calculateStorageRates(requirements: StorageRequirements, allocation: StorageAllocation): Promise<StoragePricing> {
    const baseRates = {
      short_term: {
        rate_per_cubic_meter: 150, // SEK per m³ per month
        minimum_period: 1, // months
        setup_fee: 500
      },
      long_term: {
        rate_per_cubic_meter: 120, // SEK per m³ per month (discount for longer storage)
        minimum_period: 6, // months
        setup_fee: 300
      },
      seasonal: {
        rate_per_cubic_meter: 100, // SEK per m³ per month (seasonal discount)
        minimum_period: 3, // months
        setup_fee: 200
      },
      document_storage: {
        rate_per_cubic_meter: 80, // SEK per m³ per month (documents are compact)
        minimum_period: 12, // months
        setup_fee: 150
      }
    };

    const additionalServices = {
      climate_controlled: 50, // Additional SEK per m³ per month
      high_security: 30, // Additional SEK per m³ per month
      customer_access: 25, // Additional SEK per m³ per month
      insurance_premium: 0.02 // 2% of insured value per year
    };

    let baseRate = baseRates[requirements.storage_type] || baseRates.short_term;
    let monthlyRate = baseRate.rate_per_cubic_meter * requirements.estimated_volume;
    let setupFee = baseRate.setup_fee;

    // Add service fees
    if (requirements.climate_controlled) {
      monthlyRate += additionalServices.climate_controlled * requirements.estimated_volume;
    }
    
    if (requirements.high_security) {
      monthlyRate += additionalServices.high_security * requirements.estimated_volume;
    }
    
    if (requirements.customer_access) {
      monthlyRate += additionalServices.customer_access * requirements.estimated_volume;
    }

    // Volume discounts
    if (requirements.estimated_volume > 20) {
      monthlyRate *= 0.9; // 10% discount for >20m³
    }
    if (requirements.estimated_volume > 50) {
      monthlyRate *= 0.85; // 15% total discount for >50m³
    }

    // Insurance calculation
    const monthlyInsurance = requirements.insurance_value ? 
      (requirements.insurance_value * additionalServices.insurance_premium) / 12 : 0;

    return {
      base_rate: baseRate.rate_per_cubic_meter,
      volume: requirements.estimated_volume,
      monthly_base: Math.round(baseRate.rate_per_cubic_meter * requirements.estimated_volume),
      service_fees: Math.round(monthlyRate - (baseRate.rate_per_cubic_meter * requirements.estimated_volume)),
      monthly_insurance: Math.round(monthlyInsurance),
      monthly_rate: Math.round(monthlyRate + monthlyInsurance),
      setup_fee: setupFee,
      minimum_period: baseRate.minimum_period,
      total_first_month: Math.round(monthlyRate + monthlyInsurance + setupFee)
    };
  }

  private classifyStorageType(requirements: StorageRequirements): string {
    return requirements.storage_type;
  }

  private async generateStorageUnitId(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `STG-${timestamp}-${random}`;
  }

  private generateAccessCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async setupAutomaticBilling(storageId: number, pricing: StoragePricing) {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const billingRecord = {
      storage_id: storageId,
      billing_period: 'monthly',
      period_start: today.toISOString().split('T')[0],
      period_end: new Date(nextMonth.getTime() - 86400000).toISOString().split('T')[0], // Last day of month
      base_storage_fee: pricing.monthly_base,
      volume_charges: pricing.service_fees,
      additional_services: 0,
      access_fees: 0,
      late_fees: 0,
      discount_amount: 0,
      tax_amount: Math.round(pricing.monthly_rate * 0.25), // 25% VAT
      total_amount: Math.round(pricing.monthly_rate * 1.25), // Including VAT
      invoice_number: await this.generateInvoiceNumber(),
      invoice_date: today.toISOString().split('T')[0],
      due_date: new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0], // 30 days
      payment_status: 'pending',
      auto_generated: true
    };

    await supabase
      .from('storage_billing')
      .insert(billingRecord);
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('storage_billing')
      .select('*', { count: 'exact', head: true })
      .ilike('invoice_number', `INV-${year}%`);
    
    const invoiceNumber = (count || 0) + 1;
    return `INV-${year}-${invoiceNumber.toString().padStart(5, '0')}`;
  }

  async createInitialInventory(storageId: number, inventoryList: any[]) {
    const processedItems = [];
    
    for (const item of inventoryList) {
      const inventoryItem = {
        storage_id: storageId,
        item_category: item.category || 'general',
        item_description: item.description,
        estimated_value: item.value || 0,
        condition_on_entry: item.condition || 'good',
        condition_notes: item.notes || '',
        fragile: item.fragile || false,
        hazardous: item.hazardous || false,
        dimensions: item.dimensions || {},
        weight: item.weight || 0,
        photo_urls: item.photos || [],
        barcode: await this.generateItemBarcode(),
        location_in_storage: await this.assignStorageLocation(storageId, item),
        insurance_covered: item.insurance_covered !== false,
        special_handling: item.special_handling || {}
      };
      
      const { data: createdItem } = await supabase
        .from('customer_inventory_items')
        .insert(inventoryItem)
        .select()
        .single();
        
      processedItems.push(createdItem);
    }
    
    return processedItems;
  }

  private async generateItemBarcode(): Promise<string> {
    return `ITM-${Date.now().toString(36).toUpperCase()}`;
  }

  private async assignStorageLocation(storageId: number, item: any): Promise<string> {
    // Get storage unit section
    const { data: storage } = await supabase
      .from('customer_storage')
      .select('facility_id')
      .eq('id', storageId)
      .single();
    
    // Assign based on item type
    const sections: Record<string, string> = {
      'furniture': 'FUR',
      'appliances': 'APP',
      'boxes': 'BOX',
      'documents': 'DOC',
      'artwork': 'ART',
      'general': 'GEN'
    };
    
    const section = sections[item.category] || 'GEN';
    const position = Math.floor(Math.random() * 100) + 1;
    
    return `${section}-${position}`;
  }

  private async generateStorageAgreement(storage: any) {
    return {
      agreement_number: `AGR-${storage.storage_unit_id}`,
      customer_id: storage.customer_id,
      storage_unit_id: storage.storage_unit_id,
      terms_and_conditions: 'Standard Nordflytt storage terms apply',
      signed_date: new Date(),
      valid_until: storage.planned_end_date
    };
  }

  private async generateAccessInstructions(storage: any) {
    const { data: facility } = await supabase
      .from('storage_facilities')
      .select('*')
      .eq('id', storage.facility_id)
      .single();
    
    return {
      facility_name: facility?.facility_name,
      address: facility?.address,
      access_hours: facility?.access_hours,
      access_code: storage.access_code,
      contact_info: facility?.contact_info,
      instructions: 'Present ID and access code at reception. Staff will assist with access to your storage unit.'
    };
  }

  async processStoragePayments() {
    const { data: dueBillings } = await supabase
      .from('storage_billing')
      .select('*, customer_storage(*, kunder(*))')
      .eq('payment_status', 'pending')
      .lte('due_date', new Date().toISOString().split('T')[0]);
    
    for (const billing of dueBillings || []) {
      const paymentResult = await this.processPayment(billing);
      
      if (paymentResult.success) {
        await this.updatePaymentStatus(billing.id, 'paid', paymentResult);
        await this.sendPaymentConfirmation(billing);
      } else {
        await this.handlePaymentFailure(billing, paymentResult);
      }
    }
    
    // Handle overdue payments
    const overduePayments = await this.getOverduePayments();
    await this.processOverduePayments(overduePayments);
  }

  private async processPayment(billing: any) {
    // Simulate payment processing
    // In production, this would integrate with payment gateway
    return {
      success: Math.random() > 0.1, // 90% success rate for demo
      transaction_id: `TXN-${Date.now()}`,
      amount: billing.total_amount
    };
  }

  private async updatePaymentStatus(billingId: number, status: string, paymentResult: any) {
    await supabase
      .from('storage_billing')
      .update({
        payment_status: status,
        payment_date: new Date().toISOString().split('T')[0],
        payment_reference: paymentResult.transaction_id
      })
      .eq('id', billingId);
  }

  private async sendPaymentConfirmation(billing: any) {
    console.log('Sending payment confirmation for billing:', billing.id);
    // Send email/SMS confirmation
  }

  private async handlePaymentFailure(billing: any, paymentResult: any) {
    console.log('Payment failed for billing:', billing.id);
    // Handle failed payment
  }

  private async getOverduePayments() {
    const { data } = await supabase
      .from('storage_billing')
      .select('*, customer_storage(*, kunder(*))')
      .eq('payment_status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0]);
    
    return data || [];
  }

  async processOverduePayments(overduePayments: any[]) {
    for (const payment of overduePayments) {
      const daysOverdue = this.calculateDaysOverdue(payment.due_date);
      
      if (daysOverdue <= 7) {
        // Send friendly reminder
        await this.sendPaymentReminder(payment, 'friendly');
      } else if (daysOverdue <= 14) {
        // Send firm reminder
        await this.sendPaymentReminder(payment, 'firm');
      } else if (daysOverdue <= 30) {
        // Add late fees and send final notice
        await this.addLateFees(payment);
        await this.sendPaymentReminder(payment, 'final_notice');
      } else {
        // Initiate collection process
        await this.initiateCollectionProcess(payment);
      }
    }
  }

  private calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async sendPaymentReminder(payment: any, type: 'friendly' | 'firm' | 'final_notice') {
    console.log(`Sending ${type} reminder for payment:`, payment.id);
    
    await supabase
      .from('storage_billing')
      .update({
        reminder_count: (payment.reminder_count || 0) + 1,
        last_reminder_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', payment.id);
  }

  private async addLateFees(payment: any) {
    const lateFee = Math.round(payment.total_amount * 0.1); // 10% late fee
    
    await supabase
      .from('storage_billing')
      .update({
        late_fees: lateFee,
        total_amount: payment.total_amount + lateFee
      })
      .eq('id', payment.id);
  }

  private async initiateCollectionProcess(payment: any) {
    console.log('Initiating collection process for payment:', payment.id);
    
    // Update storage status
    await supabase
      .from('customer_storage')
      .update({
        payment_status: 'delinquent',
        status: 'overdue'
      })
      .eq('id', payment.storage_id);
  }

  async generateStorageReport(storageId: number): Promise<StorageReport> {
    const { data: storage } = await supabase
      .from('customer_storage')
      .select('*, kunder(*), storage_facilities(*)')
      .eq('id', storageId)
      .single();
      
    const { data: inventory } = await supabase
      .from('customer_inventory_items')
      .select('*')
      .eq('storage_id', storageId);
      
    const { data: billing } = await supabase
      .from('storage_billing')
      .select('*')
      .eq('storage_id', storageId)
      .order('invoice_date', { ascending: false });
      
    const { data: accessLog } = await supabase
      .from('storage_access_log')
      .select('*')
      .eq('storage_id', storageId)
      .order('access_date', { ascending: false })
      .limit(50);
    
    return {
      storage_summary: {
        unit_id: storage?.storage_unit_id,
        customer: storage?.kunder?.namn,
        start_date: storage?.storage_start_date,
        duration_months: this.calculateStorageDuration(storage),
        current_status: storage?.status,
        payment_status: storage?.payment_status
      },
      
      inventory_summary: {
        total_items: inventory?.length || 0,
        total_estimated_value: inventory?.reduce((sum, item) => sum + (item.estimated_value || 0), 0) || 0,
        categories: this.categorizeInventory(inventory || []),
        high_value_items: inventory?.filter(item => item.estimated_value > 10000) || [],
        fragile_items: inventory?.filter(item => item.fragile) || [],
        last_inspection: this.getLastInspectionDate(inventory || [])
      },
      
      financial_summary: {
        monthly_rate: storage?.monthly_rate || 0,
        total_paid: billing?.filter(b => b.payment_status === 'paid')
                          .reduce((sum, b) => sum + b.total_amount, 0) || 0,
        outstanding_balance: billing?.filter(b => b.payment_status !== 'paid')
                                   .reduce((sum, b) => sum + b.total_amount, 0) || 0,
        next_payment_due: this.getNextPaymentDue(billing || [])
      },
      
      access_summary: {
        total_visits: accessLog?.length || 0,
        last_access: accessLog?.[0]?.access_date,
        access_frequency: this.calculateAccessFrequency(accessLog || []),
        most_common_purpose: this.getMostCommonAccessPurpose(accessLog || [])
      }
    };
  }

  private calculateStorageDuration(storage: any): number {
    if (!storage?.storage_start_date) return 0;
    
    const start = new Date(storage.storage_start_date);
    const end = storage.actual_end_date ? new Date(storage.actual_end_date) : new Date();
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // months
  }

  private categorizeInventory(inventory: any[]) {
    const categories: Record<string, number> = {};
    
    inventory.forEach(item => {
      const category = item.item_category || 'general';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  }

  private getLastInspectionDate(inventory: any[]) {
    let lastDate = null;
    
    inventory.forEach(item => {
      if (item.last_inspection_date && (!lastDate || new Date(item.last_inspection_date) > new Date(lastDate))) {
        lastDate = item.last_inspection_date;
      }
    });
    
    return lastDate;
  }

  private getNextPaymentDue(billing: any[]) {
    const pending = billing.find(b => b.payment_status === 'pending');
    return pending?.due_date || null;
  }

  private calculateAccessFrequency(accessLog: any[]): string {
    if (accessLog.length === 0) return 'Aldrig';
    if (accessLog.length === 1) return 'Enstaka';
    
    const firstAccess = new Date(accessLog[accessLog.length - 1].access_date);
    const daysSince = (new Date().getTime() - firstAccess.getTime()) / (1000 * 60 * 60 * 24);
    const frequency = accessLog.length / (daysSince / 30); // visits per month
    
    if (frequency < 0.5) return 'Sällan';
    if (frequency < 2) return 'Månatlig';
    if (frequency < 4) return 'Varannan vecka';
    return 'Veckovis';
  }

  private getMostCommonAccessPurpose(accessLog: any[]): string {
    const purposes: Record<string, number> = {};
    
    accessLog.forEach(log => {
      const purpose = log.purpose || 'Annat';
      purposes[purpose] = (purposes[purpose] || 0) + 1;
    });
    
    let mostCommon = 'Ingen data';
    let maxCount = 0;
    
    Object.entries(purposes).forEach(([purpose, count]) => {
      if (count > maxCount) {
        mostCommon = purpose;
        maxCount = count;
      }
    });
    
    return mostCommon;
  }

  // Helper methods for getting storage data
  async getActiveStorageUnits() {
    const { data } = await supabase
      .from('customer_storage')
      .select('*, kunder(*), storage_facilities(*)')
      .eq('status', 'active')
      .order('storage_start_date', { ascending: false });
    
    return data || [];
  }

  async getStorageFacilities() {
    const { data } = await supabase
      .from('storage_facilities')
      .select('*')
      .eq('status', 'active')
      .order('facility_name');
    
    return data || [];
  }

  async getStorageRevenueSummary() {
    const { data: activeStorages } = await supabase
      .from('customer_storage')
      .select('monthly_rate')
      .eq('status', 'active');
    
    const monthlyRevenue = activeStorages?.reduce((sum, storage) => sum + storage.monthly_rate, 0) || 0;
    const annualProjection = monthlyRevenue * 12;
    const averagePerCustomer = activeStorages?.length ? monthlyRevenue / activeStorages.length : 0;
    
    return {
      monthly_revenue: monthlyRevenue,
      annual_projection: annualProjection,
      average_per_customer: averagePerCustomer,
      total_customers: activeStorages?.length || 0
    };
  }
}
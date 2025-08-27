import { supabase } from '@/lib/supabase';

interface AssetCategory {
  name: string;
  description: string;
  items: AssetItem[];
}

interface AssetItem {
  name: string;
  asset_code: string;
  cost_per_unit: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_quantity: number;
  supplier: string;
  lead_time: number;
  requires_maintenance?: boolean;
  maintenance_interval?: number;
  shelf_life_days?: number;
}

interface UsageRecord {
  job_id: number;
  usage_date: Date;
  total_cost: number;
  assets_used: any[];
}

interface ReorderRecommendation {
  asset_id: number;
  asset_name: string;
  current_quantity: number;
  minimum_level: number;
  recommended_order: number;
  estimated_cost: number;
  supplier: string;
  lead_time: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  auto_order_eligible: boolean;
  reorder_needed: boolean;
}

export class SmartAssetManager {
  constructor() {}

  async initializeAssetManagement() {
    const assetCategories = await this.setupAssetCategories();
    const reorderRules = await this.setupReorderAutomation();
    const monitoringSystem = await this.startInventoryMonitoring();
    
    return {
      categories: assetCategories,
      automation: reorderRules,
      monitoring: monitoringSystem,
      initial_inventory: await this.conductInitialInventory()
    };
  }

  async setupAssetCategories() {
    const categories: AssetCategory[] = [
      {
        name: "Flyttkartonger",
        description: "Alla typer av flyttkartonger och förpackningar",
        items: [
          {
            name: "Standard flyttkartonger (50x40x40cm)",
            asset_code: "BOX-STD-001",
            cost_per_unit: 25,
            minimum_stock: 100,
            maximum_stock: 500,
            reorder_quantity: 200,
            supplier: "Packaging Solutions AB",
            lead_time: 5
          },
          {
            name: "Stora flyttkartonger (60x50x50cm)",
            asset_code: "BOX-LRG-001", 
            cost_per_unit: 35,
            minimum_stock: 50,
            maximum_stock: 300,
            reorder_quantity: 100,
            supplier: "Packaging Solutions AB",
            lead_time: 5
          },
          {
            name: "Bokkartonger (40x30x30cm)",
            asset_code: "BOX-BOK-001",
            cost_per_unit: 20,
            minimum_stock: 75,
            maximum_stock: 400,
            reorder_quantity: 150,
            supplier: "Packaging Solutions AB", 
            lead_time: 5
          },
          {
            name: "Hängkartonger för kläder",
            asset_code: "BOX-HNG-001",
            cost_per_unit: 85,
            minimum_stock: 25,
            maximum_stock: 100,
            reorder_quantity: 50,
            supplier: "Specialized Packaging Nordic",
            lead_time: 7
          },
          {
            name: "Specialkartonger för TV/konst",
            asset_code: "BOX-SPC-001",
            cost_per_unit: 150,
            minimum_stock: 15,
            maximum_stock: 60,
            reorder_quantity: 25,
            supplier: "Art & Electronics Packaging",
            lead_time: 10
          }
        ]
      },
      
      {
        name: "Packematerial",
        description: "Skyddsmaterial och packningstillbehör",
        items: [
          {
            name: "Bubbelplast (rulle 100m)",
            asset_code: "PACK-BBL-001",
            cost_per_unit: 200,
            minimum_stock: 10,
            maximum_stock: 50,
            reorder_quantity: 20,
            supplier: "Protective Materials Sweden",
            lead_time: 3
          },
          {
            name: "Packtejp (rulle 66m)",
            asset_code: "PACK-TPE-001",
            cost_per_unit: 35,
            minimum_stock: 50,
            maximum_stock: 200,
            reorder_quantity: 100,
            supplier: "Tape & Adhesives Nordic",
            lead_time: 2
          },
          {
            name: "Fyllmaterial (säck 50L)",
            asset_code: "PACK-FYL-001",
            cost_per_unit: 120,
            minimum_stock: 20,
            maximum_stock: 100,
            reorder_quantity: 40,
            supplier: "Eco Fill Materials",
            lead_time: 5
          },
          {
            name: "Möbelskydd (plastfilm)",
            asset_code: "PACK-MOB-001",
            cost_per_unit: 180,
            minimum_stock: 15,
            maximum_stock: 75,
            reorder_quantity: 30,
            supplier: "Furniture Protection AB",
            lead_time: 7
          }
        ]
      },
      
      {
        name: "Flyttverktyg",
        description: "Verktyg och utrustning för flyttarbete",
        items: [
          {
            name: "Flyttremmar (set om 4)",
            asset_code: "TOOL-REM-001",
            cost_per_unit: 450,
            minimum_stock: 5,
            maximum_stock: 20,
            reorder_quantity: 10,
            supplier: "Professional Moving Equipment",
            lead_time: 10,
            requires_maintenance: true,
            maintenance_interval: 180
          },
          {
            name: "Möbelvagnar (kapacitet 300kg)",
            asset_code: "TOOL-VAG-001",
            cost_per_unit: 1200,
            minimum_stock: 3,
            maximum_stock: 12,
            reorder_quantity: 5,
            supplier: "Industrial Transport Solutions",
            lead_time: 14,
            requires_maintenance: true,
            maintenance_interval: 90
          },
          {
            name: "Handverktyg (komplett set)",
            asset_code: "TOOL-HND-001",
            cost_per_unit: 800,
            minimum_stock: 2,
            maximum_stock: 8,
            reorder_quantity: 3,
            supplier: "Professional Tools Sweden",
            lead_time: 7,
            requires_maintenance: true,
            maintenance_interval: 365
          }
        ]
      },
      
      {
        name: "Städmaterial",
        description: "Rengöringsmedel och städutrustning",
        items: [
          {
            name: "Universalrengöring (5L)",
            asset_code: "CLEN-UNI-001",
            cost_per_unit: 85,
            minimum_stock: 50,
            maximum_stock: 200,
            reorder_quantity: 100,
            supplier: "Eco Clean Supplies",
            lead_time: 3,
            shelf_life_days: 730
          },
          {
            name: "Golvrent (5L)",
            asset_code: "CLEN-GLV-001",
            cost_per_unit: 95,
            minimum_stock: 30,
            maximum_stock: 120,
            reorder_quantity: 60,
            supplier: "Eco Clean Supplies",
            lead_time: 3,
            shelf_life_days: 730
          },
          {
            name: "Fönsterrens (5L)",
            asset_code: "CLEN-FNS-001",
            cost_per_unit: 75,
            minimum_stock: 20,
            maximum_stock: 80,
            reorder_quantity: 40,
            supplier: "Eco Clean Supplies", 
            lead_time: 3,
            shelf_life_days: 730
          },
          {
            name: "Desinfektionsmedel (5L)",
            asset_code: "CLEN-DES-001",
            cost_per_unit: 120,
            minimum_stock: 25,
            maximum_stock: 100,
            reorder_quantity: 50,
            supplier: "Medical Grade Cleaning",
            lead_time: 5,
            shelf_life_days: 365
          },
          {
            name: "Engångsartiklar (trasor, handskar - paket)",
            asset_code: "CLEN-ENG-001",
            cost_per_unit: 25,
            minimum_stock: 100,
            maximum_stock: 500,
            reorder_quantity: 200,
            supplier: "Disposable Supplies Nordic",
            lead_time: 2
          }
        ]
      }
    ];

    // Store categories and items in database
    for (const category of categories) {
      await this.createAssetCategory(category);
    }

    return categories;
  }

  private async createAssetCategory(category: AssetCategory) {
    // First, ensure the category exists
    const { data: categoryData } = await supabase
      .from('asset_categories')
      .select('id')
      .eq('category_name', category.name)
      .single();

    const categoryId = categoryData?.id;

    // Create assets for this category
    for (const item of category.items) {
      const assetData = {
        asset_code: item.asset_code,
        category_id: categoryId,
        asset_name: item.name,
        description: item.name,
        current_quantity: item.minimum_stock * 2, // Start with healthy stock
        minimum_stock_level: item.minimum_stock,
        maximum_stock_level: item.maximum_stock,
        cost_per_unit: item.cost_per_unit,
        supplier: item.supplier,
        reorder_quantity: item.reorder_quantity,
        location: 'Huvudlager Stockholm',
        condition: 'new',
        status: 'active',
        current_value: item.cost_per_unit * item.minimum_stock * 2
      };

      const { data: asset } = await supabase
        .from('company_assets')
        .upsert(assetData, { onConflict: 'asset_code' })
        .select()
        .single();

      if (asset) {
        // Setup reorder automation
        await this.setupReorderAutomation(asset.id, item);
      }
    }
  }

  private async setupReorderAutomation(assetId: number, item: AssetItem) {
    const reorderData = {
      asset_id: assetId,
      auto_reorder_enabled: item.cost_per_unit * item.reorder_quantity < 5000, // Auto-order if under 5000 SEK
      reorder_trigger_level: item.minimum_stock,
      reorder_quantity: item.reorder_quantity,
      preferred_supplier: item.supplier,
      lead_time_days: item.lead_time,
      automatic_approval_limit: 5000,
      order_frequency: 'as_needed'
    };

    await supabase
      .from('reorder_automation')
      .upsert(reorderData, { onConflict: 'asset_id' });
  }

  async trackAssetUsage(jobId: number, usedAssets: any[]): Promise<UsageRecord> {
    const usageRecord: UsageRecord = {
      job_id: jobId,
      usage_date: new Date(),
      total_cost: 0,
      assets_used: []
    };
    
    for (const asset of usedAssets) {
      // Update asset quantities
      await this.updateAssetQuantity(asset.asset_id, -asset.quantity_used);
      
      // Get asset details for cost calculation
      const { data: assetDetails } = await supabase
        .from('company_assets')
        .select('*, asset_categories(*)')
        .eq('id', asset.asset_id)
        .single();
      
      // Calculate cost impact
      const costImpact = asset.quantity_used * (assetDetails?.cost_per_unit || 0);
      usageRecord.total_cost += costImpact;
      
      // Record the usage
      const usageEntry = {
        asset_id: asset.asset_id,
        movement_type: 'usage',
        quantity_change: -asset.quantity_used,
        reference_id: jobId,
        reference_type: 'job',
        cost_impact: costImpact,
        unit_cost: assetDetails?.cost_per_unit || 0,
        performed_by: asset.used_by_employee_id,
        notes: `Used for job ${jobId}`
      };
      
      await this.recordAssetMovement(usageEntry);
      usageRecord.assets_used.push(usageEntry);
      
      // Check if reorder needed
      const reorderCheck = await this.checkReorderThreshold(asset.asset_id);
      if (reorderCheck.reorder_needed) {
        await this.processReorderRecommendation(reorderCheck);
      }
    }
    
    return usageRecord;
  }

  private async updateAssetQuantity(assetId: number, quantityChange: number) {
    const { data: asset } = await supabase
      .from('company_assets')
      .select('current_quantity')
      .eq('id', assetId)
      .single();

    if (asset) {
      const newQuantity = Math.max(0, asset.current_quantity + quantityChange);
      
      await supabase
        .from('company_assets')
        .update({ 
          current_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', assetId);
    }
  }

  private async recordAssetMovement(movement: any) {
    await supabase
      .from('asset_movements')
      .insert(movement);
  }

  async checkReorderThreshold(assetId: number): Promise<ReorderRecommendation> {
    const { data: asset } = await supabase
      .from('company_assets')
      .select('*, reorder_automation(*)')
      .eq('id', assetId)
      .single();
    
    if (!asset) {
      return { reorder_needed: false } as ReorderRecommendation;
    }

    const reorderConfig = asset.reorder_automation?.[0];
    
    if (asset.current_quantity <= asset.minimum_stock_level) {
      const recommendation: ReorderRecommendation = {
        asset_id: assetId,
        asset_name: asset.asset_name,
        current_quantity: asset.current_quantity,
        minimum_level: asset.minimum_stock_level,
        recommended_order: asset.reorder_quantity || 
                          (asset.maximum_stock_level - asset.current_quantity),
        estimated_cost: (asset.reorder_quantity || 0) * asset.cost_per_unit,
        supplier: asset.supplier,
        lead_time: reorderConfig?.lead_time_days || 7,
        urgency: this.calculateUrgency(asset.current_quantity, asset.minimum_stock_level),
        auto_order_eligible: reorderConfig?.auto_reorder_enabled && 
                            ((asset.reorder_quantity || 0) * asset.cost_per_unit) <= 
                            (reorderConfig?.automatic_approval_limit || 0),
        reorder_needed: true
      };
      
      return recommendation;
    }
    
    return { reorder_needed: false } as ReorderRecommendation;
  }

  private calculateUrgency(current: number, minimum: number): 'critical' | 'high' | 'medium' | 'low' {
    const percentage = (current / minimum) * 100;
    
    if (percentage === 0) return 'critical';
    if (percentage < 25) return 'high';
    if (percentage < 50) return 'medium';
    return 'low';
  }

  async processReorderRecommendation(recommendation: ReorderRecommendation) {
    if (recommendation.auto_order_eligible) {
      // Execute automatic reorder
      const order = await this.executeAutomaticReorder(recommendation);
      await this.notifyReorderExecuted(order);
      return order;
    } else {
      // Create manual reorder alert
      const alert = await this.createReorderAlert(recommendation);
      await this.notifyManualReorderNeeded(alert);
      return alert;
    }
  }

  private async executeAutomaticReorder(recommendation: ReorderRecommendation) {
    const order = {
      asset_id: recommendation.asset_id,
      supplier: recommendation.supplier,
      quantity: recommendation.recommended_order,
      unit_cost: recommendation.estimated_cost / recommendation.recommended_order,
      total_cost: recommendation.estimated_cost,
      order_date: new Date(),
      expected_delivery: this.addDays(new Date(), recommendation.lead_time),
      status: 'ordered',
      auto_generated: true,
      order_reference: this.generateOrderReference()
    };

    // Store order record
    await this.storeReorderRecord(order);
    
    // Send order to supplier (integration with supplier systems)
    await this.sendSupplierOrder(order);
    
    // Record the movement (incoming inventory)
    await this.recordAssetMovement({
      asset_id: recommendation.asset_id,
      movement_type: 'purchase',
      quantity_change: recommendation.recommended_order,
      cost_impact: recommendation.estimated_cost,
      notes: `Automatic reorder - Order ref: ${order.order_reference}`
    });

    return order;
  }

  private async createReorderAlert(recommendation: ReorderRecommendation) {
    // Store alert in system for manual processing
    return {
      type: 'manual_reorder_required',
      ...recommendation,
      created_at: new Date()
    };
  }

  private async storeReorderRecord(order: any) {
    // Store order details for tracking
    console.log('Storing reorder record:', order);
  }

  private async sendSupplierOrder(order: any) {
    // Integration with supplier ordering systems
    console.log('Sending order to supplier:', order);
  }

  private async notifyReorderExecuted(order: any) {
    // Send notification about automatic reorder
    console.log('Notifying about automatic reorder:', order);
  }

  private async notifyManualReorderNeeded(alert: any) {
    // Send notification about manual reorder requirement
    console.log('Notifying about manual reorder needed:', alert);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private generateOrderReference(): string {
    return `ORD-${Date.now().toString(36).toUpperCase()}`;
  }

  private async conductInitialInventory() {
    const { data: assets } = await supabase
      .from('company_assets')
      .select('*, asset_categories(*)')
      .order('category_id', { ascending: true });

    return assets || [];
  }

  private async startInventoryMonitoring() {
    // Setup periodic monitoring
    return {
      monitoring_interval: 'daily',
      low_stock_alerts: true,
      expiry_alerts: true,
      maintenance_reminders: true
    };
  }

  // Additional helper methods
  async getAssetsByCategory(categoryId: number) {
    const { data } = await supabase
      .from('company_assets')
      .select('*')
      .eq('category_id', categoryId)
      .order('asset_name');
    
    return data || [];
  }

  async getLowStockAssets() {
    const { data } = await supabase
      .from('company_assets')
      .select('*, asset_categories(*), reorder_automation(*)')
      .filter('current_quantity', 'lte', 'minimum_stock_level')
      .order('current_quantity', { ascending: true });
    
    return data || [];
  }

  async getAssetUsageHistory(assetId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data } = await supabase
      .from('asset_movements')
      .select('*')
      .eq('asset_id', assetId)
      .gte('movement_date', startDate.toISOString())
      .order('movement_date', { ascending: false });
    
    return data || [];
  }

  async getInventoryValuation() {
    const { data: assets } = await supabase
      .from('company_assets')
      .select('*, asset_categories(*)');
    
    let totalValue = 0;
    const categoryBreakdown: any = {};
    
    assets?.forEach(asset => {
      const value = asset.current_quantity * asset.cost_per_unit;
      totalValue += value;
      
      const categoryName = asset.asset_categories?.category_name || 'Uncategorized';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = 0;
      }
      categoryBreakdown[categoryName] += value;
    });
    
    return {
      total_value: totalValue,
      category_breakdown: categoryBreakdown,
      asset_count: assets?.length || 0,
      valuation_date: new Date()
    };
  }
}
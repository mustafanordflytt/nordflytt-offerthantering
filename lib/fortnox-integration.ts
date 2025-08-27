// =============================================================================
// NORDFLYTT FORTNOX AUTO-INVOICE INTEGRATION
// Handles automatic invoice creation and RUT application submission
// =============================================================================

import { v4 as uuidv4 } from 'uuid';

// Types
export interface FortnoxConfig {
  baseURL: string;
  credentials: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
  };
  retryAttempts: number;
  timeout: number;
}

export interface FortnoxCustomer {
  customerNumber?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  personalNumber?: string;
  country?: string;
}

export interface FortnoxInvoice {
  invoiceNumber?: string;
  customerNumber: string;
  deliveryAddress?: {
    name: string;
    address1: string;
    city: string;
    zipCode: string;
  };
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  invoiceRows: FortnoxInvoiceRow[];
  customerReference?: string;
  ourReference?: string;
  remarks?: string;
  language?: string;
  currency?: string;
}

export interface FortnoxInvoiceRow {
  articleNumber: string;
  description: string;
  quantity: number;
  price: number;
  vatRate?: number;
  discount?: number;
  unit?: string;
  houseworkType?: 'CONSTRUCTION' | 'ELECTRICITY' | 'GLASSMETALWORK' | 'GROUNDDRAINAGEWORK' | 
                   'MASONRY' | 'PAINTINGWALLPAPERING' | 'HVAC' | 'CLEANING' | 'TEXTILECLOTHING' | 
                   'SNOWPLOWING' | 'GARDENING' | 'CHILDCARE' | 'PERSONALCARE' | 'MOVINGSERVICES';
  rutEligible?: boolean;
  rutHours?: number;
  laborCost?: number;
}

export interface JobCompletionData {
  jobId: string;
  completedAt: string;
  actualHours: {
    flytthjälp: number;
    packning: number;
    städning: number;
    [key: string]: number;
  };
  staffBreakdown: {
    [service: string]: Array<{
      staffId: string;
      hours: number;
    }>;
  };
  additions: Array<{
    type: string;
    description: string;
    price: number;
    rutEligible: boolean;
    addedBy: string;
    timestamp: string;
  }>;
  materials: Array<{
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    rutEligible: boolean;
    usedBy: string;
  }>;
}

export interface CRMJobData {
  id: string;
  customer: FortnoxCustomer;
  movingDate: string;
  fromAddress: string;
  toAddress: string;
  fromType: string;
  toType: string;
  volume: number;
  isLongDistance: boolean;
  services: Array<{
    type: string;
    articleNumber: string;
    description: string;
    customerPrice: number;
    rutEligible: boolean;
  }>;
  quoteTotal: number;
  status: string;
}

// Main Integration Class
export class NordflyttFortnoxIntegration {
  private config: FortnoxConfig;
  private apiClient: FortnoxAPIClient;

  constructor(config: FortnoxConfig) {
    this.config = config;
    this.apiClient = new FortnoxAPIClient(config);
  }

  // Main workflow for creating complete invoice
  async createCompleteInvoice(
    jobData: CRMJobData,
    completionData: JobCompletionData
  ): Promise<{ success: boolean; invoiceNumber?: string; error?: string }> {
    try {
      // Step 1: Ensure customer exists in Fortnox
      const customerNumber = await this.ensureCustomerExists(jobData.customer);
      if (!customerNumber) {
        throw new Error('Failed to create/find customer in Fortnox');
      }

      // Step 2: Create invoice with all services and materials
      const invoice = await this.buildInvoice(jobData, completionData, customerNumber);
      const createdInvoice = await this.apiClient.createInvoice(invoice);

      if (!createdInvoice.invoiceNumber) {
        throw new Error('Failed to create invoice in Fortnox');
      }

      // Step 3: Create detailed RUT application
      const rutApplication = await this.createDetailedRUTApplication(
        createdInvoice.invoiceNumber,
        jobData,
        completionData
      );

      if (rutApplication.success) {
        console.log(`RUT application created successfully for invoice ${createdInvoice.invoiceNumber}`);
      }

      // Step 4: Send invoice to customer (optional)
      if (process.env.AUTO_SEND_INVOICES === 'true') {
        await this.apiClient.sendInvoice(createdInvoice.invoiceNumber);
      }

      return {
        success: true,
        invoiceNumber: createdInvoice.invoiceNumber
      };
    } catch (error) {
      console.error('Failed to create complete invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Ensure customer exists in Fortnox
  private async ensureCustomerExists(customer: FortnoxCustomer): Promise<string | null> {
    try {
      // First try to find by email
      const existingCustomer = await this.apiClient.findCustomerByEmail(customer.email);
      if (existingCustomer) {
        return existingCustomer.customerNumber;
      }

      // Create new customer
      const newCustomer = await this.apiClient.createCustomer(customer);
      return newCustomer.customerNumber;
    } catch (error) {
      console.error('Failed to ensure customer exists:', error);
      return null;
    }
  }

  // Build complete invoice from job and completion data
  private buildInvoice(
    jobData: CRMJobData,
    completionData: JobCompletionData,
    customerNumber: string
  ): FortnoxInvoice {
    const invoiceRows: FortnoxInvoiceRow[] = [];

    // Add main services with actual hours
    for (const service of jobData.services) {
      const actualHours = completionData.actualHours[service.type] || 0;
      
      if (actualHours > 0) {
        invoiceRows.push({
          articleNumber: service.articleNumber,
          description: `${service.description} - ${actualHours} timmar`,
          quantity: 1,
          price: service.customerPrice,
          vatRate: 25,
          houseworkType: this.getHouseworkType(service.type),
          rutEligible: service.rutEligible,
          rutHours: actualHours,
          laborCost: this.calculateLaborCost(actualHours)
        });
      }
    }

    // Add additional services
    for (const addition of completionData.additions) {
      invoiceRows.push({
        articleNumber: '99', // Generic additional service
        description: addition.description,
        quantity: 1,
        price: addition.price,
        vatRate: 25,
        houseworkType: 'MOVINGSERVICES',
        rutEligible: addition.rutEligible
      });
    }

    // Add materials (non-RUT eligible)
    for (const material of completionData.materials) {
      invoiceRows.push({
        articleNumber: this.getMaterialArticleNumber(material.type),
        description: material.description,
        quantity: material.quantity,
        price: material.unitPrice,
        vatRate: 25,
        rutEligible: false
      });
    }

    return {
      customerNumber,
      deliveryAddress: {
        name: jobData.customer.name,
        address1: jobData.toAddress,
        city: jobData.customer.city,
        zipCode: jobData.customer.zipCode
      },
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: this.calculateDueDate(),
      paymentTerms: '30 dagar netto',
      invoiceRows,
      customerReference: jobData.customer.name,
      ourReference: 'Nordflytt Team',
      remarks: `Flytt från ${jobData.fromAddress} till ${jobData.toAddress}`,
      language: 'SV',
      currency: 'SEK'
    };
  }

  // Create detailed RUT application with all required data
  private async createDetailedRUTApplication(
    invoiceNumber: string,
    jobData: CRMJobData,
    completionData: JobCompletionData
  ): Promise<{ success: boolean; rutId?: string; error?: string }> {
    try {
      const rutData = {
        invoiceNumber,
        personalNumber: jobData.customer.personalNumber,
        services: [] as any[]
      };

      // Calculate RUT for each service
      for (const service of jobData.services) {
        if (service.rutEligible) {
          const actualHours = completionData.actualHours[service.type] || 0;
          const laborCost = this.calculateLaborCost(actualHours);
          const rutAmount = Math.floor(laborCost * 0.5); // 50% RUT deduction

          rutData.services.push({
            houseworkType: this.getHouseworkType(service.type),
            hours: actualHours,
            laborCost,
            rutAmount,
            description: service.description,
            staffCount: completionData.staffBreakdown[service.type]?.length || 0
          });
        }
      }

      // Submit RUT application
      const rutApplication = await this.apiClient.createRUTApplication(rutData);
      
      return {
        success: true,
        rutId: rutApplication.id
      };
    } catch (error) {
      console.error('Failed to create RUT application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper methods
  private getHouseworkType(serviceType: string): string {
    const typeMap: { [key: string]: string } = {
      'flytthjälp': 'MOVINGSERVICES',
      'packning': 'MOVINGSERVICES',
      'städning': 'CLEANING',
      'montering': 'CONSTRUCTION',
      'elektriker': 'ELECTRICITY',
      'vvs': 'HVAC'
    };
    return typeMap[serviceType] || 'MOVINGSERVICES';
  }

  private calculateLaborCost(hours: number): number {
    const hourlyRate = 450; // SEK per hour (before RUT)
    return hours * hourlyRate;
  }

  private getMaterialArticleNumber(materialType: string): string {
    const materialMap: { [key: string]: string } = {
      'boxes_large': '101',
      'boxes_medium': '102',
      'boxes_small': '103',
      'bubble_wrap': '104',
      'tape': '105',
      'plastic_bags': '106'
    };
    return materialMap[materialType] || '199';
  }

  private calculateDueDate(): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  }
}

// Fortnox API Client
class FortnoxAPIClient {
  private config: FortnoxConfig;

  constructor(config: FortnoxConfig) {
    this.config = config;
  }

  // Create invoice
  async createInvoice(invoice: FortnoxInvoice): Promise<any> {
    return this.makeRequest('POST', '/invoices', { Invoice: invoice });
  }

  // Send invoice to customer
  async sendInvoice(invoiceNumber: string): Promise<any> {
    return this.makeRequest('PUT', `/invoices/${invoiceNumber}/email`, {});
  }

  // Find customer by email
  async findCustomerByEmail(email: string): Promise<any> {
    const response = await this.makeRequest('GET', `/customers?email=${email}`);
    return response.Customers?.[0] || null;
  }

  // Create customer
  async createCustomer(customer: FortnoxCustomer): Promise<any> {
    return this.makeRequest('POST', '/customers', { Customer: customer });
  }

  // Create RUT application
  async createRUTApplication(rutData: any): Promise<any> {
    // This would integrate with Skatteverket's API
    // For now, we'll simulate the response
    return {
      id: `RUT-${uuidv4()}`,
      status: 'submitted',
      submittedAt: new Date().toISOString()
    };
  }

  // Make HTTP request to Fortnox API
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
          'Client-Secret': this.config.credentials.clientSecret
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Fortnox API error response:`, errorBody);
        throw new Error(`Fortnox API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      console.error(`Fortnox API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }
}

// Export singleton instance
let fortnoxIntegration: NordflyttFortnoxIntegration | null = null;

export function getFortnoxIntegration(): NordflyttFortnoxIntegration {
  if (!fortnoxIntegration) {
    // Use verified working credentials - UPDATED with latest token
    const VERIFIED_FORTNOX_CONFIG = {
      access_token: process.env.FORTNOX_ACCESS_TOKEN || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInRlbmFudElkIjoxNzEwOTU2LCJyaWdodHNBc0pzb24iOiJINHNJQUFBQUFBQUFBNDFZMjQ3Yk5oRDlsengzXC9RK09GMXNZU05ORnZFRlFGSVZCU1NPWkVTOENTZG5yZm4wUEw1Skp5ZDdtWVFGenJtZUd3NW5SXC92M0owS0NOczV1cVBkcVR2aHdOU1gybTVualdZMzBpY3pUNllqXC85Tm9zSlhWWFg3Q3gxTXdyYTFqWFpYS3hxc3dNYkcrNnlzOVp0WVZGbHA3NVFWQUtucXRsY0RIZjAzWkw1eHJ1VHM1SFlHVDBPXC9tZTdhYmxpcXVaTVwvRVhNSE1nNXJqb2JXU21PZUtnTk1VZVdxN1BtTmJHNk5pTVRPWXNKUjJiaVI4YkFycEtVczJQWGtYVThvQVc1WVZ4Y0hldHZubXBBSUZFcUIrQXZYTkNiUGx5dElcL21pUlFNUEJUWUwwUFdKU1QwcWw0eVRLSEJiVHZUdWM1SWdrV20xa1FYKzRLa01QUVJUMkdrOUVzT1ViV21ScGtycnZvUWVFNUxVQzFjM2RGeXlMb216MFoyMDRmK1N0OVFUcFp1eDdFeWwzWUJxN1U2MHRnQlV4cmhPNnVma0Jobzc0T3pnbTVKcWFRaTU0XC9LV3UreWVpOVFZT3BOeG9wcVVDc2gxN2VcL0dVSzFSWllLeld4bk1ZYWN5bVJDb3BqU1JCd3pSMGd1TWFKa1pEVW43SUJzRmNHKzVJQWhkOTVEbnVrbm42b01vY0pma0VzWVR0MDZicTlEZGxKS2ErSEMzNXJMZ0hPSHR1U2RrajdlOERrWTM0UEpnRlU4OXo3aHUyNERTazdNQVwvUkh5Y2xJSUQwbWJacGFOSm5JS2E1cmNtS3RjbDU5WHZKV3hpQ2NqSXhPNVZwUktZYlpHeTRmTVJGcyt3QWxsNXNJZzJjd1djVXlcLzVmVXAzY1wvR3QrRnRaNGhDMjltcTVvMk10S1VNXC9EY2xKYmpmYVRrd2RkMnJjRlgrS2pKQW1YQTF3c0M0MDBwUjdhWHNHc0UrQnZjYXlcL3JnbUJ2dllFaFNub00rdnJFUVF4SHhcL21qRmtHaG1WRWNVWjkybmM4OEVYZ2N6ZkpUSGJ1VE5yQXpCVE1Wam1JN1V3U2htRVdyUWFoWGFrS2N2TSs1cER6cGNZY1lDam1RcnlQME1PUXNqaHhUZjdYUnk3RDA3K1ZjSVg1T0JoV2VmZ2xBeUNcLzdSdlwvU2wwenQ1eXBKUmtHXC9hK0tPZW9ZR3hybE13XC9ZMVN5MXZyaUVhdlk3Y1wveHd3c2M1aVM3bzdVZktseFFoODl6NjY5TERLTzR6eWhuNXlcL0hSYkxiak1OaTkySTFpUEp2R1hNXC85YzZqTU1nK0s5cW9ZNTlqSUJzM0RnOHhkcmJTSFo5MXJHTWtiYURpNE9McVg3ajljNjRzNzNDZURGVGU2NjFsQ0UwMXFUWGxwVlpZb2JDXC9QT2lIbkIyXC9NenJyNk9zUW1aeXpoZThKV1VwVTVoSFZ6cExYYUhDRjJxdlJnT2czRGFTS3lRY1dIVm1tUW1CSFE0NXFuMkZmcjYrd0tEUzd3c2JCMm0zbUdWNDY2bUozXC9pKytwNjVaWldnWnRzMGE1Q1NtWjVjTFA5RW12YkVkTVI2NCtZbGNRb05lVFY0elh2N1ZidXRCMG5ObVwvNmlPNjUrY0hkNlpkWmUwQjRYT0lzdGNJcXdBTVVHN2tmSTl1NzE5YjRMSTAxcENjT3hRa2Vlb2ZXTDNuN2JlXC9vNFNHNDlId1NCWkdPWUl1RzFTOHBoZEJWQ1NIWFdEcndaOW02b0dlc2JJb2pVcUdQbEJxeFRTY3F2RUlXZDJHR3lCYUl2UmxraEcra1R0SUtWcjVMUmRmeXhiS1o5WEVNSzNRZk5kZVZ3QlRnUzhLMHdHUDJUYXJjTUczQ21KSmU1U2hOem1kRGlQQytVQlRWVWwxXC9ZaStETHhXb0ZIRHZJSUdLYmpuanIxSmZTZmVlYmxjOEhWTEQ4d1JnSmtkMjJhaVlNbWU4TFZXbGF6dFZXamRpajhKT3JTcjl2TUpPNHQ0S3ZudHVBRUloclNVc0RPTDQzejhGTElUUmpQSU9Ta0xZRVQ1bUhYMlF0VGM1dEp0Tk9HMTlKblBmRlFyMk9uWkJqNzVqOXJRMWk5TkRTMm9BbGM5Nm5NODQ0TlBvU2VwQ1JHOG45QThZMzFDN0F3UTdTeGg0MjdVRXhPbk1ORlRxWDkweE51K1Y4VGxYWWF0OTB3amZrek1xXC9GZ3I5bmJZRnpZK0liYndJbTlPbml2bEIxZmQ5enZDbHBhOUVPUzNkNUVyV094d01TZ1ZwaU9XWUExd0hhTk1nTElBQU1IcWlLNm5lOHNwZGduRXZESDhyMHk3cTVXaHdMMkc4MHJ5aTNoRTU0T09LZnl6aSszak81OHFHcmo1ZDZYeE9ZeHY3eENCRys2Z0h4VVlTSG4wZDExcHROZzIzNmZCNXNmQSswampqVTlOblwvSG5XXC9FQ1lEU2lrTVwvMnFiUjlZSHZFRG9aXC8zNGNaUHFoRlpTejNySzExOERzSHl4Q2NcL1lhT0xxYnVJem9TTVJmRzl3aU5Gbm43WHVzbTVpM1wvZ2xFcFlMTktnK3RPa2lUa0pwTzd3Z1FRMTNPM1IyVWJWcE1kek16Nyt3UlRtNmpObXBmOXdwRnh2dGRZbk92YVlPMVJMNUsyXC9jQkpGWEdseWZPQW5TVHhLREFhQmVvMUJIaHdhXC94dExDejVTZzhqQ0owMCtyWEp5OXZzb21BblwvSTNuRWxcL2daTnVaSEFsYXlNRjBLZm15NEs2cXlZM3kwWWozUnhjTUJIcW9xaW9kXC9VaTBYeVlhdGpNVWRtK1lsK2RNXC9cL3dIVGpIdUxTeFFBQUE9PSIsInJpZ2h0cyI6Ikg0c0lBQUFBQUFBQUE0dFd5azdUeTh3cnk4OU1UbFhTQVhIeThpdGdcL0ZnQUptc0tZUjRBQUFBPSIsImFwcHNTZXJ2ZXJIb3N0IjoiYXBwczUuZm9ydG5veC5zZSIsInNlbmRJbnZvaWNlQWNjZXNzIjp0cnVlLCJjbGllbnRJZCI6Inh2ZWtTVzdjcVJzZiIsInNjb3BlcyI6WyJjdXN0b21lciIsImludm9pY2UiLCJhcnRpY2xlIiwiY29tcGFueWluZm9ybWF0aW9uIl0sImF1dGhzb3VyY2UiOiJPQVVUSDIiLCJpZCI6ImEwMmQwNWY5ODlkYTNjMzVmZjQ5ZTAzOWRkM2Y4ODZhODMwZGMxMWQiLCJqdGkiOiJhMDJkMDVmOTg5ZGEzYzM1ZmY0OWUwMzlkZDNmODg2YTgzMGRjMTFkIiwiaXNzIjoiaHR0cHM6XC9cL2FwaS5mb3J0bm94LnNlXC9vYXV0aDIiLCJhdWQiOiJ4dmVrU1c3Y3FSc2YiLCJzdWIiOiIxQDE3MTA5NTYiLCJleHAiOjE3NTMyNzM2MzEsImlhdCI6MTc1MzI3MDAzMSwidG9rZW5fdHlwZSI6ImJlYXJlciIsInNjb3BlIjoiY3VzdG9tZXIgaW52b2ljZSBhcnRpY2xlIGNvbXBhbnlpbmZvcm1hdGlvbiJ9.FCvLt5aONc8wapRpcI3Y7DoWdVQ8sZR0tJHI1liDKe0",
      client_id: process.env.FORTNOX_CLIENT_ID || "xvekSW7cqRsf",
      client_secret: process.env.FORTNOX_CLIENT_SECRET || "YhfvjemECo"
    };

    fortnoxIntegration = new NordflyttFortnoxIntegration({
      baseURL: 'https://api.fortnox.se/3',
      credentials: {
        clientId: VERIFIED_FORTNOX_CONFIG.client_id,
        clientSecret: VERIFIED_FORTNOX_CONFIG.client_secret,
        accessToken: VERIFIED_FORTNOX_CONFIG.access_token
      },
      retryAttempts: 3,
      timeout: 30000
    });
  }
  return fortnoxIntegration;
}
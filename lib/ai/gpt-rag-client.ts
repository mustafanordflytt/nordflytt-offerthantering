// GPT RAG API Client for Nordflytt AI Customer Service
// Connects to production API at https://api.nordflytt.se

interface CustomerLookupRequest {
  email?: string;
  phone?: string;
  query_context?: string;
}

interface CustomerLookupResponse {
  customer_found: boolean;
  customer_data?: {
    name: string;
    is_vip: boolean;
    total_bookings: number;
    last_booking?: {
      date: string;
      services: string[];
    };
    is_returning: boolean;
  };
  response_context: string;
  suggested_greeting: string;
}

interface BookingDetailsRequest {
  booking_id?: string;
  customer_email?: string;
  include_history?: boolean;
}

interface BookingDetailsResponse {
  booking_found: boolean;
  booking_data?: {
    id: string;
    scheduled_date: string;
    services: string[];
    total_amount: number;
    status: string;
    address_from?: string;
    address_to?: string;
    volume_m3?: number;
    crew_size?: number;
    estimated_duration?: string;
  };
  customer_history?: Array<{
    date: string;
    services: string[];
    amount: number;
    status: string;
  }>;
  response_suggestions?: string[];
}

interface CreateTicketRequest {
  customer_email: string;
  category: 'moving' | 'pricing' | 'schedule' | 'service' | 'complaint' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  gpt_session_id?: string;
  metadata?: Record<string, any>;
}

interface CreateTicketResponse {
  ticket_created: boolean;
  ticket_data?: {
    ticket_number: string;
    assigned_team: string;
    estimated_response: string;
    priority: string;
    status: string;
  };
  error?: string;
}

interface CalculatePriceRequest {
  services: string[];
  area_sqm?: number;
  volume_m3?: number;
  distance_km?: number;
  floors?: number;
  has_elevator?: boolean;
  parking_distance?: number;
  extra_services?: string[];
  customer_type?: 'private' | 'business';
}

interface CalculatePriceResponse {
  price_calculated: boolean;
  pricing_data?: {
    base_price: number;
    total_price: number;
    rut_discount?: number;
    rot_discount?: number;
    volume_discount?: string;
    breakdown: Array<{
      service: string;
      amount: number;
      unit?: string;
      price: number;
    }>;
    estimated_duration: string;
    crew_size: number;
  };
  error?: string;
}

export class GPTRAGClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Use production API URL
    this.baseUrl = process.env.NEXT_PUBLIC_GPT_RAG_API_URL || 'https://api.nordflytt.se';
    this.apiKey = process.env.NORDFLYTT_GPT_API_KEY || 'nordflytt_gpt_api_key_2025';
  }

  private async request<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/gpt-rag/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GPT RAG API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async lookupCustomer(request: CustomerLookupRequest): Promise<CustomerLookupResponse> {
    return this.request<CustomerLookupResponse>('customer-lookup', request);
  }

  async getBookingDetails(request: BookingDetailsRequest): Promise<BookingDetailsResponse> {
    return this.request<BookingDetailsResponse>('booking-details', request);
  }

  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    return this.request<CreateTicketResponse>('create-ticket', request);
  }

  async calculatePrice(request: CalculatePriceRequest): Promise<CalculatePriceResponse> {
    return this.request<CalculatePriceResponse>('calculate-price', request);
  }

  // Analytics tracking for dashboard
  async trackGPTInteraction(data: {
    session_id: string;
    customer_email?: string;
    interaction_type: string;
    revenue_impact?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await fetch('/api/ai-customer-service/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          source: 'gpt-rag'
        })
      });
    } catch (error) {
      console.error('Failed to track GPT interaction:', error);
    }
  }

  // Get live GPT conversations for dashboard
  async getLiveConversations(): Promise<Array<{
    id?: string;
    session_id?: string;
    customer_email: string;
    customer_name?: string;
    started_at: string;
    messages_count: number;
    last_activity: string;
    revenue_potential: number;
    status: 'active' | 'idle' | 'completed';
    agent_name?: string;
    conversation_topic?: string;
  }>> {
    try {
      const response = await fetch('/api/ai-customer-service/gpt/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch live conversations:', error);
      return [];
    }
  }

  // Get support tickets created by GPT
  async getGPTTickets(limit: number = 10): Promise<Array<{
    ticket_number: string;
    customer_email: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    gpt_session_id: string;
  }>> {
    try {
      const response = await fetch(`/api/ai-customer-service/gpt/tickets?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GPT tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch GPT tickets:', error);
      return [];
    }
  }
}

// Export singleton instance
export const gptRAGClient = new GPTRAGClient();
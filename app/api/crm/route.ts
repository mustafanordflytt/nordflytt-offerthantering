import { NextRequest, NextResponse } from 'next/server';

// Mock CRM data
const mockCustomers = [
  { id: 1, name: 'Anna Andersson', email: 'anna@example.com', phone: '070-123-4567', status: 'active', created: '2025-01-15' },
  { id: 2, name: 'Erik Johansson', email: 'erik@example.com', phone: '070-234-5678', status: 'active', created: '2025-01-20' },
  { id: 3, name: 'Maria Lindqvist', email: 'maria@example.com', phone: '070-345-6789', status: 'pending', created: '2025-01-25' }
];

const mockLeads = [
  { id: 1, name: 'Potential Customer 1', email: 'lead1@example.com', source: 'website', status: 'new', value: 15000, created: '2025-01-30' },
  { id: 2, name: 'Potential Customer 2', email: 'lead2@example.com', source: 'google_ads', status: 'contacted', value: 25000, created: '2025-01-31' }
];

const mockBookings = [
  { id: 1, customer_id: 1, date: '2025-02-15', status: 'confirmed', value: 18000, type: 'moving' },
  { id: 2, customer_id: 2, date: '2025-02-20', status: 'pending', value: 22000, type: 'moving' }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    
    let data;
    switch (type) {
      case 'customers':
        data = await getCustomers();
        break;
      case 'leads':
        data = await getLeads();
        break;
      case 'bookings':
        data = await getBookings();
        break;
      case 'analytics':
        data = await getAnalytics();
        break;
      case 'dashboard':
      default:
        data = await getDashboardData();
    }
    
    return NextResponse.json({
      success: true,
      data,
      type,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('CRM GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve CRM data'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();
    
    let result;
    switch (type) {
      case 'customer':
        result = await createCustomer(data);
        break;
      case 'lead':
        result = await createLead(data);
        break;
      case 'booking':
        result = await createBooking(data);
        break;
      default:
        throw new Error('Invalid data type');
    }
    
    return NextResponse.json({
      success: true,
      result,
      message: `${type} created successfully`
    }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Failed to create record`,
      details: error.message
    }, { status: 400 });
  }
}

// Helper functions
async function getCustomers() {
  return mockCustomers;
}

async function getLeads() {
  return mockLeads;
}

async function getBookings() {
  return mockBookings;
}

async function getAnalytics() {
  return {
    total_customers: 156,
    active_leads: 23,
    pending_bookings: 8,
    monthly_revenue: 245000,
    conversion_rate: 0.32,
    average_booking_value: 19500,
    trends: {
      customers: [120, 135, 142, 156],
      revenue: [180000, 210000, 225000, 245000],
      bookings: [12, 15, 18, 21]
    }
  };
}

async function getDashboardData() {
  const [customers, leads, bookings, analytics] = await Promise.all([
    getCustomers(),
    getLeads(),
    getBookings(),
    getAnalytics()
  ]);
  
  return {
    customers: customers.slice(0, 5), // Recent customers
    leads: leads.slice(0, 5), // Recent leads
    bookings: bookings.slice(0, 5), // Recent bookings
    analytics,
    summary: {
      total_customers: customers.length,
      total_leads: leads.length,
      total_bookings: bookings.length,
      pending_actions: leads.filter(l => l.status === 'new').length + 
                      bookings.filter(b => b.status === 'pending').length
    }
  };
}

async function createCustomer(data: any) {
  const customer = {
    id: Date.now(),
    ...data,
    created: new Date().toISOString().split('T')[0],
    status: 'active'
  };
  mockCustomers.push(customer);
  return customer;
}

async function createLead(data: any) {
  const lead = {
    id: Date.now(),
    ...data,
    created: new Date().toISOString().split('T')[0],
    status: 'new'
  };
  mockLeads.push(lead);
  return lead;
}

async function createBooking(data: any) {
  const booking = {
    id: Date.now(),
    ...data,
    created: new Date().toISOString(),
    status: 'pending'
  };
  mockBookings.push(booking);
  return booking;
}
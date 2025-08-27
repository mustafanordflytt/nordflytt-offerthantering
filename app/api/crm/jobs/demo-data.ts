// Demo jobs with enhanced data for Uppdrag module
export function getEnhancedDemoJobs() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  
  return [
    {
      id: 'DEMO001',
      bookingNumber: 'NF-2025-001',
      customerId: 'cust_001',
      customerName: 'Anna Svensson',
      customerType: 'private',
      fromAddress: 'Vasagatan 10, Stockholm',
      toAddress: 'Kungsgatan 25, Stockholm',
      moveDate: today.toISOString().split('T')[0],
      moveTime: '10:00',
      status: 'on_route',
      priority: 'high',
      assignedStaff: [
        { id: '2', name: 'Johan Svensson', role: 'driver', phone: '070-333-4444' },
        { id: '3', name: 'Maria Andersson', role: 'mover', phone: '070-555-6666' }
      ],
      estimatedHours: 3,
      actualHours: null,
      totalPrice: 3200,
      services: ['Flytthjälp'],
      notes: 'Kund vill ha hjälp med packning av ömtåliga föremål',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      requiresPackingService: false,
      requiresCleaningService: false,
      hasLargeItems: false,
      distance: 3.5,
      customerEmail: 'anna@example.com',
      customerPhone: '070-555-1234',
      startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      coordinates: {
        from: { lat: 59.3293, lng: 18.0686 },
        to: { lat: 59.3326, lng: 18.0649 }
      }
    },
    {
      id: 'DEMO002',
      bookingNumber: 'NF-2025-002',
      customerId: 'cust_002',
      customerName: 'Företaget AB',
      customerType: 'business',
      fromAddress: 'Sveavägen 50, Stockholm',
      toAddress: 'Hamngatan 20, Stockholm',
      moveDate: today.toISOString().split('T')[0],
      moveTime: '14:00',
      status: 'confirmed',
      priority: 'medium',
      assignedStaff: [
        { id: '1', name: 'Erik Johansson', role: 'lead', phone: '070-111-2222' }
      ],
      estimatedHours: 6,
      actualHours: null,
      totalPrice: 8500,
      services: ['Kontorsflytt', 'Packning', 'Montering'],
      notes: 'Kontorsflytt med 20 arbetsplatser',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      requiresPackingService: true,
      requiresCleaningService: false,
      hasLargeItems: true,
      distance: 2.1,
      customerEmail: 'info@foretaget.se',
      customerPhone: '08-123-4567',
      coordinates: {
        from: { lat: 59.3349, lng: 18.0621 },
        to: { lat: 59.3314, lng: 18.0572 }
      }
    },
    {
      id: 'DEMO003',
      bookingNumber: 'NF-2025-003',
      customerId: 'cust_003',
      customerName: 'Erik Johansson',
      customerType: 'private',
      fromAddress: 'Storgatan 15, Stockholm',
      toAddress: 'Parkvägen 8, Uppsala',
      moveDate: tomorrow.toISOString().split('T')[0],
      moveTime: '09:00',
      status: 'scheduled',
      priority: 'high',
      assignedStaff: [],
      estimatedHours: 4,
      actualHours: null,
      totalPrice: 4500,
      services: ['Flytthjälp', 'Packning'],
      notes: 'Kund har piano som behöver extra försiktighet',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      requiresPackingService: true,
      requiresCleaningService: false,
      hasLargeItems: true,
      distance: 72,
      customerEmail: 'erik@example.com',
      customerPhone: '070-123-4567',
      coordinates: {
        from: { lat: 59.3293, lng: 18.0686 },
        to: { lat: 59.8586, lng: 17.6389 }
      }
    },
    {
      id: 'DEMO004',
      bookingNumber: 'NF-2025-004',
      customerId: 'cust_004',
      customerName: 'Lisa Andersson',
      customerType: 'private',
      fromAddress: 'Götgatan 30, Stockholm',
      toAddress: 'Hornsgatan 45, Stockholm',
      moveDate: nextWeek.toISOString().split('T')[0],
      moveTime: '11:00',
      status: 'scheduled',
      priority: 'low',
      assignedStaff: [],
      estimatedHours: 2,
      actualHours: null,
      totalPrice: 2200,
      services: ['Flytthjälp'],
      notes: 'Liten lägenhet, endast några möbler',
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      requiresPackingService: false,
      requiresCleaningService: true,
      hasLargeItems: false,
      distance: 1.5,
      customerEmail: 'lisa@example.com',
      customerPhone: '070-987-6543',
      coordinates: {
        from: { lat: 59.3195, lng: 18.0719 },
        to: { lat: 59.3158, lng: 18.0543 }
      }
    },
    {
      id: 'DEMO005',
      bookingNumber: 'NF-2025-005',
      customerId: 'cust_005',
      customerName: 'Tech Startup AB',
      customerType: 'business',
      fromAddress: 'Birger Jarlsgatan 57, Stockholm',
      toAddress: 'Regeringsgatan 65, Stockholm',
      moveDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      moveTime: '08:00',
      status: 'completed',
      priority: 'urgent',
      assignedStaff: [
        { id: '1', name: 'Erik Johansson', role: 'lead', phone: '070-111-2222' },
        { id: '2', name: 'Johan Svensson', role: 'driver', phone: '070-333-4444' },
        { id: '4', name: 'Lars Nilsson', role: 'mover', phone: '070-777-8888' }
      ],
      estimatedHours: 8,
      actualHours: 7.5,
      totalPrice: 12500,
      services: ['Kontorsflytt', 'Packning', 'IT-hantering'],
      notes: 'Flytt av serverrum kräver extra försiktighet',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      requiresPackingService: true,
      requiresCleaningService: false,
      hasLargeItems: true,
      distance: 0.8,
      customerEmail: 'admin@techstartup.se',
      customerPhone: '08-555-1234',
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 15.5 * 60 * 60 * 1000).toISOString(),
      customerSignature: 'data:image/png;base64,signature',
      checklistCompleted: true,
      photos: ['before.jpg', 'during.jpg', 'after.jpg'],
      coordinates: {
        from: { lat: 59.3369, lng: 18.0684 },
        to: { lat: 59.3405, lng: 18.0632 }
      }
    }
  ]
}
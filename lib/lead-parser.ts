interface ParsedLead {
  // Customer info
  customerName?: string
  email?: string
  phone?: string
  
  // Move details
  fromAddress?: string
  fromPostcode?: string
  fromCity?: string
  fromFloor?: number
  fromPropertyType?: 'lägenhet' | 'hus' | 'kontor' | 'övrigt'
  
  toAddress?: string
  toPostcode?: string
  toCity?: string
  toFloor?: number
  toPropertyType?: 'lägenhet' | 'hus' | 'kontor' | 'övrigt'
  
  // Move info
  moveDate?: string
  flexibleDate?: string
  rooms?: number
  squareMeters?: number
  
  // Services
  hasElevatorFrom?: boolean
  hasElevatorTo?: boolean
  parkingDistanceFrom?: number
  parkingDistanceTo?: number
  packingService?: boolean
  cleaningService?: boolean
  
  // Additional
  estimatedVolume?: number
  additionalInfo?: string
  leadSource?: string
  leadId?: string
}

export const LEAD_DEFAULTS = {
  squareMeters: 50,
  hasElevatorFrom: true,
  hasElevatorTo: true,
  parkingDistanceFrom: 5,
  parkingDistanceTo: 5,
  fromFloor: 2,
  toFloor: 2,
  packingService: false,
  cleaningService: false,
  moveTime: '08:00-10:00',
  customerType: 'private' as const
}

export class LeadParser {
  private extract(text: string, pattern: RegExp, group = 1): string | undefined {
    const match = text.match(pattern)
    return match?.[group]?.trim()
  }

  private extractBoolean(text: string, pattern: RegExp): boolean | undefined {
    const match = this.extract(text, pattern)
    if (!match) return undefined
    const lowerMatch = match.toLowerCase()
    return lowerMatch === 'ja' || lowerMatch === 'yes' || lowerMatch === 'true'
  }

  private extractNumber(text: string, pattern: RegExp): number | undefined {
    const match = this.extract(text, pattern)
    if (!match) return undefined
    const num = parseInt(match.replace(/\D/g, ''))
    return isNaN(num) ? undefined : num
  }

  private parseDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined
    
    // Try different date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{1,2})\s+(\w+)\.?\s+(\d{4})/, // 30 apr. 2025
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
    ]
    
    // Return ISO format for consistency
    return dateStr // For now, keep original format
  }

  private parsePropertyType(text: string): 'lägenhet' | 'hus' | 'kontor' | 'övrigt' {
    const lower = text.toLowerCase()
    if (lower.includes('lägenhet')) return 'lägenhet'
    if (lower.includes('hus') || lower.includes('villa')) return 'hus'
    if (lower.includes('kontor')) return 'kontor'
    return 'övrigt'
  }

  parseFlyttfirma24(text: string): ParsedLead {
    const lead: ParsedLead = {}
    
    // Customer info
    lead.customerName = this.extract(text, /Namn:\s*(.+)/)
    lead.phone = this.extract(text, /Telefon:\s*(.+)/)
    lead.email = this.extract(text, /Epost:\s*(.+)/)
    
    // Lead metadata
    lead.leadId = this.extract(text, /Lead ID:\s*(.+)/)
    lead.leadSource = 'flyttfirma24'
    
    // Moving details
    lead.moveDate = this.extract(text, /Potentiellt flyttdatum:\s*(.+)/)
    lead.rooms = this.extractNumber(text, /Antal rum:\s*(\d+)/)
    
    // From address
    lead.fromAddress = this.extract(text, /Flyttar från:[\s\S]*?Adress:\s*(.+)/)
    lead.fromPostcode = this.extract(text, /Flyttar från:[\s\S]*?Postnummer:\s*(.+)/)
    lead.fromCity = this.extract(text, /Flyttar från:[\s\S]*?Ort:\s*(.+)/)
    
    const fromProperty = this.extract(text, /Flyttar från:[\s\S]*?Fastighet:\s*(.+)/)
    if (fromProperty) {
      lead.fromPropertyType = this.parsePropertyType(fromProperty)
    }
    
    // To address
    lead.toAddress = this.extract(text, /Flyttar till:[\s\S]*?Adress:\s*(.+)/)
    lead.toCity = this.extract(text, /Flyttar till:[\s\S]*?Ort:\s*(.+)/)
    
    const toProperty = this.extract(text, /Flyttar till:[\s\S]*?Ny fastighet:\s*(.+)/)
    if (toProperty) {
      lead.toPropertyType = this.parsePropertyType(toProperty)
    }
    
    // Elevator info
    const hasElevator = this.extract(text, /Hiss\s*(.+)/)
    if (hasElevator) {
      lead.hasElevatorTo = hasElevator.toLowerCase() === 'ja'
    }
    
    // Additional info
    const category = this.extract(text, /Kategori:\s*(.+)/)
    if (category?.toLowerCase().includes('flyttning')) {
      // Default moving service
    }
    
    return lead
  }

  parseFlyttaSe(text: string): ParsedLead {
    const lead: ParsedLead = {}
    
    // Customer info
    lead.customerName = this.extract(text, /Namn\s+(.+)/)
    lead.email = this.extract(text, /E-post\s+(.+)/)
    lead.phone = this.extract(text, /Telefonnummer\s+(.+)/)
    lead.leadSource = 'flytta.se'
    
    // Move date
    lead.moveDate = this.extract(text, /Önskat flyttdatum\s+(.+)/)
    lead.flexibleDate = this.extract(text, /Flexibelt flyttdatum\s+(.+)/)
    
    // Services
    const packing = this.extract(text, /Vill du att flyttfirman packar.*?\s+(.+)/)
    lead.packingService = packing?.toLowerCase() === 'ja'
    
    const cleaning = this.extract(text, /Vill du ha flyttstädning.*?\s+(.+)/)
    lead.cleaningService = cleaning?.toLowerCase() === 'ja'
    
    // From address
    lead.fromAddress = this.extract(text, /Adress\s+([^\\n]+)(?=\s+Gatuadress)/) || 
                       this.extract(text, /Nuvarande adress[\s\S]*?Adress\s+(.+)/)
    lead.fromPostcode = this.extract(text, /Postnummer\s+(\d{5})/)
    lead.fromCity = this.extract(text, /Postort\s+(.+)/)
    lead.squareMeters = this.extractNumber(text, /Bostadsstorlek\s+(\d+)/)
    lead.rooms = this.extractNumber(text, /Antal rum\s+(\d+)/)
    
    const fromType = this.extract(text, /Bostadstyp\s+(.+)/)
    if (fromType) {
      lead.fromPropertyType = this.parsePropertyType(fromType)
    }
    
    lead.fromFloor = this.extractNumber(text, /På vilken våning.*?\s+Våning\s+(\d+)/)
    lead.hasElevatorFrom = this.extractBoolean(text, /Finns hiss i byggnaden\?\s+(.+)/)
    lead.parkingDistanceFrom = this.extractNumber(text, /Avstånd till parkering\s+(\d+)/)
    
    // To address
    lead.toAddress = this.extract(text, /Ny adress\s+([^\\n]+)(?=\s+Ny gatuadress)/) ||
                     this.extract(text, /Ny adress[\s\S]*?Ny adress\s+(.+)/)
    lead.toPostcode = this.extract(text, /Nytt postnummer\s+(\d{5})/)
    lead.toCity = this.extract(text, /Ny postort\s+(.+)/)
    
    const toSquareMeters = this.extractNumber(text, /Nya bostadens storlek.*?\s+(\d+)/)
    const toRooms = this.extractNumber(text, /Antal rum i den nya bostaden\s+(\d+)/)
    
    const toType = this.extract(text, /Typ av ny bostad\s+(.+)/)
    if (toType) {
      lead.toPropertyType = this.parsePropertyType(toType)
    }
    
    lead.toFloor = this.extractNumber(text, /På vilken våning ligger den nya.*?\s+Våning\s+(\d+)/)
    lead.hasElevatorTo = this.extractBoolean(text, /Finns hiss i den nya byggnaden\?\s+(.+)/)
    lead.parkingDistanceTo = this.extractNumber(text, /Avstånd till parkering vid den nya bostaden\s+(\d+)/)
    
    // Additional info
    lead.additionalInfo = this.extract(text, /Meddelande\s+(.+)/)
    
    return lead
  }

  parseSimpleFormat(text: string): ParsedLead {
    const lead: ParsedLead = {}
    
    // Look for patterns in simple format
    lead.customerName = this.extract(text, /Namn:\s*(.+)/)
    lead.email = this.extract(text, /E-post:\s*(.+)/)
    lead.phone = this.extract(text, /Telefon:\s*(.+)/)
    
    // Addresses
    lead.toAddress = this.extract(text, /Flyttar till:[\s\S]*?(.+)/)
    lead.toPostcode = this.extract(text, /Flyttar till:[\s\S]*?(\d{5})/)
    lead.toCity = this.extract(text, /Flyttar till:[\s\S]*?\d{5}\s+(.+)/)
    
    lead.fromAddress = this.extract(text, /Flyttar från:[\s\S]*?(.+)/)
    lead.fromPostcode = this.extract(text, /Flyttar från:[\s\S]*?(\d{5})/)
    lead.fromCity = this.extract(text, /Flyttar från:[\s\S]*?\d{5}\s+(.+)/)
    
    // Date
    lead.moveDate = this.extract(text, /Flyttdatum:\s*(.+)/)
    
    // Square meters
    lead.squareMeters = this.extractNumber(text, /Flyttar från kvadratmeter:\s*(\d+)/)
    
    // Lead ID if exists
    lead.leadId = this.extract(text, /Lead-ID:\s*(.+)/)
    lead.leadSource = 'email'
    
    return lead
  }

  parse(text: string): ParsedLead {
    let parsed: ParsedLead = {}
    
    // Detect format and parse accordingly
    if (text.includes('flyttfirma24.se') || text.includes('Lead ID:')) {
      parsed = this.parseFlyttfirma24(text)
    } else if (text.includes('Domän') && text.includes('Flytta.se')) {
      parsed = this.parseFlyttaSe(text)
    } else {
      // Try simple format
      parsed = this.parseSimpleFormat(text)
    }
    
    // Clean up phone numbers
    if (parsed.phone) {
      parsed.phone = parsed.phone.replace(/[\s-]/g, '')
      if (!parsed.phone.startsWith('+46') && !parsed.phone.startsWith('0')) {
        parsed.phone = '0' + parsed.phone
      }
    }
    
    return parsed
  }

  // Fill missing data with defaults
  fillWithDefaults(parsed: ParsedLead): Required<ParsedLead> {
    return {
      ...LEAD_DEFAULTS,
      ...parsed,
      
      // Ensure required fields have values
      customerName: parsed.customerName || 'Okänd kund',
      email: parsed.email || '',
      phone: parsed.phone || '',
      fromAddress: parsed.fromAddress || '',
      toAddress: parsed.toAddress || '',
      moveDate: parsed.moveDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      
      // Calculate estimated volume if not provided
      estimatedVolume: parsed.estimatedVolume || 
        (parsed.squareMeters || LEAD_DEFAULTS.squareMeters) * 0.3,
    } as Required<ParsedLead>
  }
}
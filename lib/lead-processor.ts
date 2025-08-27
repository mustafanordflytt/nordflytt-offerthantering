import { LeadParser } from './lead-parser'

interface ProcessingResult {
  success: boolean
  bookingNumber?: string
  offerId?: string
  error?: string
  confidence?: 'high' | 'medium' | 'low'
}

export class LeadProcessor {
  private parser: LeadParser
  
  constructor() {
    this.parser = new LeadParser()
  }

  /**
   * Process a single lead automatically
   */
  async processLead(leadData: {
    id?: string
    text: string
    source?: string
  }): Promise<ProcessingResult> {
    try {
      // Parse the lead
      const parsedLead = this.parser.parse(leadData.text)
      
      // Check if we have minimum required data
      if (!parsedLead.customerName || (!parsedLead.phone && !parsedLead.email)) {
        return {
          success: false,
          error: 'Missing critical customer information'
        }
      }

      // Fill with defaults
      const completeLead = this.parser.fillWithDefaults(parsedLead)
      
      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low' = 'high'
      if (!parsedLead.squareMeters) confidence = 'medium'
      if (!parsedLead.fromAddress || !parsedLead.toAddress) confidence = 'low'

      // Call API to create offer with retry logic
      let response: Response | null = null
      let lastError: Error | null = null
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          
          response = await fetch(`${baseUrl}/api/leads/process-to-offer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              leadId: leadData.id,
              leadText: leadData.text
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
          })
          
          if (response.ok) break // Success, exit retry loop
          
          // If 4xx error, don't retry
          if (response.status >= 400 && response.status < 500) break
          
          lastError = new Error(`HTTP ${response.status}`)
        } catch (error: any) {
          lastError = error
          console.error(`Attempt ${attempt} failed:`, error)
          
          // Wait before retry (exponential backoff)
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          }
        }
      }

      if (!response || !response.ok) {
        const errorMessage = response 
          ? (await response.json()).details || `HTTP ${response.status}` 
          : lastError?.message || 'Failed to create offer'
        return {
          success: false,
          error: errorMessage
        }
      }

      const result = await response.json()
      
      return {
        success: true,
        bookingNumber: result.booking?.bookingNumber,
        offerId: result.booking?.id,
        confidence
      }
    } catch (error: any) {
      console.error('Lead processing error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  /**
   * Process multiple leads in batch
   */
  async processBatch(leadIds: string[]): Promise<{
    total: number
    successful: number
    failed: number
    results: ProcessingResult[]
  }> {
    try {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      const response = await fetch(`${baseUrl}/api/leads/process-to-offer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadIds,
          autoProcess: true
        })
      })

      if (!response.ok) {
        throw new Error('Batch processing failed')
      }

      const result = await response.json()
      
      return {
        total: result.processed,
        successful: result.successful,
        failed: result.failed,
        results: result.results
      }
    } catch (error: any) {
      console.error('Batch processing error:', error)
      return {
        total: leadIds.length,
        successful: 0,
        failed: leadIds.length,
        results: leadIds.map(id => ({
          success: false,
          error: error.message
        }))
      }
    }
  }

  /**
   * Check if a lead text has enough data for automatic processing
   */
  canAutoProcess(leadText: string): boolean {
    const parsed = this.parser.parse(leadText)
    
    // Must have name and contact
    if (!parsed.customerName) return false
    if (!parsed.phone && !parsed.email) return false
    
    // Should have at least one address
    if (!parsed.fromAddress && !parsed.toAddress) return false
    
    return true
  }

  /**
   * Get estimated price range when confidence is low
   */
  getEstimatedPriceRange(parsedLead: any): { min: number, max: number } {
    const basePrice = 3500 // Minimum price
    
    // Estimate based on available data
    const roomFactor = (parsedLead.rooms || 2) * 1000
    const distanceFactor = 500 // Default distance cost
    
    const estimated = basePrice + roomFactor + distanceFactor
    
    return {
      min: Math.round(estimated * 0.8),
      max: Math.round(estimated * 1.2)
    }
  }
}

// Export singleton instance
export const leadProcessor = new LeadProcessor()
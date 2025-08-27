interface JobData {
  serviceType: 'moving' | 'cleaning' | 'packing'
  services: string[]
  specialRequirements: string[]
  volume?: number
  boxCount?: number
  locationInfo: {
    parkingDistance: number
    elevator: boolean
    elevatorStatus: string
    floor: number
  }
  teamMembers: string[]
  estimatedHours: number
}

interface SmartRecommendation {
  id: string
  name: string
  price: number
  unit?: string
  description: string
  category: string
  quantity: number
  totalPrice: number
  reasoning: string
  priority: 'high' | 'medium' | 'low'
  autoAdd: boolean
}

export class SmartPricingEngine {
  static generateRecommendations(jobData: JobData): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []

    // Automatic parking distance calculation
    if (jobData.locationInfo.parkingDistance > 5) {
      const extraDistance = jobData.locationInfo.parkingDistance - 5
      recommendations.push({
        id: 'auto-parking-distance',
        name: 'Extra parkeringsavstånd',
        price: 99,
        unit: 'per meter',
        description: `Tillägg för parkering över 5 meter (${jobData.locationInfo.parkingDistance}m total)`,
        category: 'platsforhallanden',
        quantity: extraDistance,
        totalPrice: extraDistance * 99,
        reasoning: `Parkering är ${jobData.locationInfo.parkingDistance}m från dörr, vilket överstiger de 5m som ingår`,
        priority: 'high',
        autoAdd: true
      })
    }

    // Elevator and floor-based recommendations
    if (!jobData.locationInfo.elevator && jobData.locationInfo.floor > 2) {
      recommendations.push({
        id: 'auto-stairs-surcharge',
        name: 'Trappbärning tillägg',
        price: 500,
        unit: 'fast avgift',
        description: `Tillägg för trappbärning till våning ${jobData.locationInfo.floor} utan hiss`,
        category: 'platsforhallanden',
        quantity: 1,
        totalPrice: 500,
        reasoning: `Ingen hiss tillgänglig och måste bära till våning ${jobData.locationInfo.floor}`,
        priority: 'high',
        autoAdd: true
      })
    }

    if (jobData.locationInfo.elevatorStatus !== 'Fungerar' && jobData.locationInfo.elevator) {
      recommendations.push({
        id: 'auto-broken-elevator',
        name: 'Trasig hiss tillägg',
        price: 300,
        unit: 'fast avgift',
        description: `Tillägg då hiss inte fungerar (${jobData.locationInfo.elevatorStatus})`,
        category: 'platsforhallanden',
        quantity: 1,
        totalPrice: 300,
        reasoning: `Hiss är markerad som "${jobData.locationInfo.elevatorStatus}" vilket innebär trappbärning`,
        priority: 'high',
        autoAdd: true
      })
    }

    // Smart material recommendations based on volume and service type
    if (jobData.volume) {
      // Box calculation: roughly 3-4 boxes per m³ for moving
      const estimatedBoxes = Math.ceil(jobData.volume * 3.5)
      if (estimatedBoxes > (jobData.boxCount || 0)) {
        const extraBoxes = estimatedBoxes - (jobData.boxCount || 0)
        recommendations.push({
          id: 'auto-extra-boxes',
          name: 'Extra flyttkartonger',
          price: 79,
          unit: 'st',
          description: `Beräknade extra kartonger baserat på volym (${jobData.volume}m³)`,
          category: 'material',
          quantity: extraBoxes,
          totalPrice: extraBoxes * 79,
          reasoning: `Baserat på ${jobData.volume}m³ behövs ca ${estimatedBoxes} kartonger totalt`,
          priority: 'medium',
          autoAdd: false
        })
      }

      // Packing tape recommendation
      const tapeRolls = Math.ceil(estimatedBoxes / 15) // 1 roll per 15 boxes
      recommendations.push({
        id: 'auto-packing-tape',
        name: 'Packtejp',
        price: 99,
        unit: 'st',
        description: `Tejprullar för att säkra ${estimatedBoxes} kartonger`,
        category: 'material',
        quantity: tapeRolls,
        totalPrice: tapeRolls * 99,
        reasoning: `Beräknat ${tapeRolls} rullar tejp för ${estimatedBoxes} kartonger`,
        priority: 'low',
        autoAdd: false
      })
    }

    // Special requirements-based recommendations
    if (jobData.specialRequirements.includes('Piano')) {
      recommendations.push({
        id: 'auto-piano-protection',
        name: 'Piano specialemballering',
        price: 800,
        unit: 'fast avgift',
        description: 'Specialemballering och extra försiktighetsåtgärder för piano',
        category: 'packning',
        quantity: 1,
        totalPrice: 800,
        reasoning: 'Piano kräver specialemballering och extra försiktighet',
        priority: 'high',
        autoAdd: false
      })
    }

    if (jobData.specialRequirements.includes('Stora möbler')) {
      recommendations.push({
        id: 'auto-furniture-protection',
        name: 'Möbelskydd extra',
        price: 200,
        unit: 'per möbel',
        description: 'Extra skydd för stora och ömtåliga möbler',
        category: 'packning',
        quantity: 2, // Estimate 2 large furniture pieces
        totalPrice: 400,
        reasoning: 'Stora möbler behöver extra skydd och försiktighet',
        priority: 'medium',
        autoAdd: false
      })
    }

    // Service-based recommendations
    if (jobData.services.some(s => s.toLowerCase().includes('städ'))) {
      recommendations.push({
        id: 'auto-cleaning-materials',
        name: 'Städmaterial tillägg',
        price: 200,
        unit: 'fast avgift',
        description: 'Extra städmaterial för grundlig slutstädning',
        category: 'städ',
        quantity: 1,
        totalPrice: 200,
        reasoning: 'Städservice inkluderad - extra material kan behövas',
        priority: 'low',
        autoAdd: false
      })
    }

    // Time-based recommendations
    if (jobData.estimatedHours > 8) {
      recommendations.push({
        id: 'auto-overtime-materials',
        name: 'Extra förbruksmaterial',
        price: 150,
        unit: 'fast avgift',
        description: 'Extra material för långa uppdrag (+8h)',
        category: 'material',
        quantity: 1,
        totalPrice: 150,
        reasoning: `Uppdrag över 8h (${jobData.estimatedHours}h) kan kräva extra förbruksmaterial`,
        priority: 'low',
        autoAdd: false
      })
    }

    // Team size-based recommendations
    if (jobData.teamMembers.length >= 3) {
      recommendations.push({
        id: 'auto-coordination-fee',
        name: 'Teamkoordination tillägg',
        price: 300,
        unit: 'fast avgift',
        description: `Koordinationstillägg för stort team (${jobData.teamMembers.length} personer)`,
        category: 'tunga-lyft',
        quantity: 1,
        totalPrice: 300,
        reasoning: `Team med ${jobData.teamMembers.length} personer kräver extra koordination`,
        priority: 'medium',
        autoAdd: false
      })
    }

    return recommendations.sort((a, b) => {
      // Sort by: autoAdd first, then by priority, then by total price
      if (a.autoAdd !== b.autoAdd) return a.autoAdd ? -1 : 1
      
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      return b.totalPrice - a.totalPrice
    })
  }

  static calculateAutoAddTotal(recommendations: SmartRecommendation[]): number {
    return recommendations
      .filter(r => r.autoAdd)
      .reduce((sum, r) => sum + r.totalPrice, 0)
  }

  static getRecommendationSummary(recommendations: SmartRecommendation[]): string {
    const autoAdd = recommendations.filter(r => r.autoAdd)
    const suggested = recommendations.filter(r => !r.autoAdd)
    
    let summary = ''
    
    if (autoAdd.length > 0) {
      const autoTotal = autoAdd.reduce((sum, r) => sum + r.totalPrice, 0)
      summary += `🔄 ${autoAdd.length} automatiska tillägg: +${autoTotal.toLocaleString()} kr\n`
    }
    
    if (suggested.length > 0) {
      const suggestedTotal = suggested.reduce((sum, r) => sum + r.totalPrice, 0)
      summary += `💡 ${suggested.length} förslag: +${suggestedTotal.toLocaleString()} kr möjligt`
    }
    
    return summary || 'Inga automatiska tillägg eller förslag'
  }
}
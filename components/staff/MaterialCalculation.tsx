'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, Package, SprayCanIcon as Spray, Truck, AlertTriangle } from 'lucide-react'

interface MaterialCalculationProps {
  serviceType: string
  jobData: any
  onCalculationUpdate?: (materials: any, cost: number) => void
}

interface MaterialItem {
  name: string
  quantity: number
  unitPrice: number
  unit: string
  icon: string
}

export default function MaterialCalculation({ serviceType, jobData, onCalculationUpdate }: MaterialCalculationProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  // Prissättning från CLAUDE.md
  const PRICING = {
    // Packhjälp material
    boxes: 79,              // flyttkartonger
    tape: 99,               // packtejp per rulle
    plasticBags: 20,        // plastpåsar per styck
    bubbleWrap: 149,        // bubbelplast per rulle
    
    // Städning material  
    cleaningKit: 299,       // städkit (engångskostnad)
    chemicals: 199,         // kemikalier per städning
    mops: 89,              // moppar och trasor
    
    // Flytt tillägg
    movingBlankets: 129,    // flyttfiltar per styck
    straps: 79,             // spännband per set
    dolly: 299,             // pirra (engångskostnad)
    
    // Extra avgifter
    volumeAdjustment: 240,  // kr/m³ efter RUT-avdrag
    parkingDistance: 99,    // kr/meter över 5m
    stairs: {
      noElevator: 500,      // fast avgift våning 3+
      brokenElevator: 300   // trasig hiss
    }
  }

  useEffect(() => {
    calculateMaterials()
  }, [serviceType, jobData])

  const calculateMaterials = () => {
    let calculatedMaterials: MaterialItem[] = []
    
    switch (serviceType) {
      case 'Packhjälp':
        const boxCount = jobData.boxCount || Math.ceil((jobData.volume || 50) / 2)
        const tapeRolls = Math.ceil(boxCount / 25) // 1 rulle per 25 kartonger
        const plasticBags = Math.ceil((jobData.volume || 50) / 10) // 1 påse per 10 m³
        const bubbleWrap = jobData.fragileItems ? Math.ceil((jobData.volume || 50) / 20) : 0
        
        calculatedMaterials = [
          { name: 'Flyttkartonger', quantity: boxCount, unitPrice: PRICING.boxes, unit: 'st', icon: '📦' },
          { name: 'Packtejp', quantity: tapeRolls, unitPrice: PRICING.tape, unit: 'rulle', icon: '🎞️' },
          { name: 'Plastpåsar', quantity: plasticBags, unitPrice: PRICING.plasticBags, unit: 'st', icon: '🛍️' },
          ...(bubbleWrap > 0 ? [{ name: 'Bubbelplast', quantity: bubbleWrap, unitPrice: PRICING.bubbleWrap, unit: 'rulle', icon: '🫧' }] : [])
        ]
        break
        
      case 'Flyttstädning':
        const roomCount = jobData.roomCount || 5
        const sqm = jobData.sqm || 75
        const deepClean = jobData.deepClean || false
        
        calculatedMaterials = [
          { name: 'Städkit', quantity: 1, unitPrice: PRICING.cleaningKit, unit: 'set', icon: '🧹' },
          { name: 'Kemikalier', quantity: Math.ceil(sqm / 50), unitPrice: PRICING.chemicals, unit: 'set', icon: '🧪' },
          { name: 'Moppar & trasor', quantity: Math.ceil(roomCount / 3), unitPrice: PRICING.mops, unit: 'set', icon: '🧽' },
          ...(deepClean ? [{ name: 'Specialrengöring', quantity: 1, unitPrice: 299, unit: 'tillägg', icon: '✨' }] : [])
        ]
        break
        
      case 'Flytt':
        const volume = jobData.volume || 50
        const heavyItems = jobData.heavyItems || 0
        const floors = jobData.locationInfo?.floor || 1
        const hasElevator = jobData.locationInfo?.elevator || false
        const parkingDistance = jobData.locationInfo?.parkingDistance || 0
        
        calculatedMaterials = [
          { name: 'Flyttfiltar', quantity: Math.ceil(volume / 15), unitPrice: PRICING.movingBlankets, unit: 'st', icon: '🛡️' },
          { name: 'Spännband', quantity: Math.ceil(volume / 25), unitPrice: PRICING.straps, unit: 'set', icon: '🔗' },
          ...(heavyItems > 0 ? [{ name: 'Pirra', quantity: 1, unitPrice: PRICING.dolly, unit: 'st', icon: '🛒' }] : [])
        ]
        
        // Lägg till extra avgifter
        if (floors > 2 && !hasElevator) {
          calculatedMaterials.push({
            name: 'Trappbärning (ingen hiss)',
            quantity: 1,
            unitPrice: PRICING.stairs.noElevator,
            unit: 'tillägg',
            icon: '🏃'
          })
        }
        
        if (parkingDistance > 5) {
          const extraMeters = parkingDistance - 5
          calculatedMaterials.push({
            name: `Lång bärväg (${parkingDistance}m)`,
            quantity: extraMeters,
            unitPrice: PRICING.parkingDistance,
            unit: 'm',
            icon: '🚶'
          })
        }
        break
        
      default:
        // Kontorsflytt eller annan tjänst
        calculatedMaterials = [
          { name: 'Flyttkartonger', quantity: 20, unitPrice: PRICING.boxes, unit: 'st', icon: '📦' },
          { name: 'Etiketter', quantity: 5, unitPrice: 39, unit: 'ark', icon: '🏷️' }
        ]
    }
    
    // Beräkna total kostnad
    const total = calculatedMaterials.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    
    setMaterials(calculatedMaterials)
    setTotalCost(total)
    
    // Callback för att uppdatera parent component
    if (onCalculationUpdate) {
      onCalculationUpdate(calculatedMaterials, total)
    }
  }

  // Om ingen data, visa placeholder
  if (!jobData || materials.length === 0) {
    return null
  }

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-orange-600">📦</span>
          <span className="text-sm font-medium text-orange-800">Material</span>
        </div>
        <button 
          className="text-xs text-orange-600 hover:text-orange-700"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Dölj' : 'Detaljer'}
        </button>
      </div>
      
      {/* Kompakt sammanfattning */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3">
          {materials.slice(0, 2).map((item, index) => (
            <span key={index} className="text-orange-700">
              {item.icon} {item.quantity} {item.unit}
            </span>
          ))}
          {materials.length > 2 && (
            <span className="text-orange-600">+{materials.length - 2}</span>
          )}
        </div>
        <span className="font-medium text-orange-800">
          ~{totalCost.toLocaleString('sv-SE')} kr
        </span>
      </div>
      
      {/* Detaljerad lista - visas vid klick */}
      {showDetails && (
        <div className="border-t border-orange-200 pt-3 mt-3 space-y-2">
          {materials.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-gray-600">{item.quantity} {item.unit}</span>
                <span className="font-medium text-orange-700">
                  {(item.quantity * item.unitPrice).toLocaleString('sv-SE')} kr
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
        {/* Varning om höga kostnader - bara i detaljvy */}
        {totalCost > 5000 && (
          <div className="flex items-center space-x-2 mt-2 text-sm text-orange-600 bg-orange-100 p-2 rounded">
            <AlertTriangle className="h-4 w-4" />
            <span>Hög materialkostnad - informera kunden</span>
          </div>
        )}
    </div>
  )
}
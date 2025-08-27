'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Plus, X, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { SmartPricingEngine } from '@/lib/smart-pricing'

interface SmartPricingWidgetProps {
  jobData: any
  onRecommendationAccept?: (recommendation: any) => void
  onRecommendationReject?: (recommendation: any) => void
}

export default function SmartPricingWidget({ jobData, onRecommendationAccept, onRecommendationReject }: SmartPricingWidgetProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [acceptedIds, setAcceptedIds] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (jobData) {
      const smartRecommendations = SmartPricingEngine.generateRecommendations(jobData)
      setRecommendations(smartRecommendations)
    }
  }, [jobData])

  const handleAccept = (recommendation: any) => {
    setAcceptedIds(prev => [...prev, recommendation.id])
    if (onRecommendationAccept) {
      onRecommendationAccept(recommendation)
    }
  }

  const handleReject = (recommendation: any) => {
    setDismissedIds(prev => [...prev, recommendation.id])
    if (onRecommendationReject) {
      onRecommendationReject(recommendation)
    }
  }

  const visibleRecommendations = recommendations.filter(rec => 
    !dismissedIds.includes(rec.id) && !acceptedIds.includes(rec.id)
  )

  const totalSuggestedValue = visibleRecommendations.reduce((sum, rec) => sum + rec.totalPrice, 0)

  if (recommendations.length === 0) {
    return null
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Smart Prissättning</h3>
          {visibleRecommendations.length > 0 && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
              {visibleRecommendations.length} förslag
            </Badge>
          )}
        </div>
        {totalSuggestedValue > 0 && (
          <div className="text-right">
            <div className="text-sm text-purple-600">Potential intäkt:</div>
            <div className="font-bold text-purple-800">
              +{totalSuggestedValue.toLocaleString('sv-SE')} kr
            </div>
          </div>
        )}
      </div>

      {/* Auto-added items först */}
      {recommendations.filter(rec => rec.autoAdd && !dismissedIds.includes(rec.id)).map(recommendation => (
        <div key={recommendation.id} className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">{recommendation.name}</span>
                <Badge className="bg-green-100 text-green-700 text-xs">Auto-tillagd</Badge>
              </div>
              <p className="text-sm text-green-700 mb-1">{recommendation.description}</p>
              <p className="text-xs text-green-600 italic">{recommendation.reasoning}</p>
            </div>
            <div className="text-right ml-4">
              <div className="font-bold text-green-800">
                {recommendation.totalPrice.toLocaleString('sv-SE')} kr
              </div>
              <div className="text-xs text-green-600">
                {recommendation.quantity} × {recommendation.price} kr
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Förslag som behöver godkännande */}
      {visibleRecommendations.filter(rec => !rec.autoAdd).slice(0, showAll ? undefined : 2).map(recommendation => (
        <div key={recommendation.id} className="mb-3 p-3 bg-white border border-purple-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {recommendation.priority === 'high' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                {recommendation.priority === 'medium' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                {recommendation.priority === 'low' && <Plus className="h-4 w-4 text-gray-500" />}
                <span className="font-medium text-gray-800">{recommendation.name}</span>
                <Badge className={`text-xs ${
                  recommendation.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  recommendation.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {recommendation.priority === 'high' ? 'Viktigt' : 
                   recommendation.priority === 'medium' ? 'Rekommenderat' : 'Valfritt'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">{recommendation.description}</p>
              <p className="text-xs text-gray-500 italic">{recommendation.reasoning}</p>
            </div>
            <div className="text-right ml-4">
              <div className="font-bold text-gray-800 mb-2">
                {recommendation.totalPrice.toLocaleString('sv-SE')} kr
              </div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(recommendation)}
                  className="h-8 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(recommendation)}
                  className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Lägg till
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Visa fler-knapp */}
      {visibleRecommendations.filter(rec => !rec.autoAdd).length > 2 && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          Visa {visibleRecommendations.filter(rec => !rec.autoAdd).length - 2} fler förslag
        </Button>
      )}

      {/* Feedback om accepterade/avvisade */}
      {(acceptedIds.length > 0 || dismissedIds.length > 0) && (
        <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-purple-600">
          {acceptedIds.length > 0 && (
            <span>✅ {acceptedIds.length} tillägg accepterade</span>
          )}
          {acceptedIds.length > 0 && dismissedIds.length > 0 && <span className="mx-2">•</span>}
          {dismissedIds.length > 0 && (
            <span>❌ {dismissedIds.length} förslag avvisade</span>
          )}
        </div>
      )}
    </Card>
  )
}
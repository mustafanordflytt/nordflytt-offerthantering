'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Camera, 
  Check, 
  X,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Clock,
  MapPin
} from 'lucide-react'
import { cameraHandler } from '../../app/staff/utils/serviceSpecific'

interface ChecklistItem {
  id: string
  category: string
  name: string
  isDone: boolean
  photoUri?: string
  photoTimestamp?: string
  notes?: string
  required: boolean
}

interface CleaningChecklistProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  customerName: string
  address: string
}

// 40-punkts checklista grupperad efter rum
const checklistData: Record<string, ChecklistItem[]> = {
  'Kök': [
    { id: 'kok_1', category: 'Kök', name: 'Spis och ugn rengjord in- och utvändigt', isDone: false, required: true },
    { id: 'kok_2', category: 'Kök', name: 'Köksfläkt och filter rengjort', isDone: false, required: true },
    { id: 'kok_3', category: 'Kök', name: 'Kyl och frys rengjort', isDone: false, required: true },
    { id: 'kok_4', category: 'Kök', name: 'Diskbänk och kranar putsade', isDone: false, required: true },
    { id: 'kok_5', category: 'Kök', name: 'Skåp avtorkade in- och utvändigt', isDone: false, required: false },
    { id: 'kok_6', category: 'Kök', name: 'Kakel/stänkskydd rengjort', isDone: false, required: true },
  ],
  'Badrum': [
    { id: 'bad_1', category: 'Badrum', name: 'Toalett grundligt rengjord', isDone: false, required: true },
    { id: 'bad_2', category: 'Badrum', name: 'Badkar/dusch och kakel skrubat', isDone: false, required: true },
    { id: 'bad_3', category: 'Badrum', name: 'Handfat och kranar putsade', isDone: false, required: true },
    { id: 'bad_4', category: 'Badrum', name: 'Spegel putsad', isDone: false, required: true },
    { id: 'bad_5', category: 'Badrum', name: 'Golvbrunn rengjord', isDone: false, required: true },
    { id: 'bad_6', category: 'Badrum', name: 'Badrumsskåp avtorkade', isDone: false, required: false },
    { id: 'bad_7', category: 'Badrum', name: 'Ventiler rengjorda', isDone: false, required: false },
  ],
  'Vardagsrum': [
    { id: 'vrum_1', category: 'Vardagsrum', name: 'Element rengjorda', isDone: false, required: true },
    { id: 'vrum_2', category: 'Vardagsrum', name: 'Fönster putsade invändigt', isDone: false, required: true },
    { id: 'vrum_3', category: 'Vardagsrum', name: 'Fönsterkarmar avtorkade', isDone: false, required: false },
    { id: 'vrum_4', category: 'Vardagsrum', name: 'Dörrkarmar avtorkade', isDone: false, required: false },
    { id: 'vrum_5', category: 'Vardagsrum', name: 'Eluttag och strömbrytare rengjorda', isDone: false, required: true },
    { id: 'vrum_6', category: 'Vardagsrum', name: 'Golvlister avtorkade', isDone: false, required: false },
  ],
  'Sovrum': [
    { id: 'sov_1', category: 'Sovrum', name: 'Garderober avtorkade invändigt', isDone: false, required: false },
    { id: 'sov_2', category: 'Sovrum', name: 'Element rengjorda', isDone: false, required: true },
    { id: 'sov_3', category: 'Sovrum', name: 'Fönster putsade invändigt', isDone: false, required: true },
    { id: 'sov_4', category: 'Sovrum', name: 'Eluttag och strömbrytare rengjorda', isDone: false, required: true },
    { id: 'sov_5', category: 'Sovrum', name: 'Dörrhandtag rengjorda', isDone: false, required: false },
  ],
  'Allmänt': [
    { id: 'allm_1', category: 'Allmänt', name: 'Alla golv dammsuget/våttorkat', isDone: false, required: true },
    { id: 'allm_2', category: 'Allmänt', name: 'Dörrar avtorkade', isDone: false, required: false },
    { id: 'allm_3', category: 'Allmänt', name: 'Lampor/armaturer dammade', isDone: false, required: false },
    { id: 'allm_4', category: 'Allmänt', name: 'Tak dammade (vid behov)', isDone: false, required: false },
    { id: 'allm_5', category: 'Allmänt', name: 'Väggar avtorkade (fläckar)', isDone: false, required: false },
    { id: 'allm_6', category: 'Allmänt', name: 'Sopor borttagna', isDone: false, required: true },
    { id: 'allm_7', category: 'Allmänt', name: 'Förråd/balkong städat', isDone: false, required: false },
    { id: 'allm_8', category: 'Allmänt', name: 'Tvättmaskin/torktumlare rengjord', isDone: false, required: false },
    { id: 'allm_9', category: 'Allmänt', name: 'Trapphus städat (om inkluderat)', isDone: false, required: false },
    { id: 'allm_10', category: 'Allmänt', name: 'Källare/vind städat (om inkluderat)', isDone: false, required: false },
  ]
}

export default function CleaningChecklist({ isOpen, onClose, jobId, customerName, address }: CleaningChecklistProps) {
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem[]>>({})
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [isTakingPhoto, setIsTakingPhoto] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)

  // Initialize checklist from localStorage or default data
  useEffect(() => {
    if (isOpen) {
      const savedChecklist = localStorage.getItem(`cleaning_checklist_${jobId}`)
      if (savedChecklist) {
        setChecklist(JSON.parse(savedChecklist))
      } else {
        setChecklist(checklistData)
      }
      // Expand first category by default
      setExpandedCategories(['Kök'])
    }
  }, [isOpen, jobId])

  // Calculate progress
  useEffect(() => {
    const allItems = Object.values(checklist).flat()
    const completedItems = allItems.filter(item => item.isDone).length
    const progress = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0
    setOverallProgress(progress)
  }, [checklist])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleItem = (category: string, itemId: string) => {
    setChecklist(prev => {
      const updated = { ...prev }
      updated[category] = updated[category].map(item => 
        item.id === itemId ? { ...item, isDone: !item.isDone } : item
      )
      // Save to localStorage
      localStorage.setItem(`cleaning_checklist_${jobId}`, JSON.stringify(updated))
      return updated
    })
  }

  const updateItemNotes = (category: string, itemId: string, notes: string) => {
    setChecklist(prev => {
      const updated = { ...prev }
      updated[category] = updated[category].map(item => 
        item.id === itemId ? { ...item, notes } : item
      )
      localStorage.setItem(`cleaning_checklist_${jobId}`, JSON.stringify(updated))
      return updated
    })
  }

  const handleTakePhoto = async (category: string, itemId: string, itemName: string) => {
    setIsTakingPhoto(true)
    try {
      const success = await cameraHandler('Städning', `${category} - ${itemName}`)
      
      if (success) {
        // Get the latest photo from localStorage
        const photos = JSON.parse(localStorage.getItem('staff_photos') || '[]')
        const latestPhoto = photos[photos.length - 1]
        
        if (latestPhoto) {
          setChecklist(prev => {
            const updated = { ...prev }
            updated[category] = updated[category].map(item => 
              item.id === itemId 
                ? { 
                    ...item, 
                    photoUri: latestPhoto.dataUrl,
                    photoTimestamp: latestPhoto.timestamp
                  } 
                : item
            )
            localStorage.setItem(`cleaning_checklist_${jobId}`, JSON.stringify(updated))
            return updated
          })
        }
      }
    } finally {
      setIsTakingPhoto(false)
    }
  }

  const getCategoryProgress = (category: string) => {
    const items = checklist[category] || []
    const completed = items.filter(item => item.isDone).length
    return items.length > 0 ? Math.round((completed / items.length) * 100) : 0
  }

  const getCategoryStatus = (category: string) => {
    const progress = getCategoryProgress(category)
    if (progress === 100) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    if (progress > 0) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b bg-green-50">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <span className="text-2xl">🧹</span>
              <div>
                <div className="text-xl font-bold text-green-800">
                  Flyttstädning - 40-punkts checklista
                </div>
                <div className="text-sm text-green-600 mt-1">
                  {customerName} • {address}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-green-700">Total progress</span>
              <span className="font-bold text-green-800">{overallProgress}%</span>
            </div>
            <div className="w-full bg-green-100 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.entries(checklist).map(([category, items]) => {
            const isExpanded = expandedCategories.includes(category)
            const categoryStatus = getCategoryStatus(category)
            const progress = getCategoryProgress(category)

            return (
              <Card key={category} className={`${categoryStatus.border} ${categoryStatus.bg}`}>
                <CardContent className="p-0">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">
                        {category === 'Kök' ? '🍳' :
                         category === 'Badrum' ? '🚿' :
                         category === 'Vardagsrum' ? '🛋️' :
                         category === 'Sovrum' ? '🛏️' : '🏠'}
                      </span>
                      <h3 className={`font-semibold text-lg ${categoryStatus.color}`}>
                        {category}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {items.filter(i => i.isDone).length}/{items.length}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium">{progress}%</div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="border-t">
                      {items.map((item, idx) => (
                        <div 
                          key={item.id} 
                          className={`p-4 border-b last:border-b-0 ${
                            item.isDone ? 'bg-green-50/50' : 'bg-white'
                          }`}
                        >
                          {/* Item Header */}
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={item.isDone}
                              onChange={() => toggleItem(category, item.id)}
                              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <label className={`text-base ${item.isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {item.name}
                                {item.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              
                              {/* Photo and Notes Section */}
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTakePhoto(category, item.id, item.name)}
                                    disabled={isTakingPhoto}
                                    className="h-9"
                                  >
                                    <Camera className="h-4 w-4 mr-1" />
                                    {item.photoUri ? 'Byt foto' : 'Ta foto'}
                                  </Button>
                                  
                                  {item.photoUri && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Check className="h-3 w-3 mr-1" />
                                      Foto taget {item.photoTimestamp}
                                    </Badge>
                                  )}
                                </div>

                                {/* Notes Input */}
                                <Input
                                  placeholder="Lägg till kommentar..."
                                  value={item.notes || ''}
                                  onChange={(e) => updateItemNotes(category, item.id, e.target.value)}
                                  className="h-9 text-sm"
                                />

                                {/* Photo Preview */}
                                {item.photoUri && (
                                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                    <img 
                                      src={item.photoUri} 
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Instruktioner:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Markera varje punkt som utförd när den är klar</li>
                    <li>Ta foto för att dokumentera viktiga moment</li>
                    <li>Punkter markerade med * är obligatoriska</li>
                    <li>Lägg till kommentarer vid behov</li>
                    <li>Checklistan sparas automatiskt</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <Clock className="h-4 w-4 inline mr-1" />
              Senast uppdaterad: {new Date().toLocaleString('sv-SE')}
            </div>
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              Stäng checklista
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Phone, Shield, X, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SOSConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (type: string) => void
}

export default function SOSConfirmModal({ isOpen, onClose, onConfirm }: SOSConfirmModalProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [isConfirming, setIsConfirming] = useState(false)

  const emergencyTypes = [
    {
      id: 'medical',
      icon: '🏥',
      title: 'Medicinsk nödsituation',
      description: 'Allvarlig skada eller sjukdom',
      actions: ['Ambulans kontaktas', 'Driftledare notifieras', 'GPS-position delas']
    },
    {
      id: 'security',
      icon: '🚨',
      title: 'Säkerhetshot',
      description: 'Hot eller våld mot personal',
      actions: ['Polis kontaktas', 'Säkerhetsteam notifieras', 'Plats säkras']
    },
    {
      id: 'safety',
      icon: '⚠️',
      title: 'Arbetsmiljörisk',
      description: 'Farlig situation på arbetsplatsen',
      actions: ['Driftledare notifieras', 'Arbetet stoppas', 'Incident rapporteras']
    },
    {
      id: 'technical',
      icon: '🔧',
      title: 'Teknisk nödsituation',
      description: 'Allvarligt tekniskt fel',
      actions: ['Teknisk support kontaktas', 'Backup-plan aktiveras']
    }
  ]

  const handleConfirm = async () => {
    if (!selectedType) return
    
    setIsConfirming(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    onConfirm(selectedType)
    setIsConfirming(false)
    setSelectedType('')
    onClose()
  }

  const handleClose = () => {
    if (!isConfirming) {
      setSelectedType('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <span>SOS - Nödläge</span>
          </DialogTitle>
          <DialogDescription>
            Välj typ av nödsituation. Detta kommer omedelbart notifiera relevant personal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {emergencyTypes.map((type) => (
            <div
              key={type.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedType === type.id
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{type.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Vad händer när du trycker:</p>
                    {type.actions.map((action, index) => (
                      <div key={index} className="flex items-center space-x-1 text-xs text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedType && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Viktigt:</strong> Använd endast SOS-funktionen vid verkliga nödsituationer. 
              Alla larm loggas och följs upp.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isConfirming}
            className="flex-1 h-11"
          >
            <X className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedType || isConfirming}
            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white"
          >
            {isConfirming ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Skickar nödlarm...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Skicka nödlarm
              </>
            )}
          </Button>
        </div>

        {/* Emergency Contact Info */}
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-gray-500">
            Vid akut fara - ring alltid <strong>112</strong> direkt
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
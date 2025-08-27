'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  AlertTriangle, 
  XCircle, 
  Archive, 
  Shield, 
  Calendar, 
  Clock, 
  Trash2,
  RotateCcw,
  FileText,
  Truck,
  Smartphone,
  Key,
  Shirt,
  Package,
  CheckCircle,
  AlertCircle,
  Lock,
  UserMinus,
  RefreshCw,
  Car
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OffboardingTabProps {
  staff: any
  setStaff: (staff: any) => void
}

export default function OffboardingTab({ staff, setStaff }: OffboardingTabProps) {
  const { toast } = useToast()
  const [terminationReason, setTerminationReason] = useState('')
  const [terminationType, setTerminationType] = useState('')
  const [lastWorkingDay, setLastWorkingDay] = useState('')
  const [notes, setNotes] = useState('')
  const [returnChecklist, setReturnChecklist] = useState({
    workClothes: false,
    safetyEquipment: false,
    tools: false,
    techEquipment: false,
    documents: false,
    keys: false
  })
  const [isTerminating, setIsTerminating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const terminationTypes = [
    { value: 'resignation', label: 'Egen uppsägning', color: 'blue' },
    { value: 'termination', label: 'Uppsägning av arbetsgivare', color: 'red' },
    { value: 'mutual', label: 'Ömsesidig överenskommelse', color: 'green' },
    { value: 'end_contract', label: 'Projektslut/Kontraktsslut', color: 'orange' },
    { value: 'probation', label: 'Provanställning ej godkänd', color: 'purple' }
  ]

  const assetCategories = [
    {
      key: 'workClothes',
      label: 'Arbetskläder',
      icon: Shirt,
      items: ['T-shirt Nordflytt', 'Fleece-jacka', 'Reflexväst', 'Arbetsbyxor', 'Vinterjacka', 'Mössa'],
      critical: false
    },
    {
      key: 'safetyEquipment', 
      label: 'Skyddsutrustning',
      icon: Shield,
      items: ['Arbetshandskar', 'Ryggskydd/Bälte', 'Säkerhetsskor', 'Hjälm', 'Knäskydd'],
      critical: true
    },
    {
      key: 'tools',
      label: 'Verktyg',
      icon: Package,
      items: ['Skruvmejsel-set', 'Nyckelset', 'Måttband', 'Bärrem', 'Verktygslåda'],
      critical: false
    },
    {
      key: 'techEquipment',
      label: 'Teknik',
      icon: Smartphone,
      items: ['Staff App-telefon', 'Laddare USB-C', 'Hörlurar', 'Powerbank', 'Bilhållare'],
      critical: true
    },
    {
      key: 'documents',
      label: 'Dokument',
      icon: FileText,
      items: ['ID-kort', 'Nycklar', 'Anställningsbevis', 'Utbildningscertifikat'],
      critical: true
    },
    {
      key: 'keys',
      label: 'Åtkomst',
      icon: Key,
      items: ['Fordonskoder', 'App-åtkomst', 'System-behörigheter', 'Fysiska nycklar'],
      critical: true
    }
  ]

  const handleTerminateEmployee = async () => {
    if (!terminationType || !lastWorkingDay || !terminationReason) {
      toast({
        title: "⚠️ Ofullständig information",
        description: "Fyll i alla obligatoriska fält för uppsägningen.",
        variant: "destructive"
      })
      return
    }

    setIsTerminating(true)

    try {
      // Simulate API call for termination
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Execute automatic security measures
      const securityActions = [
        'Fordonskoder inaktiverade',
        'Staff App-åtkomst spärrad', 
        'System-behörigheter återkallade',
        'Framtida pass avbokade',
        'Personalfil arkiverad'
      ]

      // Update staff status
      const updatedStaff = {
        ...staff,
        status: 'uppsagd',
        terminationDate: lastWorkingDay,
        terminationType,
        terminationReason,
        terminationNotes: notes,
        returnChecklist,
        securityLockdown: true,
        lastModified: new Date().toISOString()
      }

      setStaff(updatedStaff)

      toast({
        title: "🔒 Uppsägning genomförd",
        description: `${staff.name} har sagts upp. Säkerhetsåtgärder aktiverade automatiskt.`
      })

      // Show security actions completed
      securityActions.forEach((action, index) => {
        setTimeout(() => {
          toast({
            title: `✅ ${action}`,
            description: "Säkerhetsåtgärd slutförd"
          })
        }, (index + 1) * 1000)
      })

    } catch (error) {
      toast({
        title: "❌ Fel vid uppsägning",
        description: "Kunde inte genomföra uppsägningen. Försök igen.",
        variant: "destructive"
      })
    } finally {
      setIsTerminating(false)
      setShowConfirmDialog(false)
    }
  }

  const handleRehire = async () => {
    try {
      const updatedStaff = {
        ...staff,
        status: 'aktiv',
        terminationDate: null,
        terminationType: null,
        terminationReason: null,
        securityLockdown: false,
        rehireDate: new Date().toISOString()
      }

      setStaff(updatedStaff)

      toast({
        title: "🔄 Återanställning genomförd",
        description: `${staff.name} är nu aktiv igen. Systembehörigheter återställda.`
      })

    } catch (error) {
      toast({
        title: "❌ Fel vid återanställning",
        description: "Kunde inte återanställa medarbetaren.",
        variant: "destructive"
      })
    }
  }

  const allAssetsReturned = Object.values(returnChecklist).every(Boolean)
  const criticalAssetsReturned = assetCategories
    .filter(cat => cat.critical)
    .every(cat => returnChecklist[cat.key as keyof typeof returnChecklist])

  if (staff.status === 'uppsagd') {
    return (
      <div className="space-y-6">
        {/* Terminated Status */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle className="text-red-800">Uppsagd Personal</CardTitle>
                <CardDescription className="text-red-600">
                  {staff.name} avslutade sin anställning {staff.terminationDate}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-red-700">Uppsägningstyp</Label>
                <Badge 
                  variant="secondary" 
                  className="mt-1 bg-red-100 text-red-800"
                >
                  {terminationTypes.find(t => t.value === staff.terminationType)?.label}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-red-700">Sista arbetsdag</Label>
                <p className="text-sm text-red-600 mt-1">{staff.terminationDate}</p>
              </div>
            </div>
            
            {staff.terminationReason && (
              <div>
                <Label className="text-sm font-medium text-red-700">Uppsägningsorsak</Label>
                <p className="text-sm text-red-600 mt-1">{staff.terminationReason}</p>
              </div>
            )}

            {staff.securityLockdown && (
              <div className="bg-red-100 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Säkerhetsspärrning Aktiv</span>
                </div>
                <ul className="text-xs text-red-600 space-y-1">
                  <li>• Fordonskoder inaktiverade</li>
                  <li>• Staff App-åtkomst spärrad</li>
                  <li>• System-behörigheter återkallade</li>
                  <li>• Framtida pass avbokade</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Checklist Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Återlämning av Tillgångar
            </CardTitle>
            <CardDescription>
              Status för återlämnade företagstillgångar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {assetCategories.map((category) => {
                const Icon = category.icon
                const isReturned = staff.returnChecklist?.[category.key]
                
                return (
                  <div key={category.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${category.critical ? 'text-red-500' : 'text-gray-500'}`} />
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <p className="text-xs text-gray-500">{category.items.length} föremål</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isReturned ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Återlämnad
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Väntar
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 text-center">
              {allAssetsReturned ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Alla tillgångar återlämnade
                </Badge>
              ) : criticalAssetsReturned ? (
                <Badge className="bg-orange-100 text-orange-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Kritiska tillgångar återlämnade
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Viktiga tillgångar saknas
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rehire Option */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <RotateCcw className="h-5 w-5" />
              Återanställning
            </CardTitle>
            <CardDescription>
              Återaktivera medarbetaren om omständigheterna ändrats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRehire}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Återanställ {staff.name}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Återställer alla behörigheter och åtkomst automatiskt
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Warning Header */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <CardTitle className="text-red-800">Varning: Offboarding-process</CardTitle>
              <CardDescription className="text-red-600">
                Denna åtgärd kommer att säga upp medarbetaren och aktivera säkerhetsåtgärder automatiskt
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Termination Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Uppsägningsformulär
          </CardTitle>
          <CardDescription>
            Fyll i all nödvändig information för uppsägningen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="termination-type">Uppsägningstyp *</Label>
              <Select value={terminationType} onValueChange={setTerminationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj uppsägningstyp" />
                </SelectTrigger>
                <SelectContent>
                  {terminationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="last-working-day">Sista arbetsdag *</Label>
              <Input
                id="last-working-day"
                type="date"
                value={lastWorkingDay}
                onChange={(e) => setLastWorkingDay(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="termination-reason">Uppsägningsorsak *</Label>
            <Textarea
              id="termination-reason"
              placeholder="Beskriv anledningen till uppsägningen..."
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Övriga anteckningar</Label>
            <Textarea
              id="notes"
              placeholder="Lägg till eventuella kommentarer eller instruktioner..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Asset Return Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Återlämning av Tillgångar
          </CardTitle>
          <CardDescription>
            Markera tillgångar som har återlämnats av medarbetaren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assetCategories.map((category) => {
              const Icon = category.icon
              const isChecked = returnChecklist[category.key as keyof typeof returnChecklist]
              
              return (
                <div key={category.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox 
                    checked={isChecked}
                    onCheckedChange={(checked) => 
                      setReturnChecklist(prev => ({ ...prev, [category.key]: checked }))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${category.critical ? 'text-red-500' : 'text-gray-500'}`} />
                      <Label className="font-medium">{category.label}</Label>
                      {category.critical && (
                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                          Kritisk
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Föremål: {category.items.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Automatic Security Measures */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Shield className="h-5 w-5" />
            Automatiska Säkerhetsåtgärder
          </CardTitle>
          <CardDescription className="text-orange-700">
            Följande åtgärder kommer att genomföras automatiskt vid uppsägning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Car, text: 'Inaktivera fordonskoder' },
              { icon: Smartphone, text: 'Spärra Staff App-åtkomst' },
              { icon: Lock, text: 'Återkalla systembehörigheter' },
              { icon: Calendar, text: 'Avboka framtida pass' },
              { icon: Archive, text: 'Arkivera personalfil' },
              { icon: Key, text: 'Inaktivera fysiska nycklar' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-orange-700">
                <item.icon className="h-4 w-4" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Termination Button */}
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full h-12"
                disabled={!terminationType || !lastWorkingDay || !terminationReason}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Genomför Uppsägning
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Bekräfta Uppsägning
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Du håller på att säga upp <strong>{staff.name}</strong>. 
                  Detta kommer att aktivera säkerhetsåtgärder och kan inte ångras enkelt.
                </p>
                
                <div className="bg-red-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-red-800 mb-1">Konsekvenser:</p>
                  <ul className="text-red-700 space-y-1">
                    <li>• Omedelbar säkerhetsspärrning</li>
                    <li>• Alla åtkomster inaktiveras</li>
                    <li>• Framtida pass avbokas automatiskt</li>
                    <li>• Personalfil arkiveras</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleTerminateEmployee}
                    disabled={isTerminating}
                    className="flex-1"
                  >
                    {isTerminating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Genomför...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Bekräfta Uppsägning
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
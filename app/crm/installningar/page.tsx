'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building,
  Users,
  Settings,
  Bell,
  Shield,
  Save,
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  Clock,
  Palette,
  Database,
  Zap,
  Monitor,
  Smartphone,
  Key,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('company')
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    name: 'Nordflytt AB',
    tagline: 'Din pålitliga flyttpartner',
    orgNumber: '556123-4567',
    email: 'info@nordflytt.se',
    phone: '+46 8 123 456 78',
    address: 'Företagsvägen 123',
    postalCode: '123 45',
    city: 'Stockholm',
    country: 'Sverige',
    website: 'www.nordflytt.se',
    logo: '/nordflytt-logo.png',
    primaryColor: '#002A5C',
    secondaryColor: '#F5F5F5'
  })

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    language: 'sv',
    timezone: 'Europe/Stockholm',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    currency: 'SEK',
    taxRate: 25,
    autoBackup: true,
    backupFrequency: 'daily',
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 1000,
    sessionTimeout: 30
  })

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    newBookingAlert: true,
    bookingConfirmation: true,
    bookingReminder: true,
    staffAssignment: true,
    customerFeedback: true,
    systemAlerts: true,
    marketingEmails: false,
    reminderTiming: 24,
    notificationEmail: 'admin@nordflytt.se',
    notificationPhone: '+46 70 123 45 67'
  })

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordExpiry: 90,
    minPasswordLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    sessionTimeout: 30,
    ipWhitelist: false,
    allowedIPs: '',
    failedLoginAttempts: 5,
    lockoutDuration: 30,
    encryptionEnabled: true,
    auditLogging: true,
    gdprCompliant: true
  })

  const handleCompanySave = async () => {
    setIsSaving(true)
    try {
      // Simulera API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Företagsinställningar sparade",
        description: "Alla ändringar har sparats.",
      })
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara inställningar.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      // I verkligheten skulle vi ladda upp till server här
      const reader = new FileReader()
      reader.onload = (e) => {
        setCompanySettings(prev => ({
          ...prev,
          logo: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inställningar</h1>
        <p className="text-gray-600">Hantera system- och företagskonfiguration</p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden md:inline">Företag</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Användare</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notifieringar</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Säkerhet</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Företagsinformation
              </CardTitle>
              <CardDescription>
                Grundläggande information om ditt företag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <Label>Företagslogotyp</Label>
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {companySettings.logo ? (
                      <img src={companySettings.logo} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-gray-500">Rekommenderad storlek: 200x200px</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Company Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Företagsnamn</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgNumber">Organisationsnummer</Label>
                  <Input
                    id="orgNumber"
                    value={companySettings.orgNumber}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, orgNumber: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={companySettings.tagline}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Din slogan eller tagline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Webbplats</Label>
                  <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="www.exempel.se"
                  />
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Kontaktinformation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-postadress</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-medium">Adress</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Gatuadress</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        value={companySettings.address}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postnummer</Label>
                      <Input
                        id="postalCode"
                        value={companySettings.postalCode}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, postalCode: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Stad</Label>
                      <Input
                        id="city"
                        value={companySettings.city}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Branding */}
              <div className="space-y-4">
                <h3 className="font-medium">Varumärkesfärger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primärfärg</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={companySettings.primaryColor}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={companySettings.primaryColor}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Sekundärfärg</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={companySettings.secondaryColor}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={companySettings.secondaryColor}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleCompanySave} disabled={isSaving} className="bg-[#002A5C] hover:bg-[#001a42]">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sparar...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Spara Företagsinställningar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Användarhantering
              </CardTitle>
              <CardDescription>
                Hantera användare och roller i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Användarhantering kommer snart...</p>
                <p className="text-sm mt-2">Denna funktion är under utveckling</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Systemkonfiguration
              </CardTitle>
              <CardDescription>
                Allmänna systeminställningar och regional konfiguration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Regional Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Regional inställningar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Språk</Label>
                    <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sv">Svenska</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="no">Norsk</SelectItem>
                        <SelectItem value="fi">Suomi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Tidszon</Label>
                    <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Stockholm">Stockholm (GMT+1)</SelectItem>
                        <SelectItem value="Europe/Oslo">Oslo (GMT+1)</SelectItem>
                        <SelectItem value="Europe/Copenhagen">Köpenhamn (GMT+1)</SelectItem>
                        <SelectItem value="Europe/Helsinki">Helsingfors (GMT+2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Datumformat</Label>
                    <Select value={systemSettings.dateFormat} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, dateFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YYYY-MM-DD">2025-07-02</SelectItem>
                        <SelectItem value="DD/MM/YYYY">02/07/2025</SelectItem>
                        <SelectItem value="MM/DD/YYYY">07/02/2025</SelectItem>
                        <SelectItem value="DD.MM.YYYY">02.07.2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Tidsformat</Label>
                    <Select value={systemSettings.timeFormat} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, timeFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24-timmar (14:30)</SelectItem>
                        <SelectItem value="12h">12-timmar (2:30 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Ekonomiska inställningar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Valuta</Label>
                    <Select value={systemSettings.currency} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEK">SEK - Svenska kronor</SelectItem>
                        <SelectItem value="NOK">NOK - Norska kronor</SelectItem>
                        <SelectItem value="DKK">DKK - Danska kronor</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Momssats (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={systemSettings.taxRate}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, taxRate: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Technical Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Tekniska inställningar
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoBackup">Automatisk säkerhetskopiering</Label>
                      <p className="text-sm text-gray-500">Säkerhetskopiera data automatiskt</p>
                    </div>
                    <Switch
                      id="autoBackup"
                      checked={systemSettings.autoBackup}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoBackup: checked }))}
                    />
                  </div>

                  {systemSettings.autoBackup && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="backupFrequency">Säkerhetskopieringsfrekvens</Label>
                      <Select value={systemSettings.backupFrequency} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, backupFrequency: value }))}>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Varje timme</SelectItem>
                          <SelectItem value="daily">Dagligen</SelectItem>
                          <SelectItem value="weekly">Veckovis</SelectItem>
                          <SelectItem value="monthly">Månadsvis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenanceMode">Underhållsläge</Label>
                      <p className="text-sm text-gray-500">Stäng temporärt systemet för underhåll</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="debugMode">Felsökningsläge</Label>
                      <p className="text-sm text-gray-500">Aktivera utökad loggning för felsökning</p>
                    </div>
                    <Switch
                      id="debugMode"
                      checked={systemSettings.debugMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, debugMode: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={() => toast({ title: "Systeminställningar sparade" })} className="bg-[#002A5C] hover:bg-[#001a42]">
                  <Save className="h-4 w-4 mr-2" />
                  Spara Systeminställningar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifieringsinställningar
              </CardTitle>
              <CardDescription>
                Konfigurera hur och när notifieringar skickas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h3 className="font-medium">Notifieringskanaler</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">E-postnotifieringar</Label>
                      <p className="text-sm text-gray-500">Skicka notifieringar via e-post</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsNotifications">SMS-notifieringar</Label>
                      <p className="text-sm text-gray-500">Skicka notifieringar via SMS</p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pushNotifications">Push-notifieringar</Label>
                      <p className="text-sm text-gray-500">Skicka notifieringar i webbläsaren</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="font-medium">Notifieringstyper</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newBookingAlert">Ny bokning</Label>
                    <Switch
                      id="newBookingAlert"
                      checked={notificationSettings.newBookingAlert}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newBookingAlert: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookingConfirmation">Bokningsbekräftelse</Label>
                    <Switch
                      id="bookingConfirmation"
                      checked={notificationSettings.bookingConfirmation}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, bookingConfirmation: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookingReminder">Bokningspåminnelse</Label>
                    <Switch
                      id="bookingReminder"
                      checked={notificationSettings.bookingReminder}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, bookingReminder: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="staffAssignment">Personaltilldelning</Label>
                    <Switch
                      id="staffAssignment"
                      checked={notificationSettings.staffAssignment}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, staffAssignment: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="customerFeedback">Kundfeedback</Label>
                    <Switch
                      id="customerFeedback"
                      checked={notificationSettings.customerFeedback}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, customerFeedback: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemAlerts">Systemvarningar</Label>
                    <Switch
                      id="systemAlerts"
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, systemAlerts: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Notifieringsinställningar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="reminderTiming">Påminnelsetid före bokning (timmar)</Label>
                    <Input
                      id="reminderTiming"
                      type="number"
                      value={notificationSettings.reminderTiming}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, reminderTiming: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationEmail">Notifierings-e-post</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      value={notificationSettings.notificationEmail}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={() => toast({ title: "Notifieringsinställningar sparade" })} className="bg-[#002A5C] hover:bg-[#001a42]">
                  <Save className="h-4 w-4 mr-2" />
                  Spara Notifieringsinställningar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Säkerhetsinställningar
              </CardTitle>
              <CardDescription>
                Konfigurera säkerhetspolicyer och åtkomstkontroll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Authentication Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Autentiseringsinställningar
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="twoFactorAuth">Tvåfaktorsautentisering (2FA)</Label>
                      <p className="text-sm text-gray-500">Kräv tvåfaktorsautentisering för alla användare</p>
                    </div>
                    <Switch
                      id="twoFactorAuth"
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiry">Lösenordsgiltighetstid (dagar)</Label>
                      <Input
                        id="passwordExpiry"
                        type="number"
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Sessionstimeout (minuter)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Password Policy */}
              <div className="space-y-4">
                <h3 className="font-medium">Lösenordspolicy</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPasswordLength">Minsta lösenordslängd</Label>
                    <Input
                      id="minPasswordLength"
                      type="number"
                      value={securitySettings.minPasswordLength}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, minPasswordLength: parseInt(e.target.value) }))}
                      className="max-w-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireSpecialChars">Kräv specialtecken</Label>
                    <Switch
                      id="requireSpecialChars"
                      checked={securitySettings.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireSpecialChars: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireNumbers">Kräv siffror</Label>
                    <Switch
                      id="requireNumbers"
                      checked={securitySettings.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireNumbers: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Security Features */}
              <div className="space-y-4">
                <h3 className="font-medium">Säkerhetsfunktioner</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="encryptionEnabled">Datakryptering</Label>
                      <p className="text-sm text-gray-500">Kryptera känslig data i vila</p>
                    </div>
                    <Switch
                      id="encryptionEnabled"
                      checked={securitySettings.encryptionEnabled}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, encryptionEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auditLogging">Granskningsloggning</Label>
                      <p className="text-sm text-gray-500">Logga alla systemåtgärder</p>
                    </div>
                    <Switch
                      id="auditLogging"
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, auditLogging: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="gdprCompliant">GDPR-efterlevnad</Label>
                      <p className="text-sm text-gray-500">Aktivera GDPR-kompatibla funktioner</p>
                    </div>
                    <Switch
                      id="gdprCompliant"
                      checked={securitySettings.gdprCompliant}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, gdprCompliant: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={() => toast({ title: "Säkerhetsinställningar sparade" })} className="bg-[#002A5C] hover:bg-[#001a42]">
                  <Save className="h-4 w-4 mr-2" />
                  Spara Säkerhetsinställningar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
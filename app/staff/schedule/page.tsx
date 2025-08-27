'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Phone,
  Navigation as NavigationIcon,
  Truck,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  MessageSquare,
  ArrowLeft,
  Wifi,
  WifiOff,
  RefreshCw,
  Camera,
  X
} from 'lucide-react'
import Link from 'next/link'
import TopNavigation from '@/components/staff/TopNavigation'
import OperationalChat from '@/components/staff/OperationalChat'

interface ScheduleJob {
  id: string
  bookingNumber: string
  customerName: string
  customerPhone: string
  fromAddress: string
  toAddress: string
  moveDate: string
  moveTime: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  estimatedHours: number
  teamMembers: string[]
  distance: number
  notes: string
  equipment: string[]
  specialRequirements: string[]
  serviceType: 'packhjälp' | 'flytt' | 'städning'
}

interface SecureScheduleJob {
  id: string
  bookingNumber: string
  firstName: string
  lastName: string | null
  maskedPhone: string | null
  fullPhone: string | null
  basicLocation: string
  fullAddress: string | null
  moveDate: string
  moveTime: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  estimatedHours: number
  teamMembers: string[]
  distance: number
  notes: string
  equipment: string[]
  specialRequirements: string[]
  serviceType: 'packhjälp' | 'flytt' | 'städning'
  isToday: boolean
  canViewSensitiveInfo: boolean
}

// Säker datafiltrering - döljer känslig info för framtida uppdrag
function getSecureScheduleData(jobs: ScheduleJob[], currentDate: string): SecureScheduleJob[] {
  return jobs.map(job => {
    const isToday = job.moveDate === currentDate
    const canViewSensitiveInfo = isToday || job.status === 'in_progress'
    
    // Extrahera förnamn och efternamn
    const nameParts = job.customerName.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
    
    // Maskera telefon för framtida uppdrag
    const maskedPhone = job.customerPhone.replace(/(\+46\s?\d{2})\s?\d{3}\s?\d{2}\s?(\d{2})/, '$1 *** ** $2')
    
    // Förenkla adress till grundläggande plats
    const basicLocation = job.fromAddress.split(',').slice(-1)[0].trim() || job.fromAddress
    
    return {
      id: job.id,
      bookingNumber: job.bookingNumber,
      firstName,
      lastName: canViewSensitiveInfo ? lastName : null,
      maskedPhone: canViewSensitiveInfo ? null : maskedPhone,
      fullPhone: canViewSensitiveInfo ? job.customerPhone : null,
      basicLocation,
      fullAddress: canViewSensitiveInfo ? job.fromAddress : null,
      moveDate: job.moveDate,
      moveTime: job.moveTime,
      status: job.status,
      priority: job.priority,
      estimatedHours: job.estimatedHours,
      teamMembers: job.teamMembers,
      distance: job.distance,
      notes: job.notes,
      equipment: job.equipment,
      specialRequirements: job.specialRequirements,
      serviceType: job.serviceType,
      isToday,
      canViewSensitiveInfo
    }
  })
}

export default function SchedulePage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(2)
  const [scheduleJobs, setScheduleJobs] = useState<ScheduleJob[]>([])
  const [secureJobs, setSecureJobs] = useState<SecureScheduleJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    const authData = localStorage.getItem('staff_auth')
    if (!authData) {
      router.push('/staff')
      return
    }

    // Set up online/offline detection
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    loadSchedule()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const loadSchedule = async () => {
    setIsLoading(true)
    
    // Mock data - replace with API call
    const mockJobs: ScheduleJob[] = [
      {
        id: '1',
        bookingNumber: 'NF-59EB2CE2',
        customerName: 'Mustafa Abdulkarim',
        customerPhone: '+46 72 368 39 67',
        fromAddress: 'Arenavägen 60, 121 77 Johanneshov',
        toAddress: 'Kubikvägen 11, 187 59 Täby',
        moveDate: new Date().toISOString().split('T')[0],
        moveTime: '08:00',
        status: 'upcoming',
        priority: 'high',
        estimatedHours: 3,
        teamMembers: ['Erik Andersson', 'Sofia Lindberg'],
        distance: 27.7,
        notes: 'Kund föredrar tidig start. Har stora möbler.',
        equipment: ['Flyttsele', 'Täcken', 'Kartong storlek L'],
        specialRequirements: ['Piano', 'Stora möbler'],
        serviceType: 'packhjälp'
      },
      {
        id: '2',
        bookingNumber: 'NF-B3914890',
        customerName: 'Anna Svensson',
        customerPhone: '+46 70 123 45 67',
        fromAddress: 'Gräsmarksvägen 12, Stockholm',
        toAddress: 'Vasagatan 22, Stockholm',
        moveDate: new Date().toISOString().split('T')[0],
        moveTime: '13:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 4,
        teamMembers: ['Marcus Johansson', 'Henrik Karlsson'],
        distance: 15.2,
        notes: 'Städservice ingår. Packning krävs.',
        equipment: ['Städmaterial', 'Packmaterial', 'Kartong mix'],
        specialRequirements: ['Packning', 'Städning'],
        serviceType: 'flytt'
      },
      {
        id: '3',
        bookingNumber: 'NF-ABC12345',
        customerName: 'Lisa Petersson',
        customerPhone: '+46 70 987 65 43',
        fromAddress: 'Södermalm, Stockholm',
        toAddress: 'Östermalm, Stockholm',
        moveDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        moveTime: '09:00',
        status: 'upcoming',
        priority: 'low',
        estimatedHours: 2,
        teamMembers: ['Erik Andersson'],
        distance: 8.5,
        notes: 'Mindre flytt, bara några lådor.',
        equipment: ['Kartong S'],
        specialRequirements: [],
        serviceType: 'städning'
      },
      // Fler varierande datum för kalendern
      {
        id: '4',
        bookingNumber: 'NF-DEF45678',
        customerName: 'Erik Johansson',
        customerPhone: '+46 73 456 78 90',
        fromAddress: 'Storgatan 15, Uppsala',
        toAddress: 'Kungsgatan 25, Uppsala',
        moveDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // +2 days
        moveTime: '10:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 5,
        teamMembers: ['Marcus Johansson', 'Sofia Lindberg'],
        distance: 12.3,
        notes: 'Stor flytt, behöver extra tid.',
        equipment: ['Flyttsele', 'Täcken', 'Kartong L', 'Plastfolie'],
        specialRequirements: ['Tunga möbler', 'Känslig elektronik'],
        serviceType: 'flytt'
      },
      {
        id: '5',
        bookingNumber: 'NF-GHI78901',
        customerName: 'Maria Andersson',
        customerPhone: '+46 76 789 01 23',
        fromAddress: 'Västerås centrum, Västerås',
        toAddress: 'Hälla, Västerås',
        moveDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // +3 days
        moveTime: '14:00',
        status: 'upcoming',
        priority: 'low',
        estimatedHours: 2,
        teamMembers: ['Erik Andersson'],
        distance: 8.7,
        notes: 'Bara packing och organisering.',
        equipment: ['Kartong mix', 'Packtejp', 'Märkpennor'],
        specialRequirements: ['Kläder', 'Böcker'],
        serviceType: 'packhjälp'
      },
      {
        id: '6',
        bookingNumber: 'NF-JKL23456',
        customerName: 'David Nilsson',
        customerPhone: '+46 79 234 56 78',
        fromAddress: 'Södermalm, Stockholm',
        toAddress: 'Vasastan, Stockholm',
        moveDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], // +5 days
        moveTime: '09:00',
        status: 'upcoming',
        priority: 'high',
        estimatedHours: 3,
        teamMembers: ['Henrik Karlsson', 'Sofia Lindberg'],
        distance: 6.2,
        notes: 'Grundlig städning efter flytt.',
        equipment: ['Städutrustning', 'Kemikalier', 'Dammsugare'],
        specialRequirements: ['Djupstädning', 'Fönsterputs'],
        serviceType: 'städning'
      },
      {
        id: '7',
        bookingNumber: 'NF-MNO34567',
        customerName: 'Sara Larsson',
        customerPhone: '+46 72 345 67 89',
        fromAddress: 'Norrköping centrum, Norrköping',
        toAddress: 'Linköping, Linköping',
        moveDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // +7 days
        moveTime: '08:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 6,
        teamMembers: ['Marcus Johansson', 'Erik Andersson', 'Henrik Karlsson'],
        distance: 45.8,
        notes: 'Stor villa, behöver tre personer.',
        equipment: ['Flyttsele', 'Täcken', 'Kartong XL', 'Plastfolie', 'Ramp'],
        specialRequirements: ['Piano', 'Tung säng', 'Vitvaror'],
        serviceType: 'flytt'
      },
      // Fler kalenderjobb för kommande veckor
      {
        id: '8',
        bookingNumber: 'NF-PQR78901',
        customerName: 'Johan Hansson',
        customerPhone: '+46 73 890 12 34',
        fromAddress: 'Gamla Stan, Stockholm',
        toAddress: 'Södermalm, Stockholm',
        moveDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], // +10 days
        moveTime: '15:00',
        status: 'upcoming',
        priority: 'high',
        estimatedHours: 2,
        teamMembers: ['Sofia Lindberg'],
        distance: 3.2,
        notes: 'Antik möbler - var försiktig.',
        equipment: ['Specialförpackning', 'Täcken'],
        specialRequirements: ['Antik möbler', 'Känslig hantering'],
        serviceType: 'packhjälp'
      },
      {
        id: '9',
        bookingNumber: 'NF-STU23456',
        customerName: 'Petra Karlsson',
        customerPhone: '+46 76 123 45 67',
        fromAddress: 'Centrum, Göteborg',
        toAddress: 'Angered, Göteborg',
        moveDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], // +14 days
        moveTime: '10:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 7,
        teamMembers: ['Erik Andersson', 'Marcus Johansson', 'Henrik Karlsson'],
        distance: 18.5,
        notes: 'Stor flytt med piano. Parkering kan vara problem.',
        equipment: ['Pianodolly', 'Flyttsele', 'Ramp'],
        specialRequirements: ['Piano', 'Tunga möbler', 'Parkering'],
        serviceType: 'flytt'
      },
      {
        id: '10',
        bookingNumber: 'NF-VWX34567',
        customerName: 'Andreas Nilsson',
        customerPhone: '+46 79 567 89 01',
        fromAddress: 'Kungsholmen, Stockholm',
        toAddress: 'Östermalm, Stockholm',
        moveDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0], // +21 days
        moveTime: '11:00',
        status: 'upcoming',
        priority: 'low',
        estimatedHours: 4,
        teamMembers: ['Sofia Lindberg', 'Henrik Karlsson'],
        distance: 6.8,
        notes: 'Grundlig flyttstädning behövs.',
        equipment: ['Städmaterial', 'Dammsugare', 'Kemikalier'],
        specialRequirements: ['Fönsterputs', 'Djupstädning'],
        serviceType: 'städning'
      },
      // Fyll hela juli månad med varierande uppdrag
      {
        id: '11',
        bookingNumber: 'NF-YZA45678',
        customerName: 'Emma Lindström',
        customerPhone: '+46 70 234 56 78',
        fromAddress: 'Vasastan, Stockholm',
        toAddress: 'Sundbyberg, Stockholm',
        moveDate: new Date(2025, 6, 1).toISOString().split('T')[0], // 1 juli
        moveTime: '09:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 3,
        teamMembers: ['Erik Andersson'],
        distance: 8.5,
        notes: 'Liten lägenhet, enkelt jobb.',
        equipment: ['Kartong mix', 'Täcken'],
        specialRequirements: [],
        serviceType: 'packhjälp'
      },
      {
        id: '12',
        bookingNumber: 'NF-BCD56789',
        customerName: 'Oscar Bergström',
        customerPhone: '+46 73 345 67 89',
        fromAddress: 'Kista, Stockholm',
        toAddress: 'Solna, Stockholm',
        moveDate: new Date(2025, 6, 2).toISOString().split('T')[0], // 2 juli
        moveTime: '13:00',
        status: 'upcoming',
        priority: 'high',
        estimatedHours: 5,
        teamMembers: ['Marcus Johansson', 'Henrik Karlsson'],
        distance: 12.3,
        notes: 'IT-utrustning, var försiktig.',
        equipment: ['Specialförpackning', 'Bubbelplast'],
        specialRequirements: ['Känslig elektronik'],
        serviceType: 'flytt'
      },
      {
        id: '13',
        bookingNumber: 'NF-EFG67890',
        customerName: 'Alice Månsson',
        customerPhone: '+46 76 456 78 90',
        fromAddress: 'Bromma, Stockholm',
        toAddress: 'Vällingby, Stockholm',
        moveDate: new Date(2025, 6, 3).toISOString().split('T')[0], // 3 juli
        moveTime: '10:00',
        status: 'upcoming',
        priority: 'low',
        estimatedHours: 2,
        teamMembers: ['Sofia Lindberg'],
        distance: 6.2,
        notes: 'Flyttstädning efter flytt.',
        equipment: ['Städutrustning', 'Dammsugare'],
        specialRequirements: ['Fönsterputs'],
        serviceType: 'städning'
      },
      {
        id: '14',
        bookingNumber: 'NF-HIJ78901',
        customerName: 'Viktor Olsson',
        customerPhone: '+46 79 567 89 01',
        fromAddress: 'Huddinge, Stockholm',
        toAddress: 'Haninge, Stockholm',
        moveDate: new Date(2025, 6, 4).toISOString().split('T')[0], // 4 juli
        moveTime: '08:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 6,
        teamMembers: ['Erik Andersson', 'Marcus Johansson', 'Sofia Lindberg'],
        distance: 22.5,
        notes: 'Villa med garage, mycket att flytta.',
        equipment: ['Flyttsele', 'Ramp', 'Kartong XL'],
        specialRequirements: ['Tunga möbler', 'Extra personal'],
        serviceType: 'flytt'
      },
      {
        id: '15',
        bookingNumber: 'NF-KLM89012',
        customerName: 'Linnea Gustafsson',
        customerPhone: '+46 72 678 90 12',
        fromAddress: 'Östermalm, Stockholm',
        toAddress: 'Djursholm, Stockholm',
        moveDate: new Date(2025, 6, 5).toISOString().split('T')[0], // 5 juli
        moveTime: '11:00',
        status: 'upcoming',
        priority: 'high',
        estimatedHours: 4,
        teamMembers: ['Henrik Karlsson', 'Sofia Lindberg'],
        distance: 15.8,
        notes: 'Designmöbler, extra försiktighet.',
        equipment: ['Specialförpackning', 'Täcken'],
        specialRequirements: ['Antik möbler', 'Känslig hantering'],
        serviceType: 'packhjälp'
      },
      {
        id: '16',
        bookingNumber: 'NF-NOP90123',
        customerName: 'Filip Eriksson',
        customerPhone: '+46 70 789 01 23',
        fromAddress: 'Nacka, Stockholm',
        toAddress: 'Värmdö, Stockholm',
        moveDate: new Date(2025, 6, 8).toISOString().split('T')[0], // 8 juli
        moveTime: '14:00',
        status: 'upcoming',
        priority: 'low',
        estimatedHours: 3,
        teamMembers: ['Erik Andersson'],
        distance: 18.2,
        notes: 'Sommarstuga, enkel flytt.',
        equipment: ['Kartong mix', 'Täcken'],
        specialRequirements: [],
        serviceType: 'flytt'
      },
      {
        id: '17',
        bookingNumber: 'NF-QRS01234',
        customerName: 'Maja Andersson',
        customerPhone: '+46 73 890 12 34',
        fromAddress: 'Sollentuna, Stockholm',
        toAddress: 'Upplands Väsby, Stockholm',
        moveDate: new Date(2025, 6, 12).toISOString().split('T')[0], // 12 juli
        moveTime: '09:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 2,
        teamMembers: ['Sofia Lindberg'],
        distance: 8.7,
        notes: 'Grundlig städning krävs.',
        equipment: ['Städutrustning', 'Kemikalier'],
        specialRequirements: ['Djupstädning'],
        serviceType: 'städning'
      },
      {
        id: '18',
        bookingNumber: 'NF-TUV12345',
        customerName: 'William Persson',
        customerPhone: '+46 76 901 23 45',
        fromAddress: 'Farsta, Stockholm',
        toAddress: 'Skarpnäck, Stockholm',
        moveDate: new Date(2025, 6, 15).toISOString().split('T')[0], // 15 juli
        moveTime: '10:00',
        status: 'upcoming',
        priority: 'high',
        estimatedHours: 7,
        teamMembers: ['Marcus Johansson', 'Erik Andersson', 'Henrik Karlsson'],
        distance: 5.3,
        notes: 'Flygel måste flyttas, behöver specialutrustning.',
        equipment: ['Pianodolly', 'Flyttsele', 'Specialförpackning'],
        specialRequirements: ['Piano', 'Tunga möbler', 'Specialhantering'],
        serviceType: 'flytt'
      },
      {
        id: '19',
        bookingNumber: 'NF-WXY23456',
        customerName: 'Isabella Lund',
        customerPhone: '+46 79 012 34 56',
        fromAddress: 'Lidingö, Stockholm',
        toAddress: 'Danderyd, Stockholm',
        moveDate: new Date(2025, 6, 18).toISOString().split('T')[0], // 18 juli
        moveTime: '13:00',
        status: 'upcoming',
        priority: 'low',
        estimatedHours: 3,
        teamMembers: ['Henrik Karlsson'],
        distance: 7.1,
        notes: 'Packhjälp för utlandsflytt.',
        equipment: ['Kartong mix', 'Bubbelplast', 'Märkpennor'],
        specialRequirements: ['Internationell packning'],
        serviceType: 'packhjälp'
      },
      {
        id: '20',
        bookingNumber: 'NF-ZAB34567',
        customerName: 'Noah Wikström',
        customerPhone: '+46 72 123 45 67',
        fromAddress: 'Älvsjö, Stockholm',
        toAddress: 'Hägersten, Stockholm',
        moveDate: new Date(2025, 6, 20).toISOString().split('T')[0], // 20 juli
        moveTime: '08:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 4,
        teamMembers: ['Erik Andersson', 'Sofia Lindberg'],
        distance: 4.8,
        notes: 'Ingen hiss, 4:e våningen.',
        equipment: ['Flyttsele', 'Täcken'],
        specialRequirements: ['Ingen hiss', 'Trappor'],
        serviceType: 'flytt'
      },
      {
        id: '21',
        bookingNumber: 'NF-CDE45678',
        customerName: 'Ella Johansson',
        customerPhone: '+46 70 234 56 78',
        fromAddress: 'Spånga, Stockholm',
        toAddress: 'Tensta, Stockholm',
        moveDate: new Date(2025, 6, 22).toISOString().split('T')[0], // 22 juli
        moveTime: '11:00',
        status: 'upcoming',
        priority: 'low',
        estimatedHours: 2,
        teamMembers: ['Sofia Lindberg'],
        distance: 3.2,
        notes: 'Slutstädning av kontor.',
        equipment: ['Städutrustning', 'Dammsugare'],
        specialRequirements: [],
        serviceType: 'städning'
      },
      {
        id: '22',
        bookingNumber: 'NF-FGH56789',
        customerName: 'Lucas Henriksson',
        customerPhone: '+46 73 345 67 89',
        fromAddress: 'Bagarmossen, Stockholm',
        toAddress: 'Skogås, Stockholm',
        moveDate: new Date(2025, 6, 25).toISOString().split('T')[0], // 25 juli
        moveTime: '14:00',
        status: 'upcoming',
        priority: 'high',
        estimatedHours: 5,
        teamMembers: ['Marcus Johansson', 'Henrik Karlsson'],
        distance: 12.6,
        notes: 'Akvarium och terrarium, special hantering.',
        equipment: ['Specialförpackning', 'Bubbelplast'],
        specialRequirements: ['Känslig last', 'Levande djur'],
        serviceType: 'flytt'
      },
      {
        id: '23',
        bookingNumber: 'NF-IJK67890',
        customerName: 'Olivia Magnusson',
        customerPhone: '+46 76 456 78 90',
        fromAddress: 'Hässelby, Stockholm',
        toAddress: 'Vällingby, Stockholm',
        moveDate: new Date(2025, 6, 28).toISOString().split('T')[0], // 28 juli
        moveTime: '09:00',
        status: 'upcoming',
        priority: 'medium',
        estimatedHours: 3,
        teamMembers: ['Erik Andersson'],
        distance: 5.5,
        notes: 'Konst och tavlor, försiktig packning.',
        equipment: ['Specialförpackning', 'Täcken'],
        specialRequirements: ['Konst', 'Känslig hantering'],
        serviceType: 'packhjälp'
      },
      {
        id: '24',
        bookingNumber: 'NF-LMN78901',
        customerName: 'Liam Sjöberg',
        customerPhone: '+46 79 567 89 01',
        fromAddress: 'Enskede, Stockholm',
        toAddress: 'Årsta, Stockholm',
        moveDate: new Date(2025, 6, 30).toISOString().split('T')[0], // 30 juli
        moveTime: '12:00',
        status: 'upcoming',
        priority: 'low',
        estimatedHours: 4,
        teamMembers: ['Sofia Lindberg', 'Henrik Karlsson'],
        distance: 4.2,
        notes: 'Studentflytt, många kartonger.',
        equipment: ['Kartong mix', 'Täcken'],
        specialRequirements: [],
        serviceType: 'flytt'
      },
      {
        id: '25',
        bookingNumber: 'NF-OPQ89012',
        customerName: 'Astrid Forsberg',
        customerPhone: '+46 72 678 90 12',
        fromAddress: 'Tyresö, Stockholm',
        toAddress: 'Saltsjöbaden, Stockholm',
        moveDate: new Date(2025, 6, 31).toISOString().split('T')[0], // 31 juli
        moveTime: '10:00',
        status: 'upcoming',
        priority: 'high',
        estimatedHours: 6,
        teamMembers: ['Marcus Johansson', 'Erik Andersson', 'Sofia Lindberg'],
        distance: 28.4,
        notes: 'Stort hus med trädgårdsmöbler.',
        equipment: ['Flyttsele', 'Ramp', 'Kartong XL', 'Plastfolie'],
        specialRequirements: ['Tunga möbler', 'Trädgårdsmöbler', 'Extra personal'],
        serviceType: 'flytt'
      }
    ]

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setScheduleJobs(mockJobs)
    
    // Säker datafiltrering
    const secureJobsData = getSecureScheduleData(mockJobs, new Date().toISOString().split('T')[0])
    setSecureJobs(secureJobsData)
    
    setIsLoading(false)
  }

  const refreshSchedule = () => {
    loadSchedule()
  }

  const getJobsByDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return scheduleJobs.filter(job => job.moveDate === dateString)
  }

  const getTodaysJobs = () => {
    return getJobsByDate(new Date())
  }

  const getWeekJobs = () => {
    const today = new Date()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return scheduleJobs.filter(job => {
      const jobDate = new Date(job.moveDate)
      return jobDate >= today && jobDate <= weekFromNow
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Kommer'
      case 'in_progress': return 'Pågår'
      case 'completed': return 'Klar'
      case 'cancelled': return 'Avbruten'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="h-4 w-4" />
      case 'in_progress': return <PlayCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'packhjälp': return '📦'
      case 'flytt': return '🚚'
      case 'städning': return '🧹'
      default: return '📦'
    }
  }

  const getJobSizeIndicator = (hours: number) => {
    if (hours <= 2) return '🟢' // Kort jobb (1-2h)
    if (hours <= 5) return '🟡' // Standard (3-5h)
    return '🔴' // Stor/Komplex (6h+)
  }

  const getSpecialRequirements = (job: SecureScheduleJob) => {
    const indicators = []
    
    // Kontrollera specialkrav från notes och specialRequirements
    const requirements = [...job.specialRequirements, job.notes].join(' ').toLowerCase()
    
    if (requirements.includes('piano') || requirements.includes('antik') || requirements.includes('känslig')) {
      indicators.push('⚠️')
    }
    if (requirements.includes('parkering') || requirements.includes('ingen hiss') || requirements.includes('trappa')) {
      indicators.push('🚗')
    }
    if (requirements.includes('tunga möbler') || requirements.includes('extra')) {
      indicators.push('👥')
    }
    
    return indicators
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Hög'
      case 'medium': return 'Medium'
      case 'low': return 'Låg'
      default: return priority
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    }).toUpperCase()
  }

  const groupJobsByDate = (jobs: SecureScheduleJob[]) => {
    const grouped = jobs.reduce((groups: Record<string, SecureScheduleJob[]>, job) => {
      const date = job.moveDate
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(job)
      return groups
    }, {})
    
    // Sortera datum i kronologisk ordning
    const sortedDates = Object.keys(grouped).sort()
    return sortedDates.map(date => ({
      date,
      jobs: grouped[date].sort((a, b) => a.moveTime.localeCompare(b.moveTime))
    }))
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startOfWeek = new Date(firstDayOfMonth)
    startOfWeek.setDate(startOfWeek.getDate() - firstDayOfMonth.getDay() + 1) // Måndag = 1
    
    const days = []
    const currentDate = new Date(startOfWeek)
    
    // Generera 42 dagar (6 veckor)
    for (let i = 0; i < 42; i++) {
      const dayJobs = secureJobs.filter(job => job.moveDate === currentDate.toISOString().split('T')[0])
      const isCurrentMonth = currentDate.getMonth() === month
      const isToday = currentDate.toDateString() === new Date().toDateString()
      const isSelected = currentDate.toDateString() === selectedDate.toDateString()
      
      days.push({
        date: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        jobs: dayJobs,
        jobCount: dayJobs.length
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  // Säker listvy - kompakt layout med skyddad information
  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'packhjälp': return 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-white'
      case 'flytt': return 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white'
      case 'städning': return 'border-l-green-500 bg-gradient-to-r from-green-50 to-white'
      default: return 'border-l-gray-400 bg-white'
    }
  }

  const renderJobListItem = (job: SecureScheduleJob) => {
    const isExpanded = expandedJob === job.id
    
    return (
      <div key={job.id} className={`border-b border-gray-200 hover:bg-gray-50 ${getServiceTypeColor(job.serviceType)} border-l-4`}>
        <div 
          className="py-4 px-4 cursor-pointer min-h-[72px] active:bg-gray-100 transition-colors"
          onClick={() => setExpandedJob(isExpanded ? null : job.id)}
        >
          <div className="flex items-center justify-between">
            {/* Vänster: Tid och jobbinfo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 min-w-[60px]">
                <Clock className="h-4 w-4 text-[#002A5C]" />
                <span className="font-semibold text-[#002A5C]">{job.moveTime}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {getServiceIcon(job.serviceType)} {job.firstName}
                  {job.lastName && <span className="text-gray-600"> {job.lastName}</span>}
                </span>
                <span className="text-sm text-gray-500 flex items-center space-x-1">
                  <span>({job.estimatedHours}h)</span>
                  <span>{getJobSizeIndicator(job.estimatedHours)}</span>
                </span>
              </div>
            </div>

            {/* Höger: Plats och status */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{job.basicLocation}</span>
              <div className="flex items-center space-x-1">
                {getSpecialRequirements(job).map((indicator, index) => (
                  <span key={index} className="text-sm">{indicator}</span>
                ))}
                <span className="text-lg">
                  {job.isToday ? '🟢' : job.status === 'in_progress' ? '🟡' : '⚪'}
                </span>
                <Badge className={getStatusColor(job.status)}>
                  {getStatusText(job.status)}
                </Badge>
              </div>
              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </div>
          </div>
        </div>
        
        {/* Expanderat innehåll */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 bg-gray-50">
            {/* Kontaktinfo endast för dagens jobb */}
            {job.canViewSensitiveInfo && job.fullPhone && (
              <div className="mb-3 flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{job.fullPhone}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`tel:${job.fullPhone}`)
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Ring
                </Button>
              </div>
            )}
            
            {/* Fullständig adress för dagens jobb */}
            {job.canViewSensitiveInfo && job.fullAddress && (
              <div className="mb-3 flex items-start space-x-2 text-sm text-gray-600">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{job.fullAddress}</span>
              </div>
            )}
            
            {/* Säkerhetsmeddelande för framtida jobb */}
            {!job.canViewSensitiveInfo && (
              <div className="mb-3 flex items-center space-x-2 text-xs text-gray-500">
                <span>🔒 Kontaktinfo tillgänglig på uppdragsdagen</span>
                <span className="text-gray-400">({job.maskedPhone})</span>
              </div>
            )}
            
            {/* Teammedlemmar */}
            {job.teamMembers.length > 0 && (
              <div className="mb-3 flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-3 w-3" />
                <span>Team: {job.teamMembers.join(', ')}</span>
              </div>
            )}
            
            {/* Anteckningar */}
            {job.notes && (
              <div className="mb-3 flex items-start space-x-2 text-sm text-gray-600">
                <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{job.notes}</span>
              </div>
            )}
            
            {/* Actionknappar för dagens jobb */}
            {job.canViewSensitiveInfo && (
              <div className="flex space-x-2 pt-2">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-[#002A5C] to-[#003d7a] hover:from-[#001a42] hover:to-[#002952] text-white font-semibold px-6 py-2 rounded-full min-h-[40px] shadow-lg active:scale-95 transition-transform"
                  onClick={async (e) => {
                    e.stopPropagation()
                    
                    // Uppdatera jobbstatus lokalt
                    const updatedJobs = scheduleJobs.map(j => 
                      j.id === job.id ? { ...j, status: 'in_progress' as const } : j
                    )
                    setScheduleJobs(updatedJobs)
                    
                    // Uppdatera säker data
                    const secureJobsData = getSecureScheduleData(updatedJobs, new Date().toISOString().split('T')[0])
                    setSecureJobs(secureJobsData)
                    
                    // Visa toast-meddelande
                    const toast = document.createElement('div')
                    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2'
                    toast.innerHTML = `
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span class="font-medium">Uppdrag startat!</span>
                    `
                    document.body.appendChild(toast)
                    
                    // Ta bort toast efter 3 sekunder
                    setTimeout(() => {
                      toast.remove()
                    }, 3000)
                    
                    // Visa action bar
                    setActiveJobId(job.id)
                  }}
                >
                  🚀 Starta
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-2 border-[#002A5C] text-[#002A5C] hover:bg-[#002A5C] hover:text-white px-4 py-2 rounded-full min-h-[40px] font-medium active:scale-95 transition-all"
                >
                  <NavigationIcon className="h-4 w-4 mr-1" />
                  Navigation
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
  
  const renderJobCard = (job: ScheduleJob) => (
    <Card key={job.id} className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="font-bold text-lg">{job.moveTime}</span>
              <Badge className={getStatusColor(job.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(job.status)}
                  <span>{getStatusText(job.status)}</span>
                </div>
              </Badge>
              <Badge className={getPriorityColor(job.priority)}>
                {getPriorityText(job.priority)}
              </Badge>
            </div>
            <span className="text-sm text-gray-500">{job.bookingNumber}</span>
          </div>

          {/* Customer */}
          <div>
            <p className="font-semibold text-gray-900 text-lg">{job.customerName}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{job.customerPhone}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${job.customerPhone}`)}
                className="h-11 px-2 text-xs"
              >
                Ring
              </Button>
            </div>
          </div>

          {/* Addresses */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Från:</p>
                <p className="text-sm text-gray-600">{job.fromAddress}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Till:</p>
                <p className="text-sm text-gray-600">{job.toAddress}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Beräknad tid:</p>
              <p className="font-medium">{job.estimatedHours}h</p>
            </div>
            <div>
              <p className="text-gray-600">Avstånd:</p>
              <p className="font-medium">{job.distance}km</p>
            </div>
          </div>

          {/* Team */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Team:</p>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{job.teamMembers.join(', ')}</span>
            </div>
          </div>

          {/* Equipment & Requirements */}
          {(job.equipment.length > 0 || job.specialRequirements.length > 0) && (
            <div className="space-y-2">
              {job.equipment.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Utrustning:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.equipment.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {job.specialRequirements.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Specialkrav:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.specialRequirements.map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {job.notes && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Anteckning:</strong> {job.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-[#002A5C] hover:bg-[#001a42]"
              disabled={job.status === 'completed' || job.status === 'cancelled'}
            >
              {job.status === 'upcoming' ? (
                <div className="flex items-center space-x-1">
                  <PlayCircle className="h-4 w-4" />
                  <span>Starta</span>
                </div>
              ) : job.status === 'in_progress' ? (
                <div className="flex items-center space-x-1">
                  <PauseCircle className="h-4 w-4" />
                  <span>Pausa</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Slutför</span>
                </div>
              )}
            </Button>
            
            <Button variant="outline" size="sm">
              <NavigationIcon className="h-4 w-4 mr-1" />
              Navigation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const todaysJobs = getTodaysJobs()
  const weekJobs = getWeekJobs()
  const selectedDateJobs = getJobsByDate(selectedDate)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNavigation 
        unreadMessages={unreadMessages}
        onChatToggle={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />
      
      {/* Header */}
      <header className="bg-[#002A5C] text-white sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/staff/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Schema</h1>
                <p className="text-sm text-blue-100">Dagens och kommande uppdrag</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={refreshSchedule}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        {!isOnline && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-4 w-4 text-orange-600" />
                <p className="text-orange-800 text-sm">
                  Du är offline. Vissa funktioner kan vara begränsade.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Idag ({todaysJobs.length})</TabsTrigger>
            <TabsTrigger value="week">Denna vecka ({weekJobs.length})</TabsTrigger>
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-[#002A5C]" />
                  <span>Dagens Uppdrag</span>
                </CardTitle>
                <CardDescription>
                  {formatDate(new Date())}
                </CardDescription>
              </CardHeader>
            </Card>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
                <p className="mt-2 text-gray-600">Laddar schema...</p>
              </div>
            ) : todaysJobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-lg">Inga uppdrag idag</p>
                  <p className="text-sm text-gray-500">Njut av din lediga dag!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                {secureJobs.filter(job => job.isToday).map(renderJobListItem)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-[#002A5C]" />
                  <span>Denna Veckas Uppdrag</span>
                </CardTitle>
                <CardDescription>
                  Kommande 7 dagar
                </CardDescription>
              </CardHeader>
            </Card>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
                <p className="mt-2 text-gray-600">Laddar schema...</p>
              </div>
            ) : weekJobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-lg">Inga uppdrag denna vecka</p>
                  <p className="text-sm text-gray-500">Lugn vecka framöver!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {groupJobsByDate(secureJobs.filter(job => {
                  const jobDate = new Date(job.moveDate)
                  const today = new Date()
                  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
                  const weekEnd = new Date(weekStart)
                  weekEnd.setDate(weekEnd.getDate() + 6)
                  return jobDate >= weekStart && jobDate <= weekEnd
                })).map(({ date, jobs }) => (
                  <div key={date} className="bg-white rounded-lg border border-gray-200">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                      <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-[#002A5C]" />
                        <span>📅 {formatDateHeader(date)}</span>
                      </h3>
                    </div>
                    <div>
                      {jobs.map(renderJobListItem)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-[#002A5C]" />
                    <span>{selectedDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                      Idag
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                {/* Månadskalender */}
                <div className="mb-4">
                  {/* Veckodagar */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Kalenderdagar */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((day, index) => (
                      <div
                        key={index}
                        className={`
                          min-h-[60px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 rounded-md
                          ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                          ${day.isToday ? 'bg-blue-50 border-blue-300' : ''}
                          ${day.isSelected ? 'bg-[#002A5C] text-white' : ''}
                        `}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className="text-sm font-medium mb-1">{day.dayNumber}</div>
                        
                        {/* Jobb-indikatorer */}
                        {day.jobCount > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {day.jobs.slice(0, 3).map((job, jobIndex) => (
                              <span
                                key={jobIndex}
                                className={`
                                  text-xs px-1 py-0.5 rounded
                                  ${job.serviceType === 'packhjälp' ? 'bg-yellow-100 text-yellow-800' : ''}
                                  ${job.serviceType === 'flytt' ? 'bg-blue-100 text-blue-800' : ''}
                                  ${job.serviceType === 'städning' ? 'bg-green-100 text-green-800' : ''}
                                  ${day.isSelected ? 'bg-white/20 text-white' : ''}
                                `}
                              >
                                {getServiceIcon(job.serviceType)}
                              </span>
                            ))}
                            {day.jobCount > 3 && (
                              <span className="text-xs text-gray-500">+{day.jobCount - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vald dags jobb */}
            {secureJobs.filter(job => job.moveDate === selectedDate.toISOString().split('T')[0]).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-lg">Inga uppdrag {selectedDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}</p>
                  <p className="text-sm text-gray-500">Välj en annan dag</p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                {secureJobs.filter(job => job.moveDate === selectedDate.toISOString().split('T')[0]).map(renderJobListItem)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom spacing */}
      <div className="h-6"></div>

      {/* Operational Chat */}
      <OperationalChat 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        teamMembers={secureJobs.flatMap(job => job.teamMembers).filter((member, index, arr) => arr.indexOf(member) === index)}
        jobId={secureJobs.find(job => job.status === 'in_progress')?.id}
      />
      
      {/* Sticky Action Bar för aktivt jobb */}
      {activeJobId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="px-4 py-3">
            {(() => {
              const activeJob = secureJobs.find(j => j.id === activeJobId)
              if (!activeJob) return null
              
              return (
                <div className="space-y-3">
                  {/* Jobbinfo */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-medium text-gray-900">Pågående: {activeJob.firstName}</span>
                      <span className="text-gray-500">• {activeJob.moveTime}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveJobId(null)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center py-3 h-auto"
                      onClick={() => {
                        alert('📸 Fotofunktion öppnas här!\nI verklig implementation skulle kameran öppnas.')
                      }}
                    >
                      <Camera className="h-5 w-5 mb-1" />
                      <span className="text-xs">Foto</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center py-3 h-auto"
                      onClick={() => {
                        alert('📋 Checklista öppnas här!\nDynamisk checklista baserat på jobbdata.')
                      }}
                    >
                      <CheckCircle className="h-5 w-5 mb-1" />
                      <span className="text-xs">Checklista</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center py-3 h-auto"
                      onClick={() => {
                        alert('⏸️ Pausa uppdrag\nTiden pausas och du kan ta rast.')
                      }}
                    >
                      <PauseCircle className="h-5 w-5 mb-1" />
                      <span className="text-xs">Paus</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center py-3 h-auto text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Vill du rapportera ett problem?')) {
                          alert('🚨 Problemrapportering öppnas här!')
                        }
                      }}
                    >
                      <AlertTriangle className="h-5 w-5 mb-1" />
                      <span className="text-xs">Problem</span>
                    </Button>
                  </div>
                  
                  {/* Avsluta-knapp */}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      if (confirm('Är du säker på att du vill avsluta uppdraget?')) {
                        // Uppdatera status
                        const updatedJobs = scheduleJobs.map(j => 
                          j.id === activeJobId ? { ...j, status: 'completed' as const } : j
                        )
                        setScheduleJobs(updatedJobs)
                        
                        // Uppdatera säker data
                        const secureJobsData = getSecureScheduleData(updatedJobs, new Date().toISOString().split('T')[0])
                        setSecureJobs(secureJobsData)
                        
                        setActiveJobId(null)
                        
                        // Visa bekräftelse
                        const toast = document.createElement('div')
                        toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2'
                        toast.innerHTML = `
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span class="font-medium">Uppdrag avslutat!</span>
                        `
                        document.body.appendChild(toast)
                        
                        setTimeout(() => {
                          toast.remove()
                        }, 3000)
                      }
                    }}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Avsluta uppdrag
                  </Button>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
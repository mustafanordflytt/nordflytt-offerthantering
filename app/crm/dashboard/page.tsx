'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  LogOut
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('crm-user')
    if (!savedUser) {
      router.push('/crm/login')
      return
    }
    setUser(JSON.parse(savedUser))
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('crm-user')
    localStorage.removeItem('auth-token')
    router.push('/crm/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C]"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const stats = [
    { 
      label: 'Aktiva kunder', 
      value: '156', 
      change: '+12%', 
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Nya leads', 
      value: '23', 
      change: '+5%', 
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'Pågående uppdrag', 
      value: '8', 
      change: '-2%', 
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      label: 'Månadens omsättning', 
      value: '458k', 
      change: '+18%', 
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
  ]

  const recentActivities = [
    { type: 'lead', message: 'Ny lead från kontaktformulär', time: 'För 2 timmar sedan', icon: Mail },
    { type: 'job', message: 'Uppdrag #1234 markerat som slutfört', time: 'För 3 timmar sedan', icon: CheckCircle },
    { type: 'invoice', message: 'Faktura skickad till Kund AB', time: 'För 5 timmar sedan', icon: DollarSign },
    { type: 'staff', message: 'Ny anställd registrerad', time: 'Igår', icon: Users },
  ]

  const upcomingJobs = [
    { id: '1235', customer: 'Anna Andersson', date: '2024-01-15', status: 'scheduled' },
    { id: '1236', customer: 'Företag AB', date: '2024-01-16', status: 'confirmed' },
    { id: '1237', customer: 'Erik Eriksson', date: '2024-01-17', status: 'scheduled' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-[#002A5C]">Nordflytt CRM</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} • <span className="text-gray-500">{user.role}</span>
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Välkommen tillbaka, {user.name.split(' ')[0]}!</h2>
          <p className="text-gray-600 mt-1">Här är en översikt över dagens aktiviteter</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </CardTitle>
                  <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs mt-1 ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} från förra månaden
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Senaste aktiviteter</CardTitle>
              <CardDescription>Vad som hänt i systemet nyligen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Kommande uppdrag</CardTitle>
              <CardDescription>Nästa veckas schemalagda jobb</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{job.id}</p>
                      <p className="text-sm text-gray-600">{job.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{job.date}</p>
                      <Badge variant={job.status === 'confirmed' ? 'default' : 'secondary'}>
                        {job.status === 'confirmed' ? 'Bekräftad' : 'Schemalagd'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/crm/uppdrag">Visa alla uppdrag</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
            <CardDescription>Vanliga uppgifter du kan utföra</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" asChild>
                <Link href="/crm/kunder">
                  <Users className="mr-2 h-4 w-4" />
                  Ny kund
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/crm/leads">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Ny lead
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/crm/uppdrag">
                  <Package className="mr-2 h-4 w-4" />
                  Nytt uppdrag
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/crm/ekonomi">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Skapa faktura
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
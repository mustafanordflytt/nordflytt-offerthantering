'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SimpleDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('crm_user')
    if (!savedUser) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(savedUser))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('crm_user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C]"></div>
      </div>
    )
  }

  const menuItems = [
    { name: 'Kunder', href: '/crm/kunder', icon: '👥' },
    { name: 'Leads', href: '/crm/leads', icon: '🎯' },
    { name: 'Uppdrag', href: '/crm/uppdrag', icon: '📋' },
    { name: 'Anställda', href: '/crm/anstallda', icon: '👷' },
    { name: 'Ekonomi', href: '/crm/ekonomi', icon: '💰' },
    { name: 'Rapporter', href: '/crm/rapporter', icon: '📊' },
  ]

  const stats = [
    { label: 'Aktiva kunder', value: '156', change: '+12%' },
    { label: 'Nya leads', value: '23', change: '+5%' },
    { label: 'Pågående uppdrag', value: '8', change: '-2%' },
    { label: 'Månadens omsättning', value: '458k', change: '+18%' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-[#002A5C]">Nordflytt CRM</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Inloggad som: <strong>{user.name}</strong> ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logga ut
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h2>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <p className={`text-sm mt-2 ${
                stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} från förra månaden
              </p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Snabblänkar</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-gray-900">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Senaste aktiviteter</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Ny lead från kontaktformulär</span>
              <span className="text-xs text-gray-500">För 2 timmar sedan</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Uppdrag #1234 markerat som slutfört</span>
              <span className="text-xs text-gray-500">För 3 timmar sedan</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Faktura skickad till Kund AB</span>
              <span className="text-xs text-gray-500">För 5 timmar sedan</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Ny anställd registrerad</span>
              <span className="text-xs text-gray-500">Igår</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
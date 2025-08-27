'use client'

import React, { useState, useEffect } from 'react'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'
import CRMMobileNav from '@/components/crm/CRMMobileNav'
import CRMErrorBoundary from '@/components/error-boundary/CRMErrorBoundary'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ClipboardList, 
  TrendingUp, 
  Calendar,
  FileText,
  Settings,
  Building2,
  Package,
  Brain,
  Calculator,
  Bot,
  Rocket,
  Network,
  Target,
  Award,
  Scale,
  Package2,
  Warehouse,
  Truck,
  Activity,
  Workflow,
  LogOut,
  User,
  Wifi
} from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/crm/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Kunder',
    href: '/crm/kunder',
    icon: Users
  },
  {
    title: 'Leads',
    href: '/crm/leads',
    icon: TrendingUp
  },
  {
    title: 'Uppdrag',
    href: '/crm/uppdrag',
    icon: Package
  },
  {
    title: 'Offerter',
    href: '/crm/offerter',
    icon: FileText
  },
  {
    title: 'Anställda',
    href: '/crm/anstallda',
    icon: UserCheck
  },
  {
    title: 'Rekrytering',
    href: '/crm/rekrytering',
    icon: Target
  },
  {
    title: 'Ärenden',
    href: '/crm/arenden',
    icon: ClipboardList
  },
  {
    title: 'Kalender',
    href: '/crm/kalender',
    icon: Calendar
  },
  {
    title: 'Offentliga Upphandlingar',
    href: '/crm/offentliga-upphandlingar',
    icon: Award
  },
  {
    title: 'Juridik & Risk',
    href: '/crm/juridik-risk',
    icon: Scale
  },
  {
    title: 'Lager',
    href: '/crm/lager',
    icon: Package2
  },
  {
    title: 'Kundmagasin',
    href: '/crm/kundmagasin',
    icon: Warehouse
  },
  {
    title: 'Leverantörer',
    href: '/crm/leverantorer',
    icon: Truck
  },
  {
    title: 'API Management',
    href: '/crm/api-management',
    icon: Activity
  },
  {
    title: 'AI Features',
    href: '/crm/ai-features',
    icon: Brain
  },
  {
    title: 'AI-Optimering',
    href: '/crm/ai-optimering',
    icon: Brain
  },
  {
    title: 'Automation',
    href: '/crm/automation',
    icon: Workflow
  },
  {
    title: 'AI Kundtjänst',
    href: '/crm/ai-kundtjanst',
    icon: Bot
  },
  {
    title: 'AI-Marknadsföring',
    href: '/crm/ai-marknadsforing',
    icon: Rocket
  },
  {
    title: 'Samarbeten',
    href: '/crm/samarbeten',
    icon: Network
  },
  {
    title: 'Ekonomi & AI',
    href: '/crm/ekonomi',
    icon: Calculator
  },
  {
    title: 'Rapporter',
    href: '/crm/rapporter',
    icon: FileText
  },
  {
    title: 'Dokument',
    href: '/crm/dokument',
    icon: Building2
  },
  {
    title: 'Real-time Demo',
    href: '/crm/realtime-demo',
    icon: Wifi
  },
  {
    title: 'Inställningar',
    href: '/crm/installningar',
    icon: Settings
  }
]

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [layoutKey, setLayoutKey] = React.useState(0)
  const { user, loading, signOut } = useAuth()
  
  // Handle logout
  const handleLogout = async () => {
    await signOut()
  }
  
  // Force complete layout re-render when pathname changes
  React.useEffect(() => {
    setLayoutKey(prev => prev + 1)
  }, [pathname])
  
  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-[#002A5C] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <p className="text-gray-600">Laddar CRM...</p>
        </div>
      </div>
    )
  }
  
  // Special handling for login page - show without layout
  if (pathname === '/crm/login') {
    return <>{children}</>
  }
  
  // Show nothing if not authenticated (AuthProvider will redirect)
  if (!user) {
    return null
  }

  return (
    <CRMErrorBoundary>
      <div key={layoutKey} className={cn('min-h-screen bg-gray-50 flex', inter.className)}>
        {/* Desktop Sidebar - Always visible on desktop */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0 h-screen sticky top-0">
        <div className="p-6">
          <Link href="/crm/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#002A5C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-[#002A5C]">Nordflytt CRM</span>
          </Link>
        </div>
        
        <nav className="px-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-[#002A5C] text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
        
        {/* User section */}
        <div className="mt-auto p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#002A5C] rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  user.role === 'admin' ? 'bg-red-100 text-red-700' :
                  user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                )}>
                  {user.role}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="w-8 h-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - responsive */}
          <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* Mobile Navigation */}
                <CRMMobileNav currentUser={user} onLogout={handleLogout} />
                
                {/* Desktop title - hidden on mobile */}
                <h1 className="hidden md:block text-2xl font-semibold text-gray-900">
                  {sidebarItems.find(item => item.href === pathname)?.title || 'CRM'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/order-confirmation" 
                  className="hidden md:inline text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Tillbaka till kundområde
                </Link>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </CRMErrorBoundary>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Menu, 
  X,
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
  ChevronDown,
  Star
} from 'lucide-react'
import { CRMUser } from '@/lib/auth/crm-auth'

const sidebarItems = [
  // Core CRM
  { title: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard, category: 'core', priority: 'high' },
  { title: 'Kunder', href: '/crm/kunder', icon: Users, category: 'core', priority: 'high' },
  { title: 'Leads', href: '/crm/leads', icon: TrendingUp, category: 'core', priority: 'high' },
  { title: 'Uppdrag', href: '/crm/uppdrag', icon: Package, category: 'core', priority: 'high' },
  { title: 'Offerter', href: '/crm/offerter', icon: FileText, category: 'core', priority: 'high' },
  
  // Team Management
  { title: 'Anställda', href: '/crm/anstallda', icon: UserCheck, category: 'team', priority: 'medium' },
  { title: 'Rekrytering', href: '/crm/rekrytering', icon: Target, category: 'team', priority: 'medium' },
  { title: 'Kalender', href: '/crm/kalender', icon: Calendar, category: 'team', priority: 'medium' },
  
  // Operations
  { title: 'Ärenden', href: '/crm/arenden', icon: ClipboardList, category: 'operations', priority: 'medium' },
  { title: 'Lager', href: '/crm/lager', icon: Package2, category: 'operations', priority: 'low' },
  { title: 'Kundmagasin', href: '/crm/kundmagasin', icon: Warehouse, category: 'operations', priority: 'low' },
  { title: 'Leverantörer', href: '/crm/leverantorer', icon: Truck, category: 'operations', priority: 'low' },
  
  // Business Development
  { title: 'Offentliga Upphandlingar', href: '/crm/offentliga-upphandlingar', icon: Award, category: 'business', priority: 'low' },
  { title: 'Samarbeten', href: '/crm/samarbeten', icon: Network, category: 'business', priority: 'low' },
  
  // AI & Automation
  { title: 'AI-Optimering', href: '/crm/ai-optimering', icon: Brain, category: 'ai', priority: 'medium' },
  { title: 'AI Kundtjänst', href: '/crm/ai-kundtjanst', icon: Bot, category: 'ai', priority: 'medium' },
  { title: 'AI-Marknadsföring', href: '/crm/ai-marknadsforing', icon: Rocket, category: 'ai', priority: 'medium' },
  { title: 'Automation', href: '/crm/automation', icon: Workflow, category: 'ai', priority: 'low' },
  
  // Admin
  { title: 'Juridik & Risk', href: '/crm/juridik-risk', icon: Scale, category: 'admin', priority: 'low' },
  { title: 'Ekonomi & AI', href: '/crm/ekonomi', icon: Calculator, category: 'admin', priority: 'medium' },
  { title: 'API Management', href: '/crm/api-management', icon: Activity, category: 'admin', priority: 'low' },
  { title: 'Rapporter', href: '/crm/rapporter', icon: FileText, category: 'admin', priority: 'medium' },
  { title: 'Dokument', href: '/crm/dokument', icon: Building2, category: 'admin', priority: 'medium' },
  { title: 'Inställningar', href: '/crm/installningar', icon: Settings, category: 'admin', priority: 'low' }
]

const categories = {
  core: { label: 'Kärn-CRM', color: 'bg-blue-100 text-blue-800' },
  team: { label: 'Team', color: 'bg-green-100 text-green-800' },
  operations: { label: 'Drift', color: 'bg-yellow-100 text-yellow-800' },
  business: { label: 'Affär', color: 'bg-purple-100 text-purple-800' },
  ai: { label: 'AI & Auto', color: 'bg-pink-100 text-pink-800' },
  admin: { label: 'Admin', color: 'bg-gray-100 text-gray-800' }
}

interface CRMMobileNavProps {
  currentUser: CRMUser
  onLogout: () => void
}

export default function CRMMobileNav({ currentUser, onLogout }: CRMMobileNavProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('core')
  const [quickAccess, setQuickAccess] = useState<string[]>([])

  // Auto-close on navigation
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Load user's quick access preferences
  useEffect(() => {
    const saved = localStorage.getItem(`crm_quick_access_${currentUser.id}`)
    if (saved) {
      try {
        setQuickAccess(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load quick access:', error)
      }
    } else {
      // Default quick access based on role
      const defaults = currentUser.role === 'admin' 
        ? ['/crm/dashboard', '/crm/kunder', '/crm/anstallda', '/crm/rapporter']
        : ['/crm/dashboard', '/crm/kunder', '/crm/leads', '/crm/uppdrag']
      setQuickAccess(defaults)
    }
  }, [currentUser])

  const toggleQuickAccess = (href: string) => {
    const newQuickAccess = quickAccess.includes(href)
      ? quickAccess.filter(item => item !== href)
      : [...quickAccess, href].slice(0, 6) // Max 6 quick access items

    setQuickAccess(newQuickAccess)
    localStorage.setItem(`crm_quick_access_${currentUser.id}`, JSON.stringify(newQuickAccess))
  }

  const getVisibleItems = (categoryKey: string) => {
    return sidebarItems.filter(item => {
      // Category filter
      if (item.category !== categoryKey) return false
      
      // Role-based filtering
      if (currentUser.role === 'readonly' && ['admin'].includes(item.category)) return false
      if (currentUser.role === 'employee' && ['admin', 'ai'].includes(item.category)) return false
      
      return true
    })
  }

  const quickAccessItems = sidebarItems.filter(item => quickAccess.includes(item.href))

  return (
    <>
      {/* Mobile menu trigger */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden p-2 h-10 w-10"
              aria-label="Öppna navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="p-6 pb-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#002A5C] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-lg font-bold text-[#002A5C]">
                      Nordflytt CRM
                    </SheetTitle>
                    <div className="text-xs text-gray-500">
                      Mobile Navigation
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* User info */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#002A5C] rounded-full flex items-center justify-center">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUser.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500 truncate">
                        {currentUser.email}
                      </p>
                      <Badge variant="outline" className={cn(
                        'text-xs px-2 py-0.5',
                        currentUser.role === 'admin' ? 'bg-red-100 text-red-700' :
                        currentUser.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {currentUser.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Access */}
              {quickAccessItems.length > 0 && (
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    Snabbåtkomst
                  </h3>
                  <div className="space-y-1">
                    {quickAccessItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm rounded-md transition-colors w-full',
                            isActive
                              ? 'bg-[#002A5C] text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Categories */}
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                  {Object.entries(categories).map(([categoryKey, categoryConfig]) => {
                    const items = getVisibleItems(categoryKey)
                    if (items.length === 0) return null

                    const isExpanded = expandedCategory === categoryKey
                    
                    return (
                      <div key={categoryKey}>
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                          className="flex items-center justify-between w-full py-2 px-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                        >
                          <div className="flex items-center">
                            <Badge variant="outline" className={cn('mr-2 text-xs', categoryConfig.color)}>
                              {items.length}
                            </Badge>
                            <span>{categoryConfig.label}</span>
                          </div>
                          <ChevronDown className={cn(
                            'h-4 w-4 transition-transform',
                            isExpanded && 'rotate-180'
                          )} />
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1 pl-2">
                            {items.map((item) => {
                              const Icon = item.icon
                              const isActive = pathname === item.href
                              const isQuickAccess = quickAccess.includes(item.href)
                              
                              return (
                                <div key={item.href} className="group relative">
                                  <Link
                                    href={item.href}
                                    className={cn(
                                      'flex items-center px-3 py-2 text-sm rounded-md transition-colors w-full pr-8',
                                      isActive
                                        ? 'bg-[#002A5C] text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    )}
                                  >
                                    <Icon className="mr-3 h-4 w-4" />
                                    <span className="truncate">{item.title}</span>
                                  </Link>
                                  
                                  {/* Quick access toggle */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      toggleQuickAccess(item.href)
                                    }}
                                    className={cn(
                                      'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                                      isActive ? 'hover:bg-white/20' : 'hover:bg-gray-200'
                                    )}
                                    aria-label={isQuickAccess ? 'Ta bort från snabbåtkomst' : 'Lägg till i snabbåtkomst'}
                                  >
                                    <Star className={cn(
                                      'h-3 w-3',
                                      isQuickAccess ? 'fill-current text-yellow-500' : 'text-gray-400'
                                    )} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Footer with logout */}
              <div className="p-4 border-t bg-gray-50">
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logga ut
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop indicator - shows current page on mobile header */}
      <div className="md:hidden flex-1 px-4">
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {sidebarItems.find(item => item.href === pathname)?.title || 'CRM'}
        </h1>
      </div>
    </>
  )
}
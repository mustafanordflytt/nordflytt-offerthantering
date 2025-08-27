'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || ''
  
  useEffect(() => {
    // Redirect based on where user came from
    if (from.includes('/staff')) {
      router.push('/staff/login')
    } else if (from.includes('/crm')) {
      router.push('/crm/login')
    } else {
      // Default to CRM login
      router.push('/crm/login')
    }
  }, [router, from])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C] mx-auto"></div>
        <p className="mt-4 text-gray-600">Omdirigerar...</p>
      </div>
    </div>
  )
}
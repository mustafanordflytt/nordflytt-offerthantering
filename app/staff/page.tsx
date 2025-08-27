'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffLoginRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to new phone-based login
    router.push('/staff/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C] mx-auto"></div>
        <p className="mt-4 text-gray-600">Omdirigerar till inloggning...</p>
      </div>
    </div>
  )
}
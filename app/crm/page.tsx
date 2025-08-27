'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CRMRootPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard as default CRM page
    router.replace('/crm/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Omdirigerar till CRM dashboard...</p>
    </div>
  )
}

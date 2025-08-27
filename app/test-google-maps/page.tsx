"use client"

import { useEffect, useState } from 'react'

export default function TestGoogleMaps() {
  const [status, setStatus] = useState<string>('Loading...')
  const [details, setDetails] = useState<any>({})

  useEffect(() => {
    const checkGoogleMaps = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      setDetails({
        apiKeyExists: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        windowGoogle: typeof window !== 'undefined' && typeof window.google !== 'undefined',
        googleMaps: typeof window !== 'undefined' && typeof window.google?.maps !== 'undefined',
        googlePlaces: typeof window !== 'undefined' && typeof window.google?.maps?.places !== 'undefined',
      })

      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        setStatus('✅ Google Maps API loaded successfully!')
      } else {
        setStatus('❌ Google Maps API not loaded')
        // Retry after 1 second
        setTimeout(checkGoogleMaps, 1000)
      }
    }

    checkGoogleMaps()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Google Maps API Test</h1>
      <div className="text-xl mb-4">{status}</div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Details:</h2>
        <pre className="text-sm">{JSON.stringify(details, null, 2)}</pre>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          API Key from env: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Not set'}
        </p>
      </div>
    </div>
  )
}
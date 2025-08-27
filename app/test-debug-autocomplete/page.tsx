"use client"

import { useState, useEffect } from 'react'
import CustomAddressAutocomplete from '@/components/CustomAddressAutocomplete'

export default function TestDebugAutocompletePage() {
  const [address, setAddress] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [componentMounted, setComponentMounted] = useState(false)

  useEffect(() => {
    console.log('🚀 TestDebugAutocompletePage mounted')
    setComponentMounted(true)
    
    // Check if component exists
    setDebugInfo(prev => ({
      ...prev,
      customComponentExists: !!CustomAddressAutocomplete,
      timestamp: new Date().toISOString()
    }))
  }, [])

  useEffect(() => {
    console.log('📝 Address changed:', address)
    setDebugInfo(prev => ({
      ...prev,
      currentValue: address,
      valueLength: address.length
    }))
  }, [address])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Autocomplete Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Input</h2>
        
        {componentMounted ? (
          <CustomAddressAutocomplete
            value={address}
            onChange={setAddress}
            placeholder="Type 'Kung' or 'Drott'..."
            className="w-full"
          />
        ) : (
          <div className="text-gray-500">Loading component...</div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          Current value: <strong>{address || '(empty)'}</strong>
        </div>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        
        <div className="mt-4 space-y-2 text-sm">
          <div>Component mounted: {componentMounted ? '✅ Yes' : '❌ No'}</div>
          <div>Component exists: {debugInfo.customComponentExists ? '✅ Yes' : '❌ No'}</div>
          <div>Port: {typeof window !== 'undefined' ? window.location.port : 'N/A'}</div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Type "Kung" to see Kungsgatan addresses</li>
          <li>• Type "Drott" to see Drottninggatan addresses</li>
          <li>• Check browser console for logs</li>
          <li>• Check if dropdown appears below input</li>
        </ul>
      </div>
    </div>
  )
}
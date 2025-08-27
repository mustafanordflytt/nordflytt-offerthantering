"use client"

import { useState } from 'react'
import AddressInputWithGoogleFallback from '../components/AddressInputWithGoogleFallback'

export default function TestGoogleAutocompletePage() {
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🗺️ Test Google Maps Autocomplete</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Från adress</h2>
          <AddressInputWithGoogleFallback
            value={address1}
            onChange={setAddress1}
            placeholder="Sök efter en svensk adress..."
          />
          <p className="text-sm text-gray-600 mt-2">
            Värde: {address1 || '(tomt)'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Till adress</h2>
          <AddressInputWithGoogleFallback
            value={address2}
            onChange={setAddress2}
            placeholder="Sök efter en svensk adress..."
          />
          <p className="text-sm text-gray-600 mt-2">
            Värde: {address2 || '(tomt)'}
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">ℹ️ Information:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Google Maps API måste vara aktiverat med Places API</li>
            <li>API-nyckeln finns i miljövariablerna</li>
            <li>Autocomplete är begränsat till svenska adresser</li>
            <li>Om Google Maps inte fungerar, skriv adressen manuellt</li>
          </ul>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Port: {typeof window !== 'undefined' ? window.location.port : 'N/A'}
        </div>
      </div>
    </div>
  )
}
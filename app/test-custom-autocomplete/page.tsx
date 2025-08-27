"use client"

import { useState } from 'react'
import CustomAddressAutocomplete from '@/components/CustomAddressAutocomplete'

export default function TestCustomAutocompletePage() {
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Test Custom Address Autocomplete</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Från adress</h2>
          <CustomAddressAutocomplete
            value={address1}
            onChange={setAddress1}
            placeholder="Börja skriva 'Kung' eller 'Drott'..."
          />
          <p className="text-sm text-gray-600 mt-2">
            Nuvarande värde: {address1 || '(tomt)'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Till adress</h2>
          <CustomAddressAutocomplete
            value={address2}
            onChange={setAddress2}
            placeholder="Börja skriva en adress..."
          />
          <p className="text-sm text-gray-600 mt-2">
            Nuvarande värde: {address2 || '(tomt)'}
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Instruktioner:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Börja skriva "Kung", "Drott", "Vasa" eller "Svea"</li>
            <li>En dropdown ska visas med matchande adresser</li>
            <li>Använd piltangenter för att navigera</li>
            <li>Tryck Enter för att välja</li>
            <li>Klicka utanför för att stänga dropdown</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">🔧 Felsökning:</h3>
          <p className="text-sm text-yellow-700">
            Om ingen dropdown visas, öppna konsolen (F12) och kolla efter fel.
            Komponenten ska fungera utan Google Maps API.
          </p>
        </div>
      </div>
    </div>
  )
}
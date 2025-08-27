"use client"

import { useState } from "react"
import AddressInputWithGoogleFallback from "../components/AddressInputWithGoogleFallback"

export default function TestAutocompletePage() {
  const [fromAddress, setFromAddress] = useState("")
  const [toAddress, setToAddress] = useState("")

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Test Google Places API (New)</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Från adress (From address)
            </label>
            <AddressInputWithGoogleFallback
              id="from-address"
              value={fromAddress}
              onChange={setFromAddress}
              placeholder="Sök adress eller skriv manuellt..."
            />
            {fromAddress && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <strong>{fromAddress}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Till adress (To address)
            </label>
            <AddressInputWithGoogleFallback
              id="to-address"
              value={toAddress}
              onChange={setToAddress}
              placeholder="Sök adress eller skriv manuellt..."
            />
            {toAddress && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <strong>{toAddress}</strong>
              </p>
            )}
          </div>

          <div className="border-t pt-6">
            <h2 className="font-semibold mb-2">Instructions:</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Click in either address field</li>
              <li>Start typing \"Kungsgatan\" or any Swedish address</li>
              <li>You should see autocomplete suggestions appear</li>
              <li>Click on a suggestion to select it</li>
            </ol>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">
              This page tests the NEW Google Places API (PlaceAutocompleteElement)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

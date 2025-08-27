'use client'

import React from 'react'

interface ContractTabDebugProps {
  staff: {
    id: string
    name: string
    role: string
    email: string
    contracts?: any
  }
}

export default function ContractTabDebug({ staff }: ContractTabDebugProps) {
  console.log('ContractTabDebug rendering with staff:', staff)
  
  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
      <h2 className="text-xl font-bold mb-4">Debug: Contract Tab</h2>
      <p>Staff Name: {staff.name}</p>
      <p>Staff ID: {staff.id}</p>
      <p>Staff Email: {staff.email}</p>
      <p>Contracts: {JSON.stringify(staff.contracts)}</p>
      
      <div className="mt-4 p-4 bg-white rounded">
        <h3 className="font-semibold">Detta är en debug-version</h3>
        <p>Om du ser detta fungerar contract-fliken men komponenten laddas inte korrekt.</p>
      </div>
    </div>
  )
}
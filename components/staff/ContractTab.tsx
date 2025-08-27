'use client'

import React, { useState, useEffect } from 'react'
import ContractManagement from '@/components/contracts/ContractManagement'
import { useToast } from '@/hooks/use-toast'

interface ContractTabProps {
  staff: {
    id: string
    name: string
    role: string
    email: string
    contracts?: any
  }
}

export default function ContractTab({ staff }: ContractTabProps) {
  // Use staff_id if available, otherwise use id
  const staffId = (staff as any).staff_id || (staff as any).staffId || staff.id
  const [contracts, setContracts] = useState(staff.contracts || {})
  const [previousStatus, setPreviousStatus] = useState(contracts?.current?.status)
  const { toast } = useToast()
  
  // Hämta uppdaterade kontrakt när komponenten laddas
  useEffect(() => {
    fetchContracts()
  }, [staffId])
  
  const fetchContracts = async () => {
    try {
      const response = await fetch(`/api/employees/${staffId}`)
      if (response.ok) {
        const result = await response.json()
        console.log('API Response:', result) // Debug
        
        // API returnerar data inom ett "data" objekt
        const employeeData = result.data || result
        
        if (employeeData.contracts) {
          console.log('Contracts found:', employeeData.contracts) // Debug
          // Kontrollera om status har ändrats
          const newStatus = employeeData.contracts?.current?.status
          if (previousStatus === 'sent' && newStatus === 'signed') {
            // Visa notifikation när avtalet signerats
            toast({
              title: "✅ Avtal signerat!",
              description: `${staff.name} har signerat anställningsavtalet.`
            })
          }
          setPreviousStatus(newStatus)
          setContracts(employeeData.contracts)
        } else {
          console.log('No contracts found in response') // Debug
        }
      }
    } catch (error) {
      console.error('Fel vid hämtning av kontrakt:', error)
    }
  }
  
  // Polling för att hämta uppdateringar var 3:e sekund när avtalet är skickat
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (contracts?.current?.status === 'sent') {
      console.log('Starting polling for contract status updates...')
      
      // Starta polling direkt och sedan var 3:e sekund
      interval = setInterval(() => {
        console.log('Polling for contract updates...')
        fetchContracts()
      }, 3000) // Hämta var 3:e sekund
    }
    
    return () => {
      if (interval) {
        console.log('Stopping polling')
        clearInterval(interval)
      }
    }
  }, [contracts?.current?.status, staffId])
  
  return (
    <ContractManagement
      staffId={staffId}
      staffName={staff.name}
      staffRole={staff.role}
      staffEmail={staff.email}
      contracts={contracts}
    />
  )
}
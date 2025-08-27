'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import ContractGenerator from './ContractGenerator'
import ContractStatus from './ContractStatus'

interface ContractManagementProps {
  staffId: string
  staffName: string
  staffRole: string
  staffEmail: string
  contracts: any
}

const ContractManagement = ({ 
  staffId, 
  staffName, 
  staffRole, 
  staffEmail, 
  contracts 
}: ContractManagementProps) => {
  const [contractData, setContractData] = useState(contracts)
  
  useEffect(() => {
    console.log('ContractManagement - contracts prop updated:', contracts)
    setContractData(contracts)
  }, [contracts])

  const handleContractGenerated = async (newContractData: any) => {
    console.log('handleContractGenerated called with:', newContractData)
    // Uppdatera lokal state direkt
    setContractData((prev: any) => ({
      ...prev,
      current: newContractData
    }))
    
    // Hämta fullständig data från servern
    try {
      const response = await fetch(`/api/employees/${staffId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.contracts) {
          setContractData(data.contracts)
        }
      }
    } catch (error) {
      console.error('Fel vid uppdatering av kontrakt:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Anställningsavtal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generera och hantera anställningsavtal för {staffName}
            </p>
            <ContractGenerator
              employeeId={staffId}
              employeeName={staffName}
              currentRole={staffRole}
              onContractGenerated={handleContractGenerated}
            />
          </div>
        </CardContent>
      </Card>

      <ContractStatus
        contract={contractData?.current || null}
        employeeEmail={staffEmail}
        employeeId={staffId}
        onContractSent={async () => {
          // Hämta uppdaterad data direkt
          try {
            const response = await fetch(`/api/employees/${staffId}`)
            if (response.ok) {
              const result = await response.json()
              const employeeData = result.data || result
              console.log('Contract sent - updating data:', employeeData.contracts)
              if (employeeData.contracts) {
                setContractData(employeeData.contracts)
              }
            }
          } catch (error) {
            console.error('Fel vid uppdatering efter skickande:', error)
          }
        }}
      />
    </div>
  )
}

export default ContractManagement
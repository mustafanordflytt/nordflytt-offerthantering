'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { FileText, Loader2 } from 'lucide-react'

interface ContractGeneratorProps {
  employeeId: string
  employeeName: string
  currentRole: string
  onContractGenerated?: (contract: any) => void
}

const ContractGenerator = ({ 
  employeeId, 
  employeeName, 
  currentRole,
  onContractGenerated 
}: ContractGeneratorProps) => {
  const [contractType, setContractType] = useState(currentRole || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const contractTypes = [
    { value: 'flyttpersonal_utan_korkort', label: 'Flyttpersonal utan körkort' },
    { value: 'flyttpersonal_b_korkort', label: 'Flyttpersonal med B-körkort' },
    { value: 'flyttpersonal_c_korkort', label: 'Flyttpersonal med C-körkort' },
    { value: 'flyttstadning', label: 'Flyttstädning' },
    { value: 'flytt_stad_utan_korkort', label: 'Flytt & Städ utan körkort' },
    { value: 'flytt_stad_med_korkort', label: 'Flytt & Städ med körkort' },
    { value: 'kundtjanst', label: 'Kundtjänst' },
    { value: 'flyttledare', label: 'Flyttledare' }
  ]

  const handleGenerateContract = async () => {
    console.log('handleGenerateContract called, contractType:', contractType)
    
    if (!contractType) {
      toast({
        title: "Välj avtalstyp",
        description: "Du måste välja en avtalstyp först",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    console.log('Generating contract for employee:', employeeId, 'type:', contractType)

    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId,
          contractType
        })
      })

      const data = await response.json()

      console.log('Response status:', response.status, 'data:', data)
      
      if (response.ok) {
        toast({
          title: "Avtal genererat",
          description: `Anställningsavtal för ${employeeName} har skapats`
        })

        if (onContractGenerated) {
          console.log('Calling onContractGenerated with:', data.contract)
          onContractGenerated(data.contract)
        }
      } else {
        toast({
          title: "Fel vid generering",
          description: data.error || "Kunde inte generera avtal",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Fel vid generering av avtal:', error)
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select value={contractType} onValueChange={setContractType}>
        <SelectTrigger className="w-full sm:w-[250px]">
          <SelectValue placeholder="Välj avtalstyp" />
        </SelectTrigger>
        <SelectContent>
          {contractTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        onClick={handleGenerateContract}
        disabled={isGenerating || !contractType}
        className="bg-[#002A5C] hover:bg-[#001A3C]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Genererar...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Generera avtal
          </>
        )}
      </Button>
    </div>
  )
}

export default ContractGenerator
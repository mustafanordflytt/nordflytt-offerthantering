'use client'

import { useState, useEffect } from 'react'
import { getCurrentWorkTime } from '@/lib/time-tracking'

interface ServiceTimeDisplayProps {
  jobId: string
  isActive: boolean
}

export default function ServiceTimeDisplay({ jobId, isActive }: ServiceTimeDisplayProps) {
  const [displayTime, setDisplayTime] = useState('0m')

  useEffect(() => {
    if (!isActive) {
      setDisplayTime('0m')
      return
    }

    const updateTime = () => {
      const workTime = getCurrentWorkTime(jobId)
      
      if (workTime.isActive) {
        if (workTime.hours === 0 && workTime.minutes === 0) {
          setDisplayTime('Precis startad')
        } else if (workTime.hours === 0) {
          setDisplayTime(`${workTime.minutes}m`)
        } else {
          setDisplayTime(`${workTime.hours}h ${workTime.minutes}m`)
        }
      } else {
        setDisplayTime('0m')
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [jobId, isActive])

  return <span className="text-xs text-gray-600">{displayTime} pågående</span>
}
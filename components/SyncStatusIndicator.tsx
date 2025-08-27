'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react'

interface SyncStatusIndicatorProps {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'offline'
  message?: string
  className?: string
}

export default function SyncStatusIndicator({ status, message, className = '' }: SyncStatusIndicatorProps) {
  const [show, setShow] = useState(true)
  
  // Auto-hide success status after 3 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setShow(false)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShow(true)
    }
  }, [status])
  
  if (!show && status === 'success') return null
  
  const statusConfig = {
    idle: {
      icon: Cloud,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      text: 'Redo att synka'
    },
    syncing: {
      icon: Loader2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      text: 'Synkar...',
      animate: true
    },
    success: {
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      text: 'Synkad!'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      text: 'Synkfel'
    },
    offline: {
      icon: CloudOff,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      text: 'Offline'
    }
  }
  
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.color} ${className}`}>
      <Icon 
        className={`h-3.5 w-3.5 ${config.animate ? 'animate-spin' : ''}`} 
      />
      <span>{message || config.text}</span>
    </div>
  )
}

// Hook to manage sync status
export function useSyncStatus() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'offline'>('idle')
  const [message, setMessage] = useState<string>()
  
  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      if (!navigator.onLine) {
        setStatus('offline')
        setMessage('Ingen internetanslutning')
      } else if (status === 'offline') {
        setStatus('idle')
        setMessage(undefined)
      }
    }
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Initial check
    updateOnlineStatus()
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [status])
  
  const startSync = (customMessage?: string) => {
    setStatus('syncing')
    setMessage(customMessage || 'Sparar ändringar...')
  }
  
  const syncSuccess = (customMessage?: string) => {
    setStatus('success')
    setMessage(customMessage || 'Sparat!')
  }
  
  const syncError = (error?: string) => {
    setStatus('error')
    setMessage(error || 'Kunde inte spara')
  }
  
  return {
    status,
    message,
    startSync,
    syncSuccess,
    syncError,
    isOnline: status !== 'offline'
  }
}
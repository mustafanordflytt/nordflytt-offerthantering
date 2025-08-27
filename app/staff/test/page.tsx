'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffTest() {
  const router = useRouter()
  const [status, setStatus] = useState('Checking...')
  const [auth, setAuth] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    checkStaffAccess()
  }, [])

  const checkStaffAccess = async () => {
    try {
      // Step 1: Check auth
      setStatus('Checking authentication...')
      const authData = localStorage.getItem('staff_auth')
      
      if (!authData) {
        setStatus('No auth found - need to login')
        setError('Not authenticated')
        setTimeout(() => router.push('/staff'), 2000)
        return
      }

      const parsedAuth = JSON.parse(authData)
      setAuth(parsedAuth)
      setStatus('Authenticated as: ' + parsedAuth.name)

      // Step 2: Try to load jobs
      setStatus('Loading jobs...')
      const response = await fetch('/api/staff/jobs')
      const data = await response.json()
      
      if (data.success) {
        setJobs(data.jobs || [])
        setStatus(`Loaded ${data.jobs?.length || 0} jobs`)
      } else {
        setError('Failed to load jobs: ' + (data.error || 'Unknown error'))
      }

    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Unknown error')
      setStatus('Error occurred')
    }
  }

  const quickLogin = () => {
    const testAuth = {
      id: 'test-' + Date.now(),
      name: 'Test Staff',
      email: 'test@nordflytt.se',
      role: 'staff',
      loginTime: new Date().toISOString()
    }
    localStorage.setItem('staff_auth', JSON.stringify(testAuth))
    window.location.reload()
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Staff Debug Page</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Status: {status}</h2>
        
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            Error: {error}
          </div>
        )}

        {auth && (
          <div style={{ marginTop: '20px', background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
            <h3>Authenticated User:</h3>
            <pre>{JSON.stringify(auth, null, 2)}</pre>
          </div>
        )}

        {jobs.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Jobs Found: {jobs.length}</h3>
            {jobs.slice(0, 3).map((job, i) => (
              <div key={i} style={{ background: '#f9f9f9', padding: '10px', margin: '5px 0', borderRadius: '5px' }}>
                <strong>{job.customerName}</strong><br />
                {job.fromAddress} → {job.toAddress}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={quickLogin}
            style={{
              background: '#002A5C',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Quick Login
          </button>
          
          <button 
            onClick={() => router.push('/staff/dashboard')}
            style={{
              background: '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Try Dashboard
          </button>

          <button 
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            style={{
              background: '#dc3545',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  )
}
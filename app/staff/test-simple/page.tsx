'use client'

import { useEffect, useState } from 'react'

export default function TestSimple() {
  const [auth, setAuth] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check auth
        const authData = localStorage.getItem('staff_auth')
        if (!authData) {
          setError('Not authenticated')
          setLoading(false)
          return
        }
        
        setAuth(JSON.parse(authData))
        
        // Load jobs
        const response = await fetch('/api/staff/jobs')
        const data = await response.json()
        
        if (data.success) {
          setJobs(data.jobs || [])
        } else {
          setError(data.error || 'Failed to load jobs')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px'
      }}>
        Laddar...
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Staff Test - Simple</h1>
      
      {error && (
        <div style={{ 
          background: '#ffcccc', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}
      
      {!auth && (
        <button
          onClick={quickLogin}
          style={{
            background: '#002A5C',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          Quick Login
        </button>
      )}
      
      {auth && (
        <>
          <div style={{ 
            background: '#e6f3ff', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>Inloggad som: {auth.name}</h3>
            <p>{auth.email}</p>
          </div>
          
          <h2>Dagens jobb ({jobs.length})</h2>
          
          {jobs.length === 0 ? (
            <p>Inga jobb hittades</p>
          ) : (
            <div style={{ marginTop: '20px' }}>
              {jobs.map((job, i) => (
                <div key={i} style={{ 
                  background: '#f9f9f9', 
                  padding: '15px', 
                  marginBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <h3>{job.bookingNumber}</h3>
                  <p><strong>{job.customerName}</strong></p>
                  <p>{job.fromAddress}</p>
                  <p>→ {job.toAddress}</p>
                  <p>Tid: {job.moveTime} - {job.endTime}</p>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={() => window.location.href = '/staff/dashboard'}
            style={{
              background: '#28a745',
              color: 'white',
              padding: '15px 30px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Gå till Dashboard
          </button>
        </>
      )}
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRealtimeJobs } from '@/hooks/use-realtime'

export default function TestJobs() {
  const [directJobs, setDirectJobs] = useState<any[]>([])
  const { jobs: realtimeJobs, loading } = useRealtimeJobs({})
  
  useEffect(() => {
    // Direct API call
    fetch('/api/staff/jobs')
      .then(res => res.json())
      .then(data => {
        console.log('Direct API response:', data)
        if (data.success) {
          setDirectJobs(data.jobs || [])
        }
      })
  }, [])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Jobs Test Page</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Direct API Call</h2>
        <p>Jobs found: {directJobs.length}</p>
        {directJobs.slice(0, 3).map((job, i) => (
          <div key={i} style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            margin: '5px 0',
            borderRadius: '5px'
          }}>
            <strong>{job.bookingNumber}</strong> - {job.customerName}<br />
            Status: {job.status}, Time: {job.moveTime}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h2>useRealtimeJobs Hook</h2>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Jobs found: {realtimeJobs?.length || 0}</p>
        {realtimeJobs?.slice(0, 3).map((job, i) => (
          <div key={i} style={{ 
            background: '#e0e0e0', 
            padding: '10px', 
            margin: '5px 0',
            borderRadius: '5px'
          }}>
            <strong>{job.bookingNumber || job.job_number}</strong> - {job.customerName || 'Unknown'}<br />
            Status: {job.status}
          </div>
        ))}
      </div>
    </div>
  )
}
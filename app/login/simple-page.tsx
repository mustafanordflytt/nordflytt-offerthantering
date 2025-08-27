'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Mock users
  const mockUsers = {
    'admin@nordflytt.se': { password: 'admin123', role: 'admin', name: 'Admin Användare' },
    'manager@nordflytt.se': { password: 'manager123', role: 'manager', name: 'Chef Användare' },
    'employee@nordflytt.se': { password: 'employee123', role: 'employee', name: 'Anställd Användare' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const user = mockUsers[email as keyof typeof mockUsers]
    
    if (user && user.password === password) {
      // Save to localStorage
      localStorage.setItem('crm_user', JSON.stringify({
        email,
        name: user.name,
        role: user.role
      }))
      
      // Redirect to dashboard
      window.location.href = '/crm/dashboard'
    } else {
      setError('Felaktig e-postadress eller lösenord')
      setLoading(false)
    }
  }

  const fillDemoCredentials = (role: string) => {
    switch (role) {
      case 'admin':
        setEmail('admin@nordflytt.se')
        setPassword('admin123')
        break
      case 'manager':
        setEmail('manager@nordflytt.se')
        setPassword('manager123')
        break
      case 'employee':
        setEmail('employee@nordflytt.se')
        setPassword('employee123')
        break
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#002A5C]">Nordflytt</h1>
          <h2 className="text-xl mt-2">Logga in på CRM</h2>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold mb-6">Inloggning</h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">E-postadress</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="namn@foretag.se"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Lösenord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#002A5C] text-white py-2 px-4 rounded-md hover:bg-[#001a42] disabled:opacity-50"
            >
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-center text-gray-600 mb-3">Demo-inloggningar:</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('manager')}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('employee')}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                Anställd
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
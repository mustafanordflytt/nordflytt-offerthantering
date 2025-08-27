'use client'

import { useEffect, useState } from 'react'
import { StorageMigration } from '@/lib/storage/migration'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, Loader2, Database } from 'lucide-react'

interface MigrationStatus {
  running: boolean
  completed: boolean
  success: boolean
  results: any
  needsRestart: boolean
}

export default function DataMigration() {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    running: false,
    completed: false,
    success: false,
    results: {},
    needsRestart: false
  })

  const runMigration = async () => {
    setMigrationStatus(prev => ({ ...prev, running: true }))
    
    try {
      const results = await StorageMigration.runAllMigrations()
      
      setMigrationStatus({
        running: false,
        completed: true,
        success: results.overallSuccess,
        results: results.results,
        needsRestart: results.needsRestart
      })
      
      if (results.overallSuccess && !results.needsRestart) {
        // Clean up old data
        StorageMigration.cleanup()
      }
    } catch (error) {
      console.error('Migration error:', error)
      setMigrationStatus(prev => ({
        ...prev,
        running: false,
        completed: true,
        success: false,
        results: { error: error instanceof Error ? error.message : 'Unknown error' }
      }))
    }
  }

  // Auto-run migration on component mount
  useEffect(() => {
    const migrationStatus = StorageMigration.getMigrationStatus()
    if (migrationStatus.version === 0) {
      runMigration()
    } else {
      setMigrationStatus(prev => ({ ...prev, completed: true, success: true }))
    }
  }, [])

  if (!migrationStatus.completed && !migrationStatus.running) {
    return null // Don't show anything while initializing
  }

  if (migrationStatus.completed && migrationStatus.success && !migrationStatus.needsRestart) {
    return null // Migration successful, don't show component
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-800">Databasmigrering</CardTitle>
        </div>
        <CardDescription className="text-blue-600">
          Uppgraderar appen till att använda databasen istället för lokal lagring
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {migrationStatus.running && (
          <div className="flex items-center space-x-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Migrerar data till databasen...</span>
          </div>
        )}
        
        {migrationStatus.completed && (
          <div className="space-y-3">
            {migrationStatus.success ? (
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Migrering genomförd!</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-orange-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Migrering delvis genomförd</span>
              </div>
            )}
            
            {/* Show migration results */}
            {Object.entries(migrationStatus.results).map(([key, result]: [string, any]) => (
              <div key={key} className="text-sm">
                <span className="font-medium capitalize">{key}:</span>{' '}
                {result.success ? (
                  <span className="text-green-600">✓ {result.migratedItems} objekt migrerade</span>
                ) : (
                  <span className="text-red-600">✗ {result.errors?.length || 0} fel</span>
                )}
              </div>
            ))}
            
            {migrationStatus.needsRestart && (
              <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
                <p className="text-orange-800 text-sm mb-2">
                  För att slutföra uppgraderingen måste du logga in igen.
                </p>
                <Button 
                  onClick={() => {
                    localStorage.clear()
                    window.location.href = '/staff'
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  Logga in igen
                </Button>
              </div>
            )}
            
            {!migrationStatus.success && !migrationStatus.needsRestart && (
              <Button 
                onClick={runMigration}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Försök igen
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
#!/usr/bin/env node

/**
 * Migreringsskript för att flytta data från JSON-filer till Supabase
 * Kör med: node scripts/migrate-to-supabase.js
 */

require('dotenv').config({ path: '.env.development.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Kontrollera att miljövariabler finns
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase miljövariabler saknas!')
  console.error('Kontrollera att .env.development.local innehåller:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateContracts() {
  console.log('\n📄 Migrerar kontrakt...')
  
  try {
    // Läs contracts.json
    const contractsPath = path.join(process.cwd(), 'data', 'contracts.json')
    if (!fs.existsSync(contractsPath)) {
      console.log('⚠️  contracts.json finns inte, hoppar över')
      return
    }
    
    const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'))
    
    // Migrera varje anställd
    for (const [key, employee] of Object.entries(contractsData.employees)) {
      console.log(`  → Migrerar ${employee.name}...`)
      
      // Kontrollera om anställd redan finns
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('email', employee.email)
        .single()
      
      if (existingEmployee) {
        console.log(`    ✓ ${employee.name} finns redan`)
        
        // Uppdatera kontrakt om det finns
        if (employee.contracts?.current) {
          const contract = employee.contracts.current
          
          // Skapa kontrakt i databas
          const { error: contractError } = await supabase
            .from('contracts')
            .upsert({
              employee_id: existingEmployee.id,
              type: contract.type,
              status: contract.status,
              hourly_rate: parseFloat(contract.hourlyRate),
              start_date: new Date().toISOString(),
              document_url: contract.pdfUrl,
              signed_at: contract.signedDate,
              created_at: contract.createdDate,
              updated_at: new Date().toISOString()
            })
          
          if (contractError) {
            console.error(`    ❌ Fel vid migrering av kontrakt:`, contractError)
          } else {
            console.log(`    ✓ Kontrakt migrerat`)
          }
        }
      } else {
        console.log(`    ℹ️  ${employee.name} finns inte i databasen, skapa manuellt först`)
      }
    }
    
    console.log('✅ Kontraktsmigrering klar!')
    
  } catch (error) {
    console.error('❌ Fel vid kontraktsmigrering:', error)
  }
}

async function migrateAssetDocuments() {
  console.log('\n📦 Migrerar tillgångsdokument...')
  
  try {
    // Leta efter metadata-filer
    const docsDir = path.join(process.cwd(), 'public', 'generated-documents')
    if (!fs.existsSync(docsDir)) {
      console.log('⚠️  generated-documents mapp finns inte, hoppar över')
      return
    }
    
    const files = fs.readdirSync(docsDir)
    const metadataFiles = files.filter(f => f.endsWith('-metadata.json'))
    
    for (const file of metadataFiles) {
      const metadata = JSON.parse(fs.readFileSync(path.join(docsDir, file), 'utf8'))
      console.log(`  → Migrerar dokument ${metadata.id}...`)
      
      // Hitta anställd baserat på email
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('email', metadata.employeeEmail)
        .single()
      
      if (employee) {
        // Skapa asset-dokument post
        const { error } = await supabase
          .from('asset_documents')
          .upsert({
            id: metadata.id,
            employee_id: employee.id,
            status: metadata.status,
            document_url: metadata.htmlPath,
            total_items: metadata.totalItems,
            total_cost: metadata.totalCost,
            sent_at: metadata.sentAt,
            signed_at: metadata.signedAt,
            signing_data: metadata.signingData,
            created_at: metadata.createdAt,
            updated_at: new Date().toISOString()
          })
        
        if (error) {
          console.error(`    ❌ Fel:`, error)
        } else {
          console.log(`    ✓ Dokument migrerat`)
        }
      } else {
        console.log(`    ⚠️  Anställd ${metadata.employeeEmail} finns inte`)
      }
    }
    
    console.log('✅ Dokumentmigrering klar!')
    
  } catch (error) {
    console.error('❌ Fel vid dokumentmigrering:', error)
  }
}

async function createBackup() {
  console.log('\n💾 Skapar backup...')
  
  const backupDir = path.join(process.cwd(), 'backup', new Date().toISOString().split('T')[0])
  fs.mkdirSync(backupDir, { recursive: true })
  
  // Kopiera contracts.json
  const contractsPath = path.join(process.cwd(), 'data', 'contracts.json')
  if (fs.existsSync(contractsPath)) {
    fs.copyFileSync(contractsPath, path.join(backupDir, 'contracts.json'))
    console.log('  ✓ contracts.json backupad')
  }
  
  // Kopiera generated-documents
  const docsDir = path.join(process.cwd(), 'public', 'generated-documents')
  if (fs.existsSync(docsDir)) {
    fs.cpSync(docsDir, path.join(backupDir, 'generated-documents'), { recursive: true })
    console.log('  ✓ generated-documents backupad')
  }
  
  console.log(`✅ Backup sparad i: ${backupDir}`)
}

async function main() {
  console.log('🚀 Startar migrering till Supabase...')
  console.log('================================')
  
  // Skapa backup först
  await createBackup()
  
  // Migrera data
  await migrateContracts()
  await migrateAssetDocuments()
  
  console.log('\n✅ Migrering klar!')
  console.log('\n⚠️  VIKTIGT:')
  console.log('1. Kontrollera att all data migrerats korrekt')
  console.log('2. Ta bort JSON-filer från produktion')
  console.log('3. Uppdatera .gitignore att exkludera /data och /public/generated-documents')
}

// Kör migrering
main().catch(console.error)
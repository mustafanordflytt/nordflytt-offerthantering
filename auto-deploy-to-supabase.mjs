#!/usr/bin/env node

/**
 * AUTOMATISK SUPABASE DEPLOYMENT
 * Kör SQL-kommandon direkt via Supabase API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

// Supabase credentials
const SUPABASE_URL = 'https://gindcnpiejkntkangpuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjM2ODYsImV4cCI6MjA1OTg5OTY4Nn0.uHo-Hhm9Rm3PMkpCH2t6PUV_dlRnf1ufVSXcWVc1tKg';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🚀 AUTOMATISK SUPABASE DEPLOYMENT STARTAR...\n');

// Läs SQL-filen
const sqlContent = readFileSync('./database/DEPLOY_THIS_TO_SUPABASE.sql', 'utf8');

// Försök köra SQL via Supabase Management API
async function deployViaManagementAPI() {
  try {
    console.log('📡 Ansluter till Supabase Management API...');
    
    // Supabase Management API endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (response.ok) {
      console.log('✅ SQL-kommandon körda framgångsrikt!');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ API returnerade fel:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Kunde inte köra via Management API:', error.message);
    return false;
  }
}

// Alternativ: Skapa tabeller en i taget
async function deployTablesIndividually() {
  console.log('\n📋 Försöker skapa tabeller individuellt...\n');
  
  // Extrahera CREATE TABLE statements
  const tableStatements = sqlContent
    .split(/;\s*\n/)
    .filter(stmt => stmt.trim().toUpperCase().includes('CREATE TABLE'));
  
  let successCount = 0;
  
  for (const statement of tableStatements) {
    try {
      // Extrahera tabellnamn
      const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';
      
      console.log(`📊 Skapar tabell: ${tableName}...`);
      
      // Försök att testa om tabellen finns genom att göra en query
      const { error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`❌ Tabell ${tableName} finns inte - behöver skapas manuellt`);
      } else if (!error) {
        console.log(`✅ Tabell ${tableName} finns redan!`);
        successCount++;
      }
    } catch (e) {
      console.log(`⚠️  Kunde inte verifiera tabell:`, e.message);
    }
  }
  
  return successCount;
}

// Testa API endpoints
async function testEndpoints() {
  console.log('\n🧪 Testar API endpoints...\n');
  
  const endpoints = [
    '/api/ai-decisions/stream',
    '/api/ai-learning/metrics',
    '/api/ai-mode/current',
    '/api/autonomous/status',
    '/api/inventory',
    '/api/public-procurements',
    '/api/customer-storage'
  ];
  
  let workingCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      const data = await response.json();
      
      if (response.status === 500 && data.error?.includes('does not exist')) {
        console.log(`❌ ${endpoint} - Tabell saknas`);
      } else if (response.ok) {
        console.log(`✅ ${endpoint} - Fungerar!`);
        workingCount++;
      }
    } catch (e) {
      console.log(`❌ ${endpoint} - Anslutningsfel`);
    }
  }
  
  return workingCount;
}

// Huvudfunktion
async function main() {
  // Försök köra via Management API
  const apiSuccess = await deployViaManagementAPI();
  
  if (!apiSuccess) {
    console.log('\n⚠️  Automatisk deployment fungerade inte.');
    console.log('Supabase tillåter inte direkt SQL-körning via API av säkerhetsskäl.\n');
    
    // Testa vilka tabeller som finns
    await deployTablesIndividually();
    
    console.log('\n📋 MANUELL DEPLOYMENT KRÄVS:');
    console.log('════════════════════════════════════════════\n');
    console.log('1. Öppna Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/gindcnpiejkntkangpuc/sql\n');
    console.log('2. Kopiera innehållet från:');
    console.log('   database/DEPLOY_THIS_TO_SUPABASE.sql\n');
    console.log('3. Klistra in i SQL-editorn\n');
    console.log('4. Klicka på "Run"\n');
    console.log('════════════════════════════════════════════\n');
    
    // Skapa en klickbar länk
    console.log('🔗 KLICKA HÄR FÖR ATT ÖPPNA SQL EDITOR:');
    console.log('   \x1b[36mhttps://supabase.com/dashboard/project/gindcnpiejkntkangpuc/sql\x1b[0m\n');
  }
  
  // Testa endpoints
  const workingEndpoints = await testEndpoints();
  
  console.log(`\n📊 Status: ${workingEndpoints}/7 endpoints fungerar`);
  
  if (workingEndpoints < 7) {
    console.log('\n⏳ Väntar på manuell deployment av SQL-schemat...');
  } else {
    console.log('\n✅ ALLA ENDPOINTS FUNGERAR! Deployment lyckades!');
  }
}

// Kör deployment
main().catch(console.error);
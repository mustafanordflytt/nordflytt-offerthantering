import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Läs miljövariabler
dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase miljövariabler saknas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAICustomerService() {
  console.log('🤖 Sätter upp AI Kundtjänst databastabeller...\n')
  console.log('📍 Supabase URL:', supabaseUrl)

  try {
    // SQL för att skapa alla tabeller
    const createTablesSQL = `
      -- AI Customer Service Sessions
      CREATE TABLE IF NOT EXISTS ai_customer_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(100) UNIQUE NOT NULL,
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        customer_id UUID REFERENCES customers(id),
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP,
        messages_count INTEGER DEFAULT 0,
        revenue_potential DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        agent_name VARCHAR(100) DEFAULT 'Maja',
        conversation_topic TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Support Tickets
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_id UUID REFERENCES customers(id),
        category VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        subject TEXT,
        description TEXT,
        gpt_session_id VARCHAR(100),
        assigned_to UUID,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- AI Events/Activities
      CREATE TABLE IF NOT EXISTS ai_customer_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(100) REFERENCES ai_customer_sessions(session_id),
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      );

      -- Chat Messages (för att spara konversationer)
      CREATE TABLE IF NOT EXISTS ai_chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(100) REFERENCES ai_customer_sessions(session_id),
        role VARCHAR(20) NOT NULL, -- 'user' eller 'assistant'
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Customer Insights (för ML/Analytics)
      CREATE TABLE IF NOT EXISTS ai_customer_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_email VARCHAR(255) NOT NULL,
        customer_id UUID REFERENCES customers(id),
        lifetime_value DECIMAL(12,2),
        churn_risk_score DECIMAL(3,2),
        satisfaction_score DECIMAL(3,2),
        total_interactions INTEGER DEFAULT 0,
        last_interaction TIMESTAMP,
        preferred_channel VARCHAR(50),
        topics_of_interest TEXT[],
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_ai_sessions_email ON ai_customer_sessions(customer_email);
      CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_customer_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_ai_sessions_created ON ai_customer_sessions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_email ON support_tickets(customer_email);
      CREATE INDEX IF NOT EXISTS idx_tickets_created ON support_tickets(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_events_session ON ai_customer_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_ai_events_type ON ai_customer_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON ai_chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_customer_insights_email ON ai_customer_insights(customer_email);
    `;

    // Kör SQL
    console.log('📝 Skapar tabeller...')
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTablesSQL 
    }).single()

    if (createError) {
      // Om exec_sql inte finns, försök med direkt queries
      console.log('⚠️  exec_sql fungerade inte, försöker alternativ metod...')
      
      // Vi kan inte köra rå SQL direkt, så vi gör det manuellt
      console.log('\n📋 Kopiera och kör följande SQL i Supabase Dashboard:\n')
      console.log('```sql')
      console.log(createTablesSQL)
      console.log('```\n')
    } else {
      console.log('✅ Tabeller skapade!')
    }

    // Kontrollera om tabellerna finns
    const { data: tables, error: tablesError } = await supabase
      .from('ai_customer_sessions')
      .select('count')
      .limit(1)

    if (tablesError && tablesError.code === '42P01') {
      console.log('\n⚠️  Tabellerna finns inte än.')
      console.log('👉 Gå till Supabase Dashboard → SQL Editor')
      console.log('👉 Klistra in SQL-koden ovan och kör den')
      console.log('👉 Kör sedan detta script igen för att verifiera')
      return
    }

    console.log('\n✅ AI Customer Service tabeller är redo!')

    // Lägg till test-data om tabellerna är tomma
    const { count } = await supabase
      .from('ai_customer_sessions')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      console.log('\n📝 Lägger till test-data...')

      // Skapa en test-session
      const testSession = {
        session_id: `test-session-${Date.now()}`,
        customer_email: 'test@example.com',
        customer_name: 'Test Kund',
        messages_count: 5,
        revenue_potential: 2500.00,
        status: 'completed',
        agent_name: 'Maja',
        conversation_topic: 'Prisförfrågan för kontorsflytt',
        metadata: {
          channel: 'web-chat',
          browser: 'Chrome',
          location: 'Stockholm'
        }
      }

      const { data: session, error: sessionError } = await supabase
        .from('ai_customer_sessions')
        .insert(testSession)
        .select()
        .single()

      if (sessionError) {
        console.log('⚠️  Kunde inte skapa test-session:', sessionError.message)
      } else {
        console.log('✅ Test-session skapad')

        // Lägg till några test-meddelanden
        const messages = [
          { session_id: testSession.session_id, role: 'user', content: 'Hej! Jag behöver hjälp med en kontorsflytt' },
          { session_id: testSession.session_id, role: 'assistant', content: 'Hej! Jag heter Maja och hjälper dig gärna med din kontorsflytt. Kan du berätta lite mer om omfattningen?' },
          { session_id: testSession.session_id, role: 'user', content: 'Vi ska flytta från Östermalm till Kungsholmen, ca 50 kvadratmeter kontor' },
          { session_id: testSession.session_id, role: 'assistant', content: 'Perfekt! För ett 50 kvm kontor från Östermalm till Kungsholmen brukar priset ligga runt 15,000-20,000 kr inklusive allt. Vill du ha en exakt offert?' },
          { session_id: testSession.session_id, role: 'user', content: 'Ja tack!' }
        ]

        for (const msg of messages) {
          await supabase.from('ai_chat_messages').insert(msg)
        }

        // Skapa ett test-event
        await supabase.from('ai_customer_events').insert({
          session_id: testSession.session_id,
          event_type: 'price_calculated',
          event_data: {
            from: 'Östermalm',
            to: 'Kungsholmen',
            size: '50 kvm',
            estimated_price: 17500,
            currency: 'SEK'
          }
        })

        console.log('✅ Test-meddelanden och events skapade')
      }
    }

    // Visa status
    console.log('\n📊 Status:')
    
    const checks = [
      { table: 'ai_customer_sessions', name: 'AI-sessioner' },
      { table: 'support_tickets', name: 'Support-tickets' },
      { table: 'ai_customer_events', name: 'AI-händelser' },
      { table: 'ai_chat_messages', name: 'Chat-meddelanden' },
      { table: 'ai_customer_insights', name: 'Kundinsikter' }
    ]

    for (const check of checks) {
      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${check.name}: Tabell finns inte`)
      } else {
        console.log(`✅ ${check.name}: ${count || 0} rader`)
      }
    }

    console.log('\n🎉 AI Kundtjänst är klar för produktion!')
    console.log('\n📌 Nästa steg:')
    console.log('1. Testa chatten på http://localhost:3002/crm/ai-kundtjanst')
    console.log('2. Kontrollera att OpenAI API-nyckeln fungerar')
    console.log('3. Konfigurera CORS för production API om nödvändigt')

  } catch (error) {
    console.error('❌ Fel:', error.message)
    console.error('\n💡 Tips:')
    console.error('1. Kontrollera att Supabase-anslutningen fungerar')
    console.error('2. Kör SQL-koden manuellt i Supabase Dashboard om automatisk körning misslyckas')
  }
}

// Kör setup
setupAICustomerService()
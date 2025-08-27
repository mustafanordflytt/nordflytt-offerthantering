"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<TestResult | null>(null)
  const [readStatus, setReadStatus] = useState<TestResult | null>(null)
  const [writeStatus, setWriteStatus] = useState<TestResult | null>(null)
  const [authStatus, setAuthStatus] = useState<TestResult | null>(null)
  const [bookingStatus, setBookingStatus] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Test Supabase connection
  const testConnection = async () => {
    try {
      // För att testa anslutningen hämtar vi en post eller count
      const { count, error } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
      
      if (error) throw error
      
      setConnectionStatus({
        success: true,
        message: `Anslutningen till Supabase fungerar. Antal kunder: ${count || 0}`,
      })
      return true
    } catch (error: any) {
      console.error("Connection error:", error)
      setConnectionStatus({
        success: false,
        message: `Anslutningsfel: ${error.message || "Okänt fel"}`,
      })
      return false
    }
  }

  // Test read operation
  const testRead = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .limit(5)
      
      if (error) throw error
      
      setReadStatus({
        success: true,
        message: `Läsoperation lyckades: ${data.length} poster hittades`,
        data
      })
    } catch (error: any) {
      console.error("Read error:", error)
      setReadStatus({
        success: false,
        message: `Läsfel: ${error.message || "Okänt fel"}`,
      })
    }
  }

  // Test write operation
  const testWrite = async () => {
    try {
      const testCustomer = {
        name: `Test Kund ${new Date().toISOString()}`,
        email: `test-${Date.now()}@example.com`,
        phone: `070-${Math.floor(1000000 + Math.random() * 9000000)}`,
        customer_type: "Test",
      }

      const { data, error } = await supabase
        .from("customers")
        .insert(testCustomer)
        .select()
        .single()
      
      if (error) throw error
      
      setWriteStatus({
        success: true,
        message: `Skrivoperation lyckades: Kund skapad med ID ${data.id}`,
        data
      })
    } catch (error: any) {
      console.error("Write error:", error)
      setWriteStatus({
        success: false,
        message: `Skrivfel: ${error.message || "Okänt fel"}`,
      })
    }
  }

  // Test authentication if applicable
  const testAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session) {
        setAuthStatus({
          success: true,
          message: `Autentisering aktiv: ${session.user.email}`,
          data: session
        })
      } else {
        setAuthStatus({
          success: false,
          message: "Ingen aktiv session",
        })
      }
    } catch (error: any) {
      console.error("Auth error:", error)
      setAuthStatus({
        success: false,
        message: `Autentiseringsfel: ${error.message || "Okänt fel"}`,
      })
    }
  }

  // Test booking operation
  const testBooking = async () => {
    try {
      // Skapa en testbokning för att testa bookings-tabellen
      const testCustomer = {
        name: `Test Kund ${new Date().toISOString()}`,
        email: `test-${Date.now()}@example.com`,
        phone: `070-${Math.floor(1000000 + Math.random() * 9000000)}`,
        customer_type: "Test",
      }

      // Först, skapa en kund
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert(testCustomer)
        .select()
        .single()
      
      if (customerError) throw customerError
      
      // Sedan, skapa en bokning kopplad till kunden
      const testBooking = {
        customer_id: customer.id,
        service_type: "testing",
        service_types: ["test_service"],
        move_date: new Date().toISOString().split("T")[0],
        move_time: "12:00",
        start_address: "Testgatan 1",
        end_address: "Testgatan 2",
        status: "test",
        total_price: 100,
      }
      
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(testBooking)
        .select()
        .single()
      
      if (bookingError) throw bookingError
      
      setBookingStatus({
        success: true,
        message: `Bokningstest lyckades: Bokning skapad med ID ${booking.id}`,
        data: booking
      })
    } catch (error: any) {
      console.error("Booking test error:", error)
      setBookingStatus({
        success: false,
        message: `Bokningsfel: ${error.message || "Okänt fel"}`,
      })
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setShowResults(true)
    const connectionSuccess = await testConnection()
    
    if (connectionSuccess) {
      await Promise.all([
        testRead(),
        testWrite(),
        testAuth(),
        testBooking()
      ])
    }
    
    setLoading(false)
  }

  const clearResults = () => {
    setConnectionStatus(null)
    setReadStatus(null)
    setWriteStatus(null)
    setAuthStatus(null)
    setBookingStatus(null)
    setShowResults(false)
  }

  const StatusIcon = ({ result }: { result: TestResult | null }) => {
    if (!result) return <div className="w-6 h-6"></div>
    
    return result.success 
      ? <CheckCircle className="w-6 h-6 text-green-600" />
      : <XCircle className="w-6 h-6 text-red-600" />
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Supabase Anslutningstest</h1>
      
      <div className="mb-8 flex space-x-4">
        <button
          onClick={() => {
            console.log("Test button clicked");
            runAllTests();
          }}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer active:bg-blue-800 active:translate-y-0.5 transition-all"
          style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", transform: "translateY(0)" }}
        >
          {loading ? "Kör tester..." : "Kör alla tester"}
        </button>
        
        {showResults && (
          <button
            onClick={() => {
              console.log("Clear button clicked");
              clearResults();
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 cursor-pointer active:bg-gray-400 active:translate-y-0.5 transition-all"
            style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", transform: "translateY(0)" }}
          >
            Rensa resultat
          </button>
        )}
      </div>

      {showResults && (
        <div className="space-y-6 bg-white shadow-md rounded-lg p-6">
          {/* Connection Test */}
          <div className="flex items-start space-x-4">
            <StatusIcon result={connectionStatus} />
            <div>
              <h3 className="font-medium">1. Anslutningstest</h3>
              {connectionStatus && (
                <p className={connectionStatus.success ? "text-green-600" : "text-red-600"}>
                  {connectionStatus.message}
                </p>
              )}
            </div>
          </div>

          {/* Read Test */}
          <div className="flex items-start space-x-4">
            <StatusIcon result={readStatus} />
            <div>
              <h3 className="font-medium">2. Läsningstest</h3>
              {readStatus && (
                <>
                  <p className={readStatus.success ? "text-green-600" : "text-red-600"}>
                    {readStatus.message}
                  </p>
                  {readStatus.success && readStatus.data && readStatus.data.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-blue-600 cursor-pointer">Visa data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(readStatus.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Write Test */}
          <div className="flex items-start space-x-4">
            <StatusIcon result={writeStatus} />
            <div>
              <h3 className="font-medium">3. Skrivningstest</h3>
              {writeStatus && (
                <p className={writeStatus.success ? "text-green-600" : "text-red-600"}>
                  {writeStatus.message}
                </p>
              )}
            </div>
          </div>

          {/* Auth Test */}
          <div className="flex items-start space-x-4">
            <StatusIcon result={authStatus} />
            <div>
              <h3 className="font-medium">4. Autentiseringstest</h3>
              {authStatus && (
                <p className={authStatus.success ? "text-green-600" : "text-red-600"}>
                  {authStatus.message}
                </p>
              )}
            </div>
          </div>

          {/* Booking Test */}
          <div className="flex items-start space-x-4">
            <StatusIcon result={bookingStatus} />
            <div>
              <h3 className="font-medium">5. Bokningstest</h3>
              {bookingStatus && (
                <>
                  <p className={bookingStatus.success ? "text-green-600" : "text-red-600"}>
                    {bookingStatus.message}
                  </p>
                  {bookingStatus.success && bookingStatus.data && (
                    <details className="mt-2">
                      <summary className="text-blue-600 cursor-pointer">Visa bokningsdata</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(bookingStatus.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Checklista för Supabase</h2>
        <ul className="space-y-2">
          <li className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>Kontrollera API-nycklar i <code className="px-1 py-0.5 bg-gray-100 rounded">.env.local</code></span>
          </li>
          <li className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>Verifiera att nödvändiga tabeller existerar</span>
          </li>
          <li className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>Kontrollera att behörigheter (RLS) är korrekt konfigurerade</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Offer } from "@/types/offer"
import NotificationButton from "./NotificationButton"

export default async function OfferPage({ params }: { params: { id: string } }) {
  try {
    // Hämta offertdata från Supabase
    const supabase = createServerSupabaseClient()
    const { data: quote, error } = await supabase
      .from("quotes")
      .select(`
        *,
        customers (*)
      `)
      .eq("id", params.id)
      .single()

    if (error || !quote) {
      console.error("Error fetching quote:", error)
      notFound()
    }

    // Skapa ett Offer-objekt från quote-data för att kunna skicka till notifieringskomponenten
    const offerData: Offer = {
      id: quote.id,
      customerName: quote.customers?.name || "Okänd kund",
      email: quote.customers?.email,
      phone: quote.customers?.phone,
      services: Array.isArray(quote.services) 
        ? quote.services.map((service: string) => ({
            name: service,
            price: 0 // Exakt pris per service finns inte i databasen, så vi använder 0 som placeholder
          }))
        : [],
      totalPrice: quote.value || 0,
      timeline: [], // Inga detaljerade timeline-data i databasen
      totalTime: 0,
      totalPersonnel: 0,
      expectedEndTime: ""
    }

    const details = quote.details ? JSON.parse(quote.details) : {}
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Offert #{quote.id}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Kundinformation</h2>
              <p><strong>Namn:</strong> {quote.customers?.name}</p>
              <p><strong>E-post:</strong> {quote.customers?.email}</p>
              <p><strong>Telefon:</strong> {quote.customers?.phone}</p>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">Offertdetaljer</h2>
              <p><strong>Status:</strong> {quote.status}</p>
              <p><strong>Skapat:</strong> {new Date(quote.created_at).toLocaleDateString('sv-SE')}</p>
              <p><strong>Giltig till:</strong> {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('sv-SE') : 'Ej specificerat'}</p>
              <p><strong>Totalt pris:</strong> {quote.value} kr</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Tjänster</h2>
            <ul className="list-disc pl-5">
              {Array.isArray(quote.services) && quote.services.map((service: string, index: number) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </div>
          
          {details.moveDetails && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Flyttdetaljer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Från:</strong> {details.moveDetails.from}</p>
                <p><strong>Till:</strong> {details.moveDetails.to}</p>
                <p><strong>Datum:</strong> {details.moveDetails.date}</p>
                <p><strong>Boyta från:</strong> {details.moveDetails.fromSize} m²</p>
                <p><strong>Boyta till:</strong> {details.moveDetails.toSize} m²</p>
              </div>
            </div>
          )}
          
          {/* Notifieringsknappar */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Kommunikationsverktyg</h2>
            <div className="flex flex-wrap gap-4">
              <NotificationButton offer={offerData} />
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in OfferPage:", error)
    notFound()
  }
}

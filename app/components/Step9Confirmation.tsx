"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Home,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Edit,
  ExternalLink,
  ArrowRight,
  Save,
  AlertTriangle,
  Building2,
  Briefcase,
  User,
  Info,
  MessageSquare,
  Sofa,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { simpleToast } from "@/components/ui/use-toast"
import confetti from "canvas-confetti"
import { translations } from "../i18n/translations"

// Uppdatera Step9Props för att inkludera företagsspecifika fält
interface Step9Props {
  formData: {
    name: string
    email: string
    phone: string
    serviceType: string
    serviceTypes?: string[]
    customerType?: string
    companyName?: string
    orgNumber?: string
    contactPerson?: string
    role?: string
    contactPreference?: string[]
  }
  language?: string
  t?: (key: string) => string
}

export default function Step9Confirmation({ formData, language = "sv", t = key => translations[language][key] }: Step9Props) {
  // State for handling API submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState(formData.email || "")
  const [sendingEmail, setSendingEmail] = useState(false)

  // Refs for confetti container
  const confettiContainerRef = useRef<HTMLDivElement>(null)
  const animationsRef = useRef<Animation[]>([])

  // Extract first name for more personal greeting
  const firstName = formData.name.split(" ")[0]

  // Determine service type text
  const getServiceTypeText = () => {
    if (formData.serviceTypes && formData.serviceTypes.length > 0) {
      const services = formData.serviceTypes.map((service) =>
        service === "moving" ? "flytt" : service === "cleaning" ? "städning" : "packning",
      )
      return services.join(" och ")
    }
    return formData.serviceType === "cleaning" ? "städning" : "flytt"
  }

  // Check if this is a furniture valuation confirmation
  const isFurnitureValuation = formData.serviceTypes?.includes("sell_furniture")

  // Automatically submit data to API when component mounts
  useEffect(() => {
    const submitData = async () => {
      if (isSubmitting) return
      setIsSubmitting(true)

      try {
        const response = await fetch("/api/submit-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`)
        }

        const data = await response.json()
        setBookingId(data.bookingId)

        // Create confetti explosion after successful submission
        createConfettiExplosion()
      } catch (error) {
        console.error("Error submitting booking:", error)
        
        // For development, still show the success view and generate a mock ID
        setBookingId("mock-error-" + Date.now())
        createConfettiExplosion()

        // Show error toast
        simpleToast.error({
          title: "Kunde inte skicka bokningen",
          description: "Det gick inte att skicka din bokning. Vänligen försök igen senare.",
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    submitData()
  }, [formData])

  // Confetti effect when component mounts
  useEffect(() => {
    // Check if form data exists
    if (!formData) return

    // Ensure the component is mounted before showing confetti
    if (confettiContainerRef.current) {
      try {
        // Create confetti instance with useWorker set to false to avoid offscreen canvas issues
        const confettiInstance = confetti.create(confettiContainerRef.current, {
          resize: true,
          useWorker: false, // Set to false to avoid transferControlToOffscreen
        });

        // Fire the confetti with some nice options
        confettiInstance({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Clean up when the component unmounts
        return () => {
          confettiInstance.reset();
        };
      } catch (error) {
        console.error("Error creating confetti:", error);
        // Continue even if confetti fails - it's just a visual effect
      }
    }
  }, [formData]);

  // Hantera skicka bekräftelse via e-post
  const handleSendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingEmail(true)

    try {
      // Simulera skicka e-post (här skulle en riktig API-anrop finnas)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      simpleToast.success({
        title: "Bekräftelse skickad!",
        description: `Vi har skickat en bekräftelse till ${email}`,
      })
      
      setShowEmailForm(false)
    } catch (error) {
      console.error("Error sending confirmation:", error)
      
      simpleToast.error({
        title: "Något gick fel",
        description: "Vi kunde inte skicka bekräftelsen just nu. Försök igen senare.",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  // Create confetti explosion
  const createConfettiExplosion = () => {
    try {
      if (typeof window === 'undefined') return;
      
      // Use the window.confetti directly if available
      if (window.confetti) {
        // First explosion - center
        window.confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Second explosion - from left
        setTimeout(() => {
          window.confetti({
            particleCount: 50,
            angle: 60,
            spread: 80,
            origin: { x: 0, y: 0.6 }
          });
        }, 250);
        
        // Third explosion - from right
        setTimeout(() => {
          window.confetti({
            particleCount: 50,
            angle: 120,
            spread: 80,
            origin: { x: 1, y: 0.6 }
          });
        }, 400);
      } else {
        console.warn('Confetti library not available');
      }
    } catch (error) {
      console.error('Failed to create confetti effect:', error);
      // Confetti is not critical for application function
    }
  };

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (confettiContainerRef.current) {
        confettiContainerRef.current.innerHTML = ""
      }
      animationsRef.current.forEach((anim) => anim.cancel())
    }
  }, [])

  const handleCopyClick = () => {
    navigator.clipboard.writeText(bookingId);
    simpleToast.success("Bokningsnummer kopierat till urklipp!");
  };

  // Render the success view directly, no intermediate confirmation step
  return (
    <div className="max-w-xl mx-auto text-center">
      {isFurnitureValuation ? (
        <Card className="p-8 mb-10 shadow-md relative overflow-hidden confirmation-card">
          <div
            ref={confettiContainerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 1,
            }}
          ></div>
          <div className="flex justify-center mb-6 relative z-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6 relative z-10">✅ Din kostnadsfria värdering är bokad! 🎉</h2>

          <p className="text-lg mb-6 leading-relaxed relative z-10">
            Vi kontaktar dig inom 2 timmar via mejl eller telefon för att bekräfta en tid som passar dig.
          </p>

          <div className="bg-blue-50 p-5 rounded-lg mb-6 relative z-10">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">🤔 Vad händer nu?</h3>
            <ul className="space-y-3 text-left bg-gray-50 p-5 rounded-lg">
              <li className="flex items-start">
                <Clock className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Vi kontaktar dig inom 2 timmar för att boka en tid för värdering.</span>
              </li>
              <li className="flex items-start">
                <MessageSquare className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Du får ett mejl och SMS med detaljerna.</span>
              </li>
              <li className="flex items-start">
                <Sofa className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Värderingen är helt kostnadsfri – vi tittar gärna på fler möbler på plats.</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-left mb-8 relative z-10">
            <p className="font-medium text-blue-800 mb-2 flex items-center">
              <span className="text-blue-600 mr-2 text-xl">🔹</span>
              Vill du förbereda dig?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="https://nordflytt.se/salja-kontorsmobler/"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Tips: Sälja möbler smart
              </Link>
              <Link
                href="https://nordflytt.se/kontorsvardering/"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Guide: Så går en kontorsvärdering till
              </Link>
              <Link
                href="https://nordflytt.se/checklista-infor-flytten/"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Checklista: Ska ni även flytta?
              </Link>
              <Link
                href="https://nordflytt.se/kontorsflytt/"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Så funkar vår helhetslösning
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 mb-10 shadow-md relative overflow-hidden confirmation-card">
          <div
            ref={confettiContainerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 1,
            }}
          ></div>
          <div className="flex justify-center mb-6 relative z-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6 relative z-10">Din offert är på väg, {firstName}! 🎉</h2>

          <p className="text-lg mb-6 leading-relaxed relative z-10">
            Håll utkik i din mejl och SMS inom 2 timmar! Vi har tagit emot dina uppgifter och arbetar nu med din
            personliga offert:
          </p>

          <div className="bg-blue-50 p-5 rounded-lg mb-6 relative z-10">
            <ul className="space-y-4 text-left">
              <li className="flex items-start">
                <Mail className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <span className="font-semibold block mb-1">Din e-postadress:</span>
                  <span className="text-blue-700">{formData.email}</span>
                </div>
              </li>
              <li className="flex items-start">
                <Phone className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <span className="font-semibold block mb-1">Ditt telefonnummer:</span>
                  <span className="text-blue-700">{formData.phone}</span>
                </div>
              </li>
            </ul>
          </div>

          {formData.customerType === "business" && formData.companyName && (
            <>
              <Separator className="my-4" />

              <div className="bg-blue-50 p-5 rounded-lg mb-6 relative z-10">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                  Företagsinformation
                </h3>
                <ul className="space-y-4 text-left">
                  <li className="flex items-start">
                    <Building2 className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <span className="font-semibold block mb-1">Företagsnamn:</span>
                      <span className="text-blue-700">{formData.companyName}</span>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <Briefcase className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <span className="font-semibold block mb-1">Organisationsnummer:</span>
                      <span className="text-blue-700">{formData.orgNumber}</span>
                    </div>
                  </li>

                  {formData.contactPerson && (
                    <li className="flex items-start">
                      <User className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <span className="font-semibold block mb-1">Kontaktperson:</span>
                        <span className="text-blue-700">{formData.contactPerson}</span>
                      </div>
                    </li>
                  )}

                  {formData.role && (
                    <li className="flex items-start">
                      <Briefcase className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <span className="font-semibold block mb-1">Roll:</span>
                        <span className="text-blue-700">{formData.role}</span>
                      </div>
                    </li>
                  )}
                </ul>

                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 flex items-center">
                    <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>
                      En av våra företagsspecialister kommer att kontakta dig inom 24 timmar för att diskutera era
                      specifika behov.
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator className="my-6" />

          <div className="mb-6 relative z-10">
            <h3 className="text-xl font-semibold mb-4">Vad händer nu?</h3>
            <ul className="space-y-3 text-left bg-gray-50 p-5 rounded-lg">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Din offert skickas inom <strong>2 timmar</strong> till din e-post och som SMS
                </span>
              </li>
              <li className="flex items-start">
                <Clock className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Om vi behöver fler detaljer ringer vi dig från <strong>010-555 1289</strong>. Du behöver inte göra
                  något – vi sköter resten!
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Du kan acceptera offerten direkt via länken i mejlet/SMS:et</span>
              </li>
            </ul>
          </div>

          <p className="font-semibold text-lg mb-6 relative z-10">
            Vi ser verkligen fram emot att hjälpa dig med din {getServiceTypeText()} och göra hela processen så smidig
            som möjligt för dig! 🚚✨
          </p>

          <div className="bg-blue-50 p-4 rounded-lg text-left relative z-10">
            <p className="font-medium text-blue-800 mb-2 flex items-center">
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Förbered dig redan nu:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="https://nordflytt.se/checklista-infor-flytten/"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Checklista inför flytten
              </Link>
              <Link
                href="https://nordflytt.se/stada-som-ett-proffs-ultimata-guiden-for-ett-skinande-hem/"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Städningstips: Städa som ett proffs
              </Link>
              <Link
                href="https://nordflytt.se/flytta-som-ett-proffs/"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Packningstips: Flytta som ett proffs
              </Link>
              <Link
                href="https://nordflytt.se/delbetalning-av-flytthjalp/"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Delbetalning av flytthjälp
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-lg transition duration-300 flex items-center justify-center"
        >
          <Home className="w-5 h-5 mr-2" />
          Tillbaka till startsidan
        </Button>

        {isFurnitureValuation ? (
          <Button
            onClick={() => window.open("https://nordflytt.se/kontorsflytt/", "_blank")}
            className="bg-green-600 hover:bg-green-700 text-white py-2.5 px-5 rounded-lg transition duration-300 flex items-center justify-center"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Läs om hela vår tjänst
          </Button>
        ) : (
          <Button
            onClick={() => window.open("https://nordflytt.se/flytta-som-ett-proffs/", "_blank")}
            className="bg-green-600 hover:bg-green-700 text-white py-2.5 px-5 rounded-lg transition duration-300 flex items-center justify-center"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Se våra flyttips
          </Button>
        )}
      </div>
    </div>
  )
}

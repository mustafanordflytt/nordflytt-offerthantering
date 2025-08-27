'use client'

import { useState, useEffect, useRef } from "react"
import {
  CheckIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  InfoIcon,
  ClockIcon,
  BellIcon,
  TruckIcon,
  BellRing,
  Calendar,
  Box,
  Route,
  CreditCard,
  Check,
  Truck,
  MapPin,
  Package,
  Building2,
  ArrowBigUpDash,
  KeyRound,
  Car,
  Phone,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { useMobile } from "@/hooks/use-mobile"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createClientComponentClient, quoteService } from "@/lib/supabase"
import { useRouter, useParams } from "next/navigation"
import { berakna_flyttkostnad, formatPrice, type PriceBreakdown } from "@/lib/pricing"
import { type MoveDetails } from "@/lib/pricing"
import { mapServicesToPricingFields, isPackingServiceSelected, isCleaningServiceSelected, getSelectedServicesDisplay } from "@/lib/service-mapping"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { OfferBenefits } from "@/components/offer-benefits"
import { PriceCTASection } from "./components/price-cta-section"
import { RecoWidget } from "@/components/reco-widget"
import { PdfDocuments } from "@/components/pdf-documents"
import { ServiceSelectionSummary } from "./components/service-selection-summary"
import ChatWidget from "@/components/ChatWidget"
import { BankIDAuth } from "@/components/BankIDAuth"
import { useCreditCheck } from "@/hooks/useCreditCheck"
import { maskEmail, maskPhoneNumber, maskPersonalNumber } from "@/lib/utils/data-masking"
import { ConfirmationDialog, useConfirmation } from "@/components/ui/confirmation-dialog"

// Hjälpfunktion för att avgöra om det är lågsäsong
function isLowSeason(date: string | undefined): boolean {
  if (!date) return false;
  
  const moveDate = new Date(date);
  const month = moveDate.getMonth() + 1; // JavaScript månader är 0-baserade
  
  // Lågsäsong är november-februari (månad 11, 12, 1, 2)
  return month >= 11 || month <= 2;
}

// Hjälpfunktion för att begränsa och säkerställa rimliga bäravstånd
function sanitizeParkingDistance(distance: string | number | undefined): number {
  const parsed = Number(distance || 0);
  
  // Om värdet är över 1000, anta att det är i cm eller fel enhet - dela med 100
  if (parsed > 1000) {
    return Math.min(Math.floor(parsed / 100), 100);
  }
  
  // Annars begränsa till max 100 meter
  return Math.min(parsed, 100);
}

// Types for data
interface Service {
  name: string
  price: number
}

interface Offer {
  id: string
  customerName: string
  email: string
  phone: string
  totalPrice: number
  status: string
  services: Service[]
  createdAt: string
  expectedEndTime: string
  moveDate?: string
  details: {
    moveDate?: string
    moveTime?: string
    startAddress?: string
    endAddress?: string
    moveDetails?: any
    estimatedVolume?: number
    calculatedDistance?: string
    startParkingDistance?: string
    endParkingDistance?: string
    needsMovingBoxes?: boolean
    movingBoxes?: number
    paymentMethod?: string
    startFloor?: string
    endFloor?: string
    startElevator?: string
    endElevator?: string
  }
  moveDetails?: {
    startPropertyType?: string
    endPropertyType?: string
    startFloor?: string
    endFloor?: string
    startElevator?: 'big' | 'small' | 'none'
    endElevator?: 'big' | 'small' | 'none'
    startDoorCode?: string
    endDoorCode?: string
    startParkingDistance?: number
    endParkingDistance?: number
    estimatedVolume?: number
    calculatedDistance?: number
    movingBoxes?: number
    startLivingArea?: string | number
    endLivingArea?: string | number
    paymentMethod?: 'invoice' | 'swish' | 'installment'
    volym_m3?: number
    avstand_km?: number
    hiss_typ_A?: 'stor' | 'liten' | 'ingen' | 'trappa'
    hiss_typ_B?: 'stor' | 'liten' | 'ingen' | 'trappa'
    vaningar_A?: number
    vaningar_B?: number
    lagenhet_kvm?: number
    antal_tunga_objekt?: number
    lang_barvag?: boolean
    barvag_extra_meter?: number
    nyckelkund?: boolean
    lagsasong?: boolean
  }
  discount: number
  discountPercentage: number
  isFallback: boolean
}

interface OfferDetails {
  moveDate?: string;
  moveTime?: string;
  startAddress?: string;
  endAddress?: string;
  moveDetails?: MoveDetails;
}

export default function OfferPage() {
  const router = useRouter()
  // Use the useParams hook to get the ID parameter
  const params = useParams()
  const offerId = params.id as string
  
  const supabase = createClientComponentClient()
  
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [timeLeft, setTimeLeft] = useState({ hours: 24, minutes: 0, seconds: 0 })
  const [progress, setProgress] = useState(80)
  const [showModal, setShowModal] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useMobile()
  const isTimerLow = timeLeft.hours === 0 && timeLeft.minutes < 10

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null)
  const [selectedServices, setSelectedServices] = useState({
    packHjalp: false,
    flyttstad: false
  })

  const [showContactModal, setShowContactModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  
  // BankID och kreditkontroll state
  const [showBankIDModal, setShowBankIDModal] = useState(false)
  const [isProcessingBooking, setIsProcessingBooking] = useState(false)
  const { confirm, ConfirmationDialog: ConfirmDialog } = useConfirmation()
  const creditCheck = useCreditCheck()

  // Fetch offer data from Supabase
  useEffect(() => {
    async function fetchOffer() {
      try {
        setLoading(true)
        
        const quoteData = await quoteService.getQuote(offerId)
        
        if (!quoteData) {
          setError('Offerten hittades inte')
          return
        }
        
        console.log('🔍 RAW QUOTE DATA:', JSON.stringify(quoteData, null, 2))
        console.log('🔍 DETAILS OBJECT:', JSON.stringify(quoteData.details, null, 2))
        
        // FIXAT: Säkerställ rimliga bäravstånd med tak på 100 meter
        const startParkingDistance = sanitizeParkingDistance(quoteData.details?.startParkingDistance);
        const endParkingDistance = sanitizeParkingDistance(quoteData.details?.endParkingDistance);
        
        // Map services from form to pricing fields
        const serviceMappings = mapServicesToPricingFields(
          quoteData.details?.packingService,
          quoteData.details?.cleaningService,
          quoteData.details?.additionalBusinessServices || quoteData.details?.additionalServices
        );
        
        // FIXAT: Använd korrekt data från details-objektet
        const moveDetails = {
          // FIXAT: Volym - använd estimatedVolume eller beräkna från boarea
          volym_m3: quoteData.details?.estimatedVolume > 0 ? Number(quoteData.details.estimatedVolume) : Math.ceil((Number(quoteData.details?.startLivingArea) || Number(quoteData.details?.endLivingArea) || 80) * 0.35),
          // 🔧 FIXAT: Avstånd - använd calculatedDistance från formuläret
          avstand_km: Number(quoteData.details?.calculatedDistance || 0),
          
          // FIXAT: Hiss-mappning - använd 'trappa' istället för 'ingen' för korrekt prisberäkning
          hiss_typ_A: (quoteData.details?.startElevator === 'big' ? 'stor' : 
                      quoteData.details?.startElevator === 'small' ? 'liten' : 'trappa') as 'stor' | 'liten' | 'ingen' | 'trappa',
          hiss_typ_B: (quoteData.details?.endElevator === 'big' ? 'stor' : 
                      quoteData.details?.endElevator === 'small' ? 'liten' : 'trappa') as 'stor' | 'liten' | 'ingen' | 'trappa',
          // 🔧 FIXAT: Våningar - använd exakt det kunden valde
          vaningar_A: Number(quoteData.details?.startFloor || 0),
          vaningar_B: Number(quoteData.details?.endFloor || 0),
          lagenhet_kvm: Number(quoteData.details?.startLivingArea || 70),
          packHjalp: serviceMappings.packHjalp,
          flyttstad: serviceMappings.flyttstad,
          antal_tunga_objekt: quoteData.details?.largeItems?.length || 0,
          
          // FIXAT: Bäravstånd med tak på 100 meter och korrekt beräkning
          lang_barvag: startParkingDistance > 10 || endParkingDistance > 10,
          barvag_extra_meter: Math.max(
            Math.max(startParkingDistance - 10, 0),
            Math.max(endParkingDistance - 10, 0)
          ),
          
          nyckelkund: false,
          lagsasong: isLowSeason(quoteData.moveDate),
          
          // Additional services from mapping
          mobelmontering: serviceMappings.mobelmontering || false,
          upphangning: serviceMappings.upphangning || false,
          bortforsling: serviceMappings.bortforsling || false,
          allergistadning: false,
          
          // Kartong fields (set to 0 for now)
          antal_flyttkartonger: 0,
          antal_garderobskartonger: 0,
          antal_tavelkartonger: 0,
          antal_spegelkartonger: 0
        }
        
        console.log('Move details before price calculation:', moveDetails)
        console.log('Sanitized parking distances:', { start: startParkingDistance, end: endParkingDistance })
        
        const priceBreakdown = berakna_flyttkostnad(moveDetails)
        console.log('Price breakdown after calculation:', priceBreakdown)
        setPriceBreakdown(priceBreakdown)
        
        const offerData = {
          id: quoteData.id,
          customerName: quoteData.customerName || '',
          email: quoteData.email || '',
          phone: quoteData.phone || '',
          totalPrice: priceBreakdown.slutpris,
          status: quoteData.status?.toLowerCase() || 'pending',
          createdAt: quoteData.createdAt,
          expectedEndTime: quoteData.expectedEndTime || 'N/A',
          services: [{ name: 'Flyttjänst', price: priceBreakdown.slutpris }],
          moveDate: quoteData.moveDate || '',
          moveDetails: {
            ...moveDetails,
            // 🔧 FIXAT: Använd exakt kunddata utan fallbacks
            startFloor: quoteData.details?.startFloor,
            endFloor: quoteData.details?.endFloor,
            startElevator: quoteData.details?.startElevator,
            endElevator: quoteData.details?.endElevator,
            startDoorCode: quoteData.details?.startDoorCode,
            endDoorCode: quoteData.details?.endDoorCode,
            startParkingDistance: startParkingDistance,
            endParkingDistance: endParkingDistance,
            // FIXAT: Flyttkartonger - kolla needsMovingBoxes först
            movingBoxes: quoteData.details?.needsMovingBoxes === false ? 0 : (quoteData.details?.movingBoxes || 0),
            // FIXAT: Använd de korrekta värdena här också
            estimatedVolume: Number(quoteData.details?.estimatedVolume || moveDetails.volym_m3),
            calculatedDistance: Number(quoteData.details?.calculatedDistance || moveDetails.avstand_km),
            startPropertyType: quoteData.details?.startPropertyType || 'apartment',
            endPropertyType: quoteData.details?.endPropertyType || 'apartment',
            startLivingArea: quoteData.details?.startLivingArea,
            endLivingArea: quoteData.details?.endLivingArea,
            largeItems: quoteData.details?.largeItems || [],
            specialItems: quoteData.details?.specialItems || [],
            packingService: quoteData.details?.packingService || '',
            cleaningService: quoteData.details?.cleaningService || '',
            additionalServices: quoteData.details?.moveDetails?.additionalBusinessServices || quoteData.details?.additionalBusinessServices || quoteData.details?.additionalServices || [],
            specialInstructions: quoteData.details?.specialInstructions || '',
            paymentMethod: quoteData.details?.paymentMethod,
            needsMovingBoxes: quoteData.details?.needsMovingBoxes
          },
          details: {
            moveDate: quoteData.moveDate,
            // 🔧 FIXAT: Tid - använd exakt den tid kunden valde (moveTime, inte time)
            moveTime: quoteData.details?.moveTime,
            startAddress: quoteData.start_address || quoteData.details?.startAddress,
            endAddress: quoteData.end_address || quoteData.details?.endAddress,
            moveDetails: quoteData.details || {},
            estimatedVolume: Number(quoteData.details?.estimatedVolume || moveDetails.volym_m3),
            calculatedDistance: quoteData.details?.calculatedDistance,
            startParkingDistance: quoteData.details?.startParkingDistance,
            endParkingDistance: quoteData.details?.endParkingDistance,
            needsMovingBoxes: quoteData.details?.needsMovingBoxes,
            movingBoxes: quoteData.details?.movingBoxes,
            paymentMethod: quoteData.details?.paymentMethod,
            startFloor: quoteData.details?.startFloor,
            endFloor: quoteData.details?.endFloor,
            startElevator: quoteData.details?.startElevator,
            endElevator: quoteData.details?.endElevator
          },
          discount: priceBreakdown.rabatter?.komborabatt || 0,
          discountPercentage: priceBreakdown.komborabatt_procent || 0,
          isFallback: false
        } as Offer
        
        console.log('Processed offer data:', offerData)
        setOffer(offerData)
      } catch (error) {
        console.error('Error fetching offer:', error)
        setError(`Kunde inte hämta offerten (ID: ${offerId}). Vänligen kontrollera ID:t och försök igen.`)
      } finally {
        setLoading(false)
      }
    }
    
    if (offerId) {
      fetchOffer()
    }
  }, [offerId])

  // Services state - initialized after offer is loaded
  const [services, setServices] = useState(() => {
    const livingArea = Number(offer?.moveDetails?.startLivingArea || 70);
    return {
      moving: { selected: true, price: priceBreakdown?.slutpris || 3630 },
      fullPacking: { selected: false, price: livingArea * 44 },
      cleaning: { selected: false, price: livingArea * 44 },
    };
  });
  
  // Update services when offer is loaded - only run once
  useEffect(() => {
    if (offer && offer.moveDetails) {
      const livingArea = Number(offer.moveDetails.startLivingArea || 70);
      const packingSelected = isPackingServiceSelected(offer.moveDetails.packingService);
      const cleaningSelected = isCleaningServiceSelected(offer.moveDetails.cleaningService);
      
      setServices({
        moving: { selected: true, price: offer.totalPrice || 3630 },
        fullPacking: { selected: packingSelected, price: livingArea * 44 },
        cleaning: { selected: cleaningSelected, price: livingArea * 44 },
      });
      
      setSelectedServices({
        packHjalp: packingSelected,
        flyttstad: cleaningSelected
      });
    }
  }, [offer?.id]); // Only re-run if offer ID changes

  // Calculate total price
  const calculateTotalPrice = () => {
    const livingArea = Number(offer?.moveDetails?.startLivingArea || 70);
    let total = priceBreakdown?.slutpris || 3630;  // Grundpris för flytthjälp

    if (services.fullPacking.selected) {
      total += livingArea * 44;  // Pris för packning
    }
    if (services.cleaning.selected) {
      total += livingArea * 44;  // Pris för städning
    }

    return total;
  };

  // Uppdatera totalPrice beräkningen
  const totalPrice = calculateTotalPrice();

  // Original price before RUT deduction (for RUT explainer)
  const originalPrice = totalPrice * 2;

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1
        if (totalSeconds <= 0) {
          clearInterval(timer)
          return { hours: 0, minutes: 0, seconds: 0 }
        }

        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        // Update progress bar based on 24 hours
        const totalInitialSeconds = 24 * 3600
        const percentLeft = (totalSeconds / totalInitialSeconds) * 100
        setProgress(percentLeft)

        return { hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Inactivity timer for pulsing CTA
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }

      setIsPulsing(false)

      inactivityTimerRef.current = setTimeout(() => {
        setIsPulsing(true)
      }, 20000) // 20 seconds of inactivity
    }

    // Set initial timer
    resetInactivityTimer()

    // Reset timer on user interaction
    const handleUserActivity = () => resetInactivityTimer()

    window.addEventListener("mousemove", handleUserActivity)
    window.addEventListener("click", handleUserActivity)
    window.addEventListener("scroll", handleUserActivity)
    window.addEventListener("keydown", handleUserActivity)
    window.addEventListener("touchstart", handleUserActivity)

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      window.removeEventListener("mousemove", handleUserActivity)
      window.removeEventListener("click", handleUserActivity)
      window.removeEventListener("scroll", handleUserActivity)
      window.removeEventListener("keydown", handleUserActivity)
      window.removeEventListener("touchstart", handleUserActivity)
    }
  }, [])

  // Toggle service function
  const toggleService = (serviceType: string) => {
    const livingArea = Number(offer?.moveDetails?.startLivingArea || 70);
    setServices(prev => {
      const updatedServices = {
        ...prev,
        [serviceType]: {
          ...prev[serviceType as keyof typeof prev],
          selected: !prev[serviceType as keyof typeof prev].selected,
          price: livingArea * 44  // Sätt alltid priset baserat på kvadratmeter
        }
      };
      return updatedServices;
    });

    // Uppdatera selectedServices för att trigga prisberäkning
    if (serviceType === 'fullPacking') {
      setSelectedServices(prev => ({
        ...prev,
        packHjalp: !prev.packHjalp
      }));
    } else if (serviceType === 'cleaning') {
      setSelectedServices(prev => ({
        ...prev,
        flyttstad: !prev.flyttstad
      }));
    }
  };

  // Accept offer - UPPDATERAD med BankID och kreditkontroll
  const handleBookAll = async () => {
    try {
      // Visa bekräftelsedialog först
      const confirmed = await confirm({
        title: "Bekräfta din bokning",
        description: `Vill du boka flytthjälp för ${formatPrice(totalPrice)} kr? Din flytt är planerad till ${formatDate(offer?.details?.moveDate)}.`,
        confirmText: "Ja, boka flytthjälp",
        cancelText: "Avbryt",
      });
      
      if (!confirmed) {
        return;
      }

      // Om betalmetoden är faktura och det är en privatperson, starta BankID
      const customerType = offer?.details?.moveDetails?.customerType || offer?.details?.customerType || 'private';
      if (offer?.details?.paymentMethod === 'invoice' && customerType !== 'business') {
        setShowBankIDModal(true);
        // Vänta på att BankID och kreditkontroll ska slutföras
        return;
      }

      // För företag eller annan betalmetod, gå direkt till bokning
      await completeBooking();
    } catch (error) {
      console.error('Error in handleBookAll:', error);
      setError(error instanceof Error ? error.message : 'Ett fel uppstod. Vänligen försök igen.');
    }
  };

  // Hantera BankID-autentisering lyckades
  const handleBankIDSuccess = async (authData: any) => {
    try {
      setIsProcessingBooking(true);
      console.log('BankID authentication successful:', authData);

      // Spara personnummer och namn från BankID
      const personalNumber = authData.user?.personalNumber;
      const fullName = authData.user?.name;
      const givenName = authData.user?.givenName;
      const surname = authData.user?.surname;

      // Utför kreditkontroll via API
      const creditCheckResponse = await fetch('/api/credit-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalNumber,
          ipAddress: authData.device?.ipAddress,
          bookingId: offerId
        })
      });

      const creditResult = await creditCheckResponse.json();
      console.log('Credit check result:', creditResult);

      // Spara personnummer och namn i bokningen/CRM
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          personal_number: personalNumber,
          legal_name: fullName,
          given_name: givenName,
          surname: surname,
          credit_check_status: creditResult.status,
          credit_check_date: new Date().toISOString()
        })
        .eq('id', offerId);

      if (updateError) {
        console.error('Error updating booking with personal info:', updateError);
      }

      // Stäng BankID-modal
      setShowBankIDModal(false);

      // Om kreditkontroll nekades, byt till Swish
      let finalPaymentMethod = offer?.details?.paymentMethod;
      if (creditResult.status === 'rejected') {
        finalPaymentMethod = 'swish';
        console.log('Credit check rejected, switching to Swish payment');
      }

      // Slutför bokningen med rätt betalmetod
      await completeBooking(finalPaymentMethod, creditResult);
    } catch (error) {
      console.error('Error in handleBankIDSuccess:', error);
      setShowBankIDModal(false);
      setError('Ett fel uppstod vid kreditkontrollen. Vänligen försök igen.');
    } finally {
      setIsProcessingBooking(false);
    }
  };

  // Hantera BankID-avbrott
  const handleBankIDCancel = () => {
    setShowBankIDModal(false);
    creditCheck.handleAuthCancel();
  };

  // Slutför bokningen
  const completeBooking = async (paymentMethod?: string, creditCheckResult?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to accept offer with ID:', offerId);
      
      // Använd samma ID-rensning som quoteService
      const cleanId = offerId.trim();

      // Kontrollera först om det finns en bokning med detta ID
      const { data: existingBooking, error: checkBookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', cleanId)
        .single();

      if (checkBookingError) {
        console.error('Error checking booking:', checkBookingError);
        throw new Error('Kunde inte hitta bokningen');
      }

      if (!existingBooking) {
        console.error('No booking found with ID:', offerId);
        throw new Error('Bokningen hittades inte');
      }

      console.log('Found booking record:', existingBooking);

      // Uppdatera status i bookings med eventuell ny betalmetod
      const updateData: any = {
        status: 'accepted', // Använd engelska små bokstäver
        updated_at: new Date().toISOString()
      };

      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }

      // Ta bort credit_check_result eftersom den kolumnen inte finns
      // Kreditkontrollsinformation kan sparas i details eller i en separat tabell

      const { data: updateResult, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', cleanId)
        .select();

      if (updateError) {
        console.error('Error updating booking:', updateError);
        console.error('Update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        throw new Error(`Kunde inte uppdatera bokningens status: ${updateError.message || 'Okänt fel'}`);
      }
      
      console.log('Update successful:', updateResult);

      console.log('Successfully updated booking status');

      // 🎉 NYTT: Skicka bekräftelse-meddelanden
      console.log('Skickar bekräftelse-meddelanden...');
      
      const confirmResponse = await fetch('/api/send-booking-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: offerId,
          paymentMethod: paymentMethod || offer?.details?.paymentMethod,
          creditCheckResult
        })
      });

      const confirmResult = await confirmResponse.json();
      
      if (confirmResult.success) {
        console.log('Bekräftelse-meddelanden skickade:', confirmResult);
      } else {
        console.warn('Kunde inte skicka bekräftelse-meddelanden:', confirmResult.error);
        // Fortsätt ändå - booking är accepterad även om meddelanden misslyckas
      }

      // Uppdatera UI lokalt
      if (offer) {
        setOffer({
          ...offer,
          status: 'accepted'
        });
      }

      // Redirect till order confirmation med Next.js router - inkludera kreditkontrollsinfo
      const queryParams = new URLSearchParams();
      if (creditCheckResult?.status === 'rejected') {
        queryParams.set('creditRejected', 'true');
        queryParams.set('paymentMethod', 'swish');
      }
      
      const redirectUrl = queryParams.toString() 
        ? `/order-confirmation/${offerId}?${queryParams.toString()}`
        : `/order-confirmation/${offerId}`;
        
      router.push(redirectUrl);
    } catch (error) {
      console.error('Error accepting booking:', error);
      setError(error instanceof Error ? error.message : 'Ett fel uppstod när bokningen skulle accepteras. Vänligen försök igen.');
    } finally {
      setLoading(false);
    }
  };
  
  // Reject offer
  async function rejectOffer() {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'Rejected' })
        .eq('id', offerId)
      
      if (error) {
        throw error
      }
      
      setError('Tack för ditt svar. Din offert har avvisats.')
    } catch (error) {
      console.error('Error rejecting offer:', error)
      setError('Kunde inte avvisa offerten. Vänligen försök igen senare.')
    } finally {
      setLoading(false)
    }
  }

  // Uppdatera prisberäkningen när tjänster ändras
  useEffect(() => {
    if (offer?.moveDetails) {
      const updatedMoveDetails: MoveDetails = {
        volym_m3: offer.moveDetails.volym_m3 || 0,
        avstand_km: offer.moveDetails.avstand_km || 0,
        hiss_typ_A: offer.moveDetails.hiss_typ_A || 'ingen',
        vaningar_A: offer.moveDetails.vaningar_A || 0,
        hiss_typ_B: offer.moveDetails.hiss_typ_B || 'ingen',
        vaningar_B: offer.moveDetails.vaningar_B || 0,
        lagenhet_kvm: offer.moveDetails.lagenhet_kvm || 0,
        packHjalp: selectedServices.packHjalp,
        flyttstad: selectedServices.flyttstad,
        antal_tunga_objekt: offer.moveDetails.antal_tunga_objekt || 0,
        lang_barvag: offer.moveDetails.lang_barvag || false,
        barvag_extra_meter: offer.moveDetails.barvag_extra_meter || 0,
        nyckelkund: offer.moveDetails.nyckelkund || false,
        lagsasong: offer.moveDetails.lagsasong || false
      };
      
      console.log('Beräknar pris med:', updatedMoveDetails);
      const breakdown = berakna_flyttkostnad(updatedMoveDetails);
      console.log('Prisberäkning:', breakdown);
      setPriceBreakdown(breakdown);
      
      // Uppdatera totalpris
      if (breakdown) {
        const total = breakdown.delsummor.grundpris +
          (breakdown.delsummor.barhjalp_A || 0) +
          (breakdown.delsummor.barhjalp_B || 0) +
          (breakdown.delsummor.packkostnad || 0) +
          (breakdown.delsummor.stadkostnad || 0);
        
        setOffer(prev => prev ? {
          ...prev,
          totalPrice: total,
          discount: breakdown.rabatter?.komborabatt || 0,
          discountPercentage: 10 // 10% vid kombination av tjänster
        } : null);
      }
    }
  }, [offer?.moveDetails, selectedServices]);

  // Hjälpfunktion för att formatera datum
  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  // 🔧 FIXAT: formatTime - visa exakt vad kunden valde eller ingenting
  function formatTime(timeStr: string | undefined): string {
    if (!timeStr) return ''
    return timeStr.split(':').slice(0, 2).join(':')
  }

  // Uppdaterad formatName funktion
  function formatName(name: string | undefined): string {
    if (!name) return ''
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Format time left
  function formatTimeLeft(timeLeft: { hours: number; minutes: number; seconds: number }): string {
    const { hours, minutes, seconds } = timeLeft;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  // 🔧 FIXAT: Hjälpfunktioner för att visa exakt kunddata
  function formatElevator(elevator: string | undefined): string {
    if (elevator === 'big') return 'Stor hiss'
    if (elevator === 'small') return 'Liten hiss'
    if (elevator === 'none') return 'Ingen hiss'
    return 'Ej angivet'
  }

  function formatPaymentMethod(method: string | undefined): string {
    if (method === 'invoice') return 'Faktura'
    if (method === 'swish') return 'Swish'
    if (method === 'installment') return 'Delbetalning'
    return 'Ej angivet'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar offert...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-2 text-xl font-semibold text-red-700">Ett fel uppstod</h2>
            <p className="mt-2 text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!offer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-2 text-xl font-semibold text-gray-800">Offert hittades inte</h2>
            <p className="mt-2 text-gray-600">Den begärda offerten kunde inte hittas.</p>
          </div>
        </div>
      </div>
    )
  }
  
  // If the offer has already been accepted or rejected, show appropriate message
  if (offer.status === 'accepted' || offer.status === 'accepterad') {
    // Use Next.js router for client-side navigation
    router.push(`/order-confirmation/${offerId}`);
    // Return a loading state while redirecting
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Går till orderbekräftelse...</p>
        </div>
      </div>
    );
  }
  
  if (offer.status === 'rejected') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-600 p-4">
            <h1 className="text-2xl font-bold text-white text-center">Nordflytt</h1>
          </div>
          <div className="p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">Offert avvisad</h2>
            <p className="mt-2 text-gray-600">
              Tack {offer.customerName}! Vi noterar att du har avvisat denna offert.
            </p>
            <p className="mt-4 text-gray-600">
              Om du har ändrat dig eller vill diskutera andra alternativ, vänligen kontakta oss.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className="min-h-screen bg-[#F7F5F0] pb-24">
        <div className="mx-auto px-4 md:px-8 max-w-full md:max-w-[720px] lg:max-w-[1200px]">
        {/* Header Section */}
        <section className="pt-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black mt-6">
            Vi har ett förslag till dig, {formatName(offer.customerName)}!
          </h1>
          <h3 className="text-base md:text-xl font-medium text-[#002A5C] mt-2">
            Boka din flytt på under 60 sekunder – priset är reserverat för dig!
          </h3>
        </section>

        {/* Timer Strip */}
        <section className="mt-4">
          <Card className="p-4 md:p-5 bg-white">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <BellIcon className={cn("w-5 h-5 md:w-6 md:h-6 mr-2", isTimerLow && "text-[#FF2C84] animate-pulse")} />
                <span className="text-base md:text-lg font-medium text-[#FF2C84]">
                  Priset gäller bara i {timeLeft.hours}h {timeLeft.minutes}m
                </span>
              </div>
              <div
                className={cn(
                  "font-mono font-medium text-lg md:text-xl flex items-center",
                  isTimerLow && "text-[#FF2C84] font-bold",
                )}
              >
                <ClockIcon className={cn("w-5 h-5 mr-2", isTimerLow && "text-[#FF2C84] animate-pulse")} />
                {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </div>
            </div>
            <Progress value={progress} className="h-2 md:h-3 bg-[#E0E0E0]" indicatorClassName="bg-[#FF2C84]" />
          </Card>
        </section>

        <OfferBenefits />

        {/* Above the fold - Main focus area */}
        <div className="mt-6 lg:flex lg:gap-8 lg:items-start">
          {/* Left Column: Moving details */}
          <div className="lg:flex-1 mb-6 lg:mb-0">
            {/* Moving Info Card */}
            <Card className="p-4 md:p-5 border border-[#E0E0E0] rounded-lg shadow-sm bg-white">
              <div className="flex items-start">
                <TruckIcon className="w-6 h-6 md:w-7 md:h-7 mr-3 text-[#002A5C] flex-shrink-0" />
                <div className="w-full">
                  <h2 className="font-bold text-lg md:text-xl flex items-center">
                    Flytthjälp
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="w-4 h-4 ml-2 text-[#4F4F4F] cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="text-xs max-w-[200px]">
                            <p className="font-bold">Vad ingår?</p>
                            <p className="mt-1">
                              Inplastning, nedmontering, bärhjälp, transport, försäkring och smart planering.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h2>
                  <div className="mt-4 space-y-4">
                    {/* 🔧 FIXAT: Datum och tid - visa exakt tid eller inget */}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-[#4F4F4F]" />
                      <span>
                        {formatDate(offer.details?.moveDate)}
                        {offer.details?.moveTime && ` ${formatTime(offer.details.moveTime)}`}
                      </span>
                    </div>

                    {/* Från-adress med detaljer */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center mb-3">
                        <MapPin className="w-5 h-5 text-gray-500 mr-2" />
                        <span className="font-medium">Från: {offer.details?.startAddress}</span>
                      </div>
                      <div className="ml-7 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Bostadstyp: {
                            offer.moveDetails?.startPropertyType === 'apartment' ? 'Lägenhet' :
                            offer.moveDetails?.startPropertyType === 'house' ? 'Villa' :
                            'Lägenhet'
                          }</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ArrowBigUpDash className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {/* 🔧 FIXAT: Visa exakt våning från kunddata */}
                            Våning: {offer.details?.startFloor || 'Ej angivet'} ({formatElevator(offer.details?.startElevator)})
                          </span>
                        </div>

                        {offer.moveDetails?.startDoorCode && (
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Portkod: {offer.moveDetails.startDoorCode}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {/* 🔧 FIXAT: Visa exakt parkeringsavstånd */}
                            Avstånd till parkering: {offer.details?.startParkingDistance || offer.moveDetails?.startParkingDistance || 'Ej angivet'} meter
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Till-adress med detaljer */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center mb-3">
                        <MapPin className="w-5 h-5 text-gray-500 mr-2" />
                        <span className="font-medium">Till: {offer.details?.endAddress}</span>
                      </div>
                      <div className="ml-7 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Bostadstyp: {
                            offer.moveDetails?.endPropertyType === 'apartment' ? 'Lägenhet' :
                            offer.moveDetails?.endPropertyType === 'house' ? 'Villa' :
                            'Lägenhet'
                          }</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ArrowBigUpDash className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {/* 🔧 FIXAT: Visa exakt våning från kunddata */}
                            Våning: {offer.details?.endFloor || 'Ej angivet'} ({formatElevator(offer.details?.endElevator)})
                          </span>
                        </div>

                        {offer.moveDetails?.endDoorCode && (
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Portkod: {offer.moveDetails.endDoorCode}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {/* 🔧 FIXAT: Visa exakt parkeringsavstånd */}
                            Avstånd till parkering: {offer.details?.endParkingDistance || offer.moveDetails?.endParkingDistance || 'Ej angivet'} meter
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 🔧 FIXAT: Volym och avstånd - ta bort "0" som visar */}
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Volym: {offer.details?.estimatedVolume || offer.moveDetails?.volym_m3} m³
                        </span>
                      </div>

                      {/* 🔧 FIXAT: Visa bara avstånd om det finns och inte är 0 */}
                      {offer.details?.calculatedDistance && Number(offer.details.calculatedDistance) > 0 && (
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Avstånd: {offer.details.calculatedDistance} km
                          </span>
                        </div>
                      )}

                      {/* FIXAT: Flyttkartonger - visa bara om needsMovingBoxes är true */}
                      {offer.details?.needsMovingBoxes !== false && offer.moveDetails?.movingBoxes && Number(offer.moveDetails.movingBoxes) > 0 && (
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Flyttkartonger: {offer.moveDetails?.movingBoxes} st
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                        {/* 🔧 FIXAT: Visa exakt betalsätt från kunddata */}
                        <span className="text-sm text-gray-600">
                          Önskat betalsätt: {formatPaymentMethod(offer.details?.paymentMethod)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center mt-4">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">{offer.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Price + CTA */}
          <div className="lg:w-[400px]">
            <PriceCTASection 
              totalPrice={priceBreakdown?.slutpris || offer.totalPrice}
              isPulsing={isPulsing}
              handleBookAll={handleBookAll}
              livingArea={Number(offer.moveDetails?.startLivingArea || 70)}
              packingService={offer.moveDetails?.packingService}
              cleaningService={offer.moveDetails?.cleaningService}
              additionalServices={offer.moveDetails?.additionalServices || offer.moveDetails?.additionalBusinessServices}
              movingBoxes={offer.moveDetails?.movingBoxes || offer.details?.movingBoxes || 0}
              rentalBoxes={offer.moveDetails?.rentalBoxes || offer.details?.rentalBoxes || {}}
            />
          </div>
        </div>

        {/* Reco Widget Section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Vad våra kunder säger</h2>
          <RecoWidget />
        </div>

        {/* PDF Documents Section */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Viktiga dokument</h2>
          <PdfDocuments />
        </section>

        {/* Footer */}
        <section className="mt-12 text-center">
          <p className="text-base md:text-lg mb-3">Har du frågor om din offert?</p>
          <Button
            variant="outline"
            className="flex items-center justify-center border-[#002A5C] text-[#002A5C] mx-auto px-6 h-10 hover:bg-blue-50 max-w-xs"
            asChild
          >
            <a href="tel:010-555 12 89">
              <PhoneIcon className="w-5 h-5 mr-2" />
              Kontakta oss
            </a>
          </Button>
        </section>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <span className="text-2xl mr-2">❗</span>
              Vill du hoppa över någon tjänst?
            </DialogTitle>
            <DialogDescription className="text-base pt-3">
              Vi rekommenderar att du behåller alla tjänster för bästa möjliga flyttupplevelse.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-3">
            <Button
              className="w-full bg-[#4CAF50] hover:bg-[#388E3C] text-white flex items-center justify-center py-3 h-auto text-base"
              onClick={() => setShowModal(false)}
            >
              <CheckIcon className="w-5 h-5 mr-2" />
              Behåll alla tjänster
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#FF2C84] text-[#FF2C84] py-3 h-auto text-base"
              onClick={() => setShowModal(false)}
            >
              Fortsätt ändå
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kontakta oss</DialogTitle>
            <DialogDescription>
              Vi hjälper dig gärna med dina frågor om offerten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button className="w-full" asChild>
              <a href="tel:010-555 12 89">
                <PhoneIcon className="w-5 h-5 mr-2" />
                Ring oss
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BankID Modal */}
      <Dialog open={showBankIDModal} onOpenChange={setShowBankIDModal}>
        <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Identifiering med BankID</DialogTitle>
            <DialogDescription>
              För att kunna erbjuda faktura behöver vi verifiera din identitet och göra en kreditkontroll.
            </DialogDescription>
          </DialogHeader>
          <BankIDAuth
            onSuccess={handleBankIDSuccess}
            onCancel={handleBankIDCancel}
            onError={(error) => {
              console.error('BankID error:', error);
              setShowBankIDModal(false);
              setError('Ett fel uppstod vid identifieringen. Vänligen försök igen.');
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Maja AI Chatbot - Offert-specifik kontext */}
      <ChatWidget 
        initialMessage={`Hej! 👋 Jag ser att du tittar på din offert för flytten från ${offer.details?.startAddress || 'din nuvarande adress'} till ${offer.details?.endAddress || 'din nya adress'} den ${offer.details?.moveDate ? format(new Date(offer.details.moveDate), 'd MMMM', { locale: sv }) : 'valda datumet'}. 

Jag kan hjälpa dig med:
• Frågor om din offert och priset (${formatPrice(totalPrice)})
• Lägga till eller ta bort tjänster
• Information om RUT-avdrag
• Boka din flytt direkt
• Svara på alla frågor om flytten

Vad kan jag hjälpa dig med?`}
        customerInfo={{
          name: offer.customerName,
          email: offer.email,
          phone: offer.phone
        }}
        position="bottom-right"
        theme="nordflytt"
      />
      
      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
    </ErrorBoundary>
  )
}
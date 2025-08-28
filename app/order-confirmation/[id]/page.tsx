"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import dynamic from "next/dynamic"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  CheckIcon,
  PackageIcon,
  DownloadIcon,
  MessageCircleIcon,
  HomeIcon,
  TruckIcon,
  InfoIcon,
  BellIcon,
  UserIcon,
  CalendarIcon,
  FileIcon,
  CheckSquareIcon,
  PhoneIcon,
  PencilIcon,
  ShareIcon,
  FolderIcon,
  XIcon,
  Brush as BroomIcon,
  ChevronRightIcon,
  LinkIcon,
  MessageSquareIcon,
  Plus,
  Camera as CameraIcon
} from "lucide-react"

// Dynamiskt importera Confetti för att undvika SSR-problem
const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useMobile } from "@/hooks/use-mobile"
import { createClientComponentClient, quoteService, reviewService } from "@/lib/supabase"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
// import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import ChatWidget from "@/components/ChatWidget"
import { format } from "date-fns"
import { sv } from "date-fns/locale"

// 🔧 PRICING CONFIG - Ersätt hårdkodade värden
const PRICING_CONFIG = {
  packingPerSqm: 44,    // kr per m² för packning
  cleaningPerSqm: 44,   // kr per m² för städning
  packingMinPrice: 800, // Minimum pris för packning
  cleaningMinPrice: 800 // Minimum pris för städning
};

// Typer för data
interface Service {
  id: string
  name: string
  price: number
}

interface Order {
  id: string
  customerName: string
  email: string
  phone: string
  totalPrice: number
  services: Service[]
  serviceTypes: string[]
  orderNumber?: string
  address?: string
  moveDate?: string
  moveTime?: string
  moveSize?: string
  address_to?: string
  status: string
  customer_id?: string
  details?: {
    startPropertyType?: string
    endPropertyType?: string
    startLivingArea?: string | number
    endLivingArea?: string | number
    startFloor?: string | number
    endFloor?: string | number
    startElevator?: 'big' | 'small' | 'none'
    endElevator?: 'big' | 'small' | 'none'
    startAddress?: string
    endAddress?: string
    name?: string
    email?: string
    phone?: string
    creditCheckStatus?: string
    creditCheckReason?: string
    paymentMethod?: string
  }
  paymentMethod?: string
  isFallback?: boolean
}

function OrderConfirmationPageInner() {
  console.log('🚀 OrderConfirmationPage component loaded!');
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  
  // Hämta kreditkontrollsinformation från URL
  const creditRejected = searchParams.get('creditRejected') === 'true'
  const paymentMethodFromUrl = searchParams.get('paymentMethod')
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const hasFetchedOrder = useRef(false);
  
  // Refs för Google Maps Autocomplete
  const startAddressInputRef = useRef<HTMLInputElement>(null);
  const endAddressInputRef = useRef<HTMLInputElement>(null);
    
    // Review states
    const [selectedRating, setSelectedRating] = useState<number>(0);
    const [showGoogleReviewModal, setShowGoogleReviewModal] = useState(false);
    const [showLowRatingModal, setShowLowRatingModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const hasCheckedReview = useRef(false);

    // Create a Supabase client using the proper import - MOVED OUTSIDE OR USE useMemo
    // Note: createClientComponentClient creates a new instance each time, which causes re-renders
    
    const [error, setError] = useState<string | null>(null)
    const [showContactModal, setShowContactModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showVolumeModal, setShowVolumeModal] = useState(false)
    const [showServicesModal, setShowServicesModal] = useState(false)
    const [showDateModal, setShowDateModal] = useState(false)
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [showPhotosModal, setShowPhotosModal] = useState(false)
    const [jobPhotos, setJobPhotos] = useState<any>({ moving: [], cleaning: [] })
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
    const [newDate, setNewDate] = useState("")
    const [newTime, setNewTime] = useState("")
    const [newStartAddress, setNewStartAddress] = useState("")
    const [newEndAddress, setNewEndAddress] = useState("")
    
    // 🔥 DEBUG: Spåra alla ändringar av address states
    useEffect(() => {
      console.log('🔥 newStartAddress changed to:', newStartAddress);
      console.trace('🔍 WHO CHANGED newStartAddress?');
    }, [newStartAddress]);
    
    useEffect(() => {
      console.log('🔥 newEndAddress changed to:', newEndAddress);
      console.trace('🔍 WHO CHANGED newEndAddress?');
    }, [newEndAddress]);
    const [newStartFloor, setNewStartFloor] = useState("")
    const [newEndFloor, setNewEndFloor] = useState("")
    const [newStartElevator, setNewStartElevator] = useState<'big' | 'small' | 'none'>('none')
    const [newEndElevator, setNewEndElevator] = useState<'big' | 'small' | 'none'>('none')
    const [newVolume, setNewVolume] = useState("")
    const [newPrice, setNewPrice] = useState<number | null>(null)
    const isMobile = useMobile()
    
    // State för tilläggstjänster från databasen
    const [dbAdditionalServices, setDbAdditionalServices] = useState<any[]>([])
    const [additionalServicesTotal, setAdditionalServicesTotal] = useState(0)

    // Lägg till state för konfetti - FIX: säkerställ client-side rendering
    const [showConfetti, setShowConfetti] = useState(false)
    const [windowDimensions, setWindowDimensions] = useState({
      width: 1000,
      height: 800
    })
    // 🔧 NYTT: State för förbättrad address modal
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
    const [calculatedDistance, setCalculatedDistance] = useState<string | null>(null)
    const [newCalculatedPrice, setNewCalculatedPrice] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    
    // Tvåstegsprocess states
    const [showConfirmationStep, setShowConfirmationStep] = useState(false)
    const [previewData, setPreviewData] = useState<{
      newStartAddress: string;
      newEndAddress: string;
      newPrice: number;
      oldPrice: number;
      priceChange: number;
      distance: string;
      newStartFloor: string;
      newEndFloor: string;
      newStartElevator: 'big' | 'small' | 'none';
      newEndElevator: 'big' | 'small' | 'none';
    } | null>(null)
    const [preventAutoSave, setPreventAutoSave] = useState(true)
    const [allowApiCall, setAllowApiCall] = useState(false)
    
    // Custom autocomplete state - MÅSTE vara på top level
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

    // Debug showAddressModal state changes
    useEffect(() => {
      console.log('🚨 showAddressModal changed to:', showAddressModal);
      console.log('🚨 Current component state:', {
        showAddressModal,
        modalIsOpen: showAddressModal === true,
        typeofShowAddressModal: typeof showAddressModal
      });
    }, [showAddressModal]);

    // 🔧 TEMPORÄRT AVAKTIVERAD - Fetch interceptor kan orsaka problem
    // useEffect(() => {
    //   console.log('🔥 FETCH INTERCEPTOR AVAKTIVERAD FÖR DEBUG');
    // }, []);
    
    useEffect(() => {
      console.log('🔥 FETCH INTERCEPTOR DISABLED FOR TESTING');
      console.log('🔥 API calls should now work without interference');
    }, []);

const calculateDistanceAndPrice = useCallback(async (origin: string, destination: string) => {
  // 🔍 DEBUG först
  console.log('🔍 FUNCTION CALLED WITH:', { origin, destination });
  console.log('🔍 orderId:', orderId);
  console.log('🔍 order exists:', !!order);
  console.log('🔍 order.moveSize:', order?.moveSize);
  
  // Kontrollera villkor
  if (!origin || !destination || origin.length < 3 || destination.length < 3) {
    console.log('🔍 EARLY RETURN - addresses too short');
    return; // Avsluta här om villkoren inte uppfylls
  }

  // Fortsätt med resten av funktionen
  setIsCalculatingDistance(true)
  try {
    // Din befintliga kod här...
    // Anropa recalculate-price API
    const response = await fetch('/api/recalculate-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: orderId,
        newStartAddress: origin,
        newEndAddress: destination,
        currentBookingData: {
          volym_m3: Number(order?.moveSize) || 19,
          serviceTypes: order?.serviceTypes || ['moving'],
          livingArea: Number(order?.details?.startLivingArea) || 70
        }
      })
    })
    console.log('🔍 Raw API response status:', response.status);
    const result = await response.json();
    console.log('🔍 API Response:', result);

   

    // 🔍 LÄGG TILL DENNA DEBUG:
    console.log('🔍 API Response:', result);
    console.log('🔍 Response success:', result.success);
    console.log('🔍 Response error:', result.error);
    console.log('🔍 New price:', result.newPrice);
    
    if (result.success) {
      console.log('✅ Setting new calculated price to:', result.newPrice);
      setCalculatedDistance(result.distance)
      setNewCalculatedPrice(result.newPrice)
      console.log('✅ State should now be updated to:', result.newPrice);
      return result.newPrice; // ← LÄGG TILL DENNA RAD
    } else {
      console.error('Price calculation failed:', result.error)
      setCalculatedDistance(null)
      setNewCalculatedPrice(null)
      return null; // ← LÄGG TILL DENNA RAD
    }
  } catch (error) {
    console.error('Error calculating price:', error)
    setCalculatedDistance(null)
    setNewCalculatedPrice(null)
  } finally {
    setIsCalculatingDistance(false)
  }
}, [orderId, order])

// STEG 2: Faktisk sparning efter bekräftelse
const handleConfirmAndSave = async () => {
  console.log('🔵 STEG 2: Bekräftad sparning till databas');
  
  if (!previewData) {
    console.error('Ingen preview-data att spara');
    return;
  }
  
  // Visa att sparning pågår
  setIsSaving(true);
  setSaveSuccess(false);
  setAllowApiCall(true);
  
  try {
    // Spara till databas med bekräftad data
    console.log('🔥 BEKRÄFTAD SPARNING: API-anrop med förhandsgranskat data');
    
    const response = await fetch('/api/update-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: orderId,
        updates: {
          start_address: previewData.newStartAddress,
          end_address: previewData.newEndAddress,
          total_price: previewData.newPrice,
          details: {
            startFloor: newStartFloor,
            endFloor: newEndFloor,
            startElevator: newStartElevator,
            endElevator: newEndElevator,
            calculatedDistance: previewData.distance
          }
        }
      })
    });

    const result = await response.json();
    
    if (!result.success) throw new Error(result.error || 'Update failed');
    
    // Uppdatera local state
    setOrder(prev => prev ? {
      ...prev,
      address: previewData.newStartAddress,
      address_to: previewData.newEndAddress,
      totalPrice: previewData.newPrice,
      details: {
        ...prev.details,
        startAddress: previewData.newStartAddress,
        endAddress: previewData.newEndAddress,
        startFloor: newStartFloor,
        endFloor: newEndFloor,
        startElevator: newStartElevator,
        endElevator: newEndElevator
      }
    } : null);
    
    // Visa framgång
    setSaveSuccess(true);
    console.log('✅ Adresser och pris uppdaterat i databas!');
    
    // Vänta så användaren ser framgången
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reset alla states och stäng modal
    setSaveSuccess(false);
    setIsSaving(false);
    setAllowApiCall(false);
    setShowConfirmationStep(false);
    setPreviewData(null);
    setShowAddressModal(false);
    setShowEditModal(false);
    setNewStartAddress("");
    setNewEndAddress("");
    setNewStartFloor("");
    setNewEndFloor("");
    setNewStartElevator('none');
    setNewEndElevator('none');
    setCalculatedDistance(null);
    setNewCalculatedPrice(null);
    
  } catch (error) {
    console.error('Error saving confirmed changes:', error);
    alert('Kunde inte spara ändringarna. Försök igen.');
    setIsSaving(false);
    setSaveSuccess(false);
    setAllowApiCall(false);
  }
};

    // State för att förhindra automatisk sparning
    const [isManualSave, setIsManualSave] = useState(false);

    // GAMMAL FUNKTION - BLOCKERA TOTALT
    const handleEnhancedAddressChange = async () => {
      console.error('🚨🚨🚨 GAMMAL handleEnhancedAddressChange ANROPAD - BLOCKERAD!');
      console.trace('VEM ANROPAR GAMLA FUNKTIONEN?');
      return; // TOTAL BLOCKERING
    };

// GAMLA FUNKTIONEN TOTALT BORTTAGEN

// NY TVÅSTEGSPROCESS - BARA DENNA ANROPAS
// STEG 1: Beräkna och visa bekräftelse (TOTAL NY FUNKTION)
const handleCalculateAndPreview = async () => {
  console.log('🔵 NY TVÅSTEGSPROCESS - STEG 1: Beräkna pris');
  
  if (!newStartAddress || !newEndAddress) {
    alert('Fyll i både från- och till-adress');
    return;
  }
  
  // Visa att beräkning pågår
  setIsCalculatingDistance(true);
  
  try {
    console.log('🔍 Beräknar pris för förhandsgranskning...');
    
    // Beräkna nytt pris och avstånd
    const calculatedPrice = await calculateDistanceAndPrice(newStartAddress, newEndAddress);
    const newPrice = calculatedPrice || order?.totalPrice || 0;
    const oldPrice = order?.totalPrice || 0;
    const priceChange = newPrice - oldPrice;
    
    console.log('🔍 Beräkning klar:', { newPrice, oldPrice, priceChange });
    
    // Spara preview-data
    setPreviewData({
      newStartAddress,
      newEndAddress,
      newPrice,
      oldPrice,
      priceChange,
      distance: calculatedDistance || 'Okänt'
    });
    
    // Visa bekräftelse-steg
    setShowConfirmationStep(true);
    
  } catch (error) {
    console.error('Error calculating preview:', error);
    alert('Kunde inte beräkna pris. Försök igen.');
  } finally {
    setIsCalculatingDistance(false);
  }
};


// Uppdatera fönsterstorlek för konfetti - FIX: säkerställ client-side
useEffect(() => {
  // Sätt initial fönsterstorlek endast på client
  setWindowDimensions({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  // Visa konfetti när komponenten är mounted på client
  setShowConfetti(true)

  const handleResize = () => {
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
        })
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Stäng av konfetti efter en viss tid
    useEffect(() => {
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000) // Konfetti visas i 5 sekunder

      return () => clearTimeout(timer)
    }, [])

    // Custom Google Places Autocomplete - BYPASS modal overflow issues
    useEffect(() => {
      console.log('🎯🎯🎯 CUSTOM AUTOCOMPLETE USEEFFECT KÖRS!!!');
      console.log('🎯 showAddressModal:', showAddressModal);
      
      if (!showAddressModal) {
        console.log('❌ Modal not open, skipping autocomplete init');
        return;
      }
      
      if (!window.google?.maps?.places) {
        console.log('❌ Google Maps not loaded yet');
        return;
      }
      
      console.log('🔍 Setting up CUSTOM autocomplete solution...');
      
      // Create custom dropdown element
      const createCustomDropdown = (inputRef: React.RefObject<HTMLInputElement>, inputType: 'start' | 'end') => {
        const existingDropdown = document.getElementById(`custom-dropdown-${inputType}`);
        if (existingDropdown) {
          existingDropdown.remove();
        }
        
        const dropdown = document.createElement('div');
        dropdown.id = `custom-dropdown-${inputType}`;
        dropdown.className = 'custom-autocomplete-dropdown';
        dropdown.style.cssText = `
          position: fixed !important;
          z-index: 2147483647 !important;
          background: white !important;
          border: 2px solid #007bff !important;
          border-radius: 6px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
          max-height: 250px !important;
          overflow-y: auto !important;
          display: none !important;
          min-width: 300px !important;
          font-family: inherit !important;
          font-size: 14px !important;
          visibility: hidden !important;
          opacity: 0 !important;
          transition: opacity 0.2s ease !important;
        `;
        
        // Force styles to ensure visibility
        dropdown.setAttribute('data-testid', `autocomplete-${inputType}`);
        dropdown.setAttribute('role', 'listbox');
        
        // KRITISK FIX: Förhindra dropdown från att stänga modal
        dropdown.addEventListener('click', (e) => {
          console.log('🛡️ Dropdown clicked - preventing modal close');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        });
        
        dropdown.addEventListener('mousedown', (e) => {
          console.log('🛡️ Dropdown mousedown - preventing modal close');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        });
        
        document.body.appendChild(dropdown);
        console.log(`✅ Created custom dropdown for ${inputType} address`);
        return dropdown;
      };
      
      // Google Places service
      const placesService = new window.google.maps.places.AutocompleteService();
      
      // Function to get suggestions
      const getSuggestions = async (input: string, inputType: 'start' | 'end') => {
        if (input.length < 2) return;
        
        console.log(`🔍 Getting suggestions for "${input}"`);
        
        placesService.getPlacePredictions({
          input: input,
          componentRestrictions: { country: 'se' },
          types: ['address']
        }, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            console.log(`✅ Got ${predictions.length} suggestions for ${inputType}`);
            setSuggestions(predictions); // Uppdatera state
            showCustomDropdown(predictions, inputType);
          } else {
            console.log('❌ No suggestions found or error:', status);
            setSuggestions([]); // Rensa state
            hideCustomDropdown(inputType);
          }
        });
      };
      
      // Show custom dropdown
      const showCustomDropdown = (predictions: any[], inputType: 'start' | 'end') => {
        const dropdown = document.getElementById(`custom-dropdown-${inputType}`);
        const inputRef = inputType === 'start' ? startAddressInputRef : endAddressInputRef;
        
        if (!dropdown || !inputRef.current) return;
        
        // Position dropdown INOM VIEWPORT
        const rect = inputRef.current.getBoundingClientRect();
        
        // Använd fixed position relativt till viewport, INTE scroll position
        let top = rect.bottom + 5;
        let left = rect.left;
        const width = Math.max(rect.width, 300);
        
        // KRITISK FIX: Håll dropdown inom viewport
        const dropdownHeight = 250; // max-height från CSS
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Om dropdown skulle hamna utanför viewport nedtill, visa uppåt
        if (top + dropdownHeight > viewportHeight) {
          top = rect.top - dropdownHeight - 5;
          console.log('🔄 Flipping dropdown above input to stay in viewport');
        }
        
        // Om dropdown skulle hamna utanför viewport till höger, flytta vänster
        if (left + width > viewportWidth) {
          left = viewportWidth - width - 10;
          console.log('🔄 Moving dropdown left to stay in viewport');
        }
        
        // Se till att dropdown inte hamnar utanför vänster kant
        if (left < 0) {
          left = 10;
        }
        
        // Se till att dropdown inte hamnar utanför toppen
        if (top < 0) {
          top = 10;
        }
        
        // NUCLEAR STYLING - Gör dropdown OMÖJLIG att missa
        dropdown.style.setProperty('position', 'fixed', 'important');
        dropdown.style.setProperty('top', `${top}px`, 'important');
        dropdown.style.setProperty('left', `${left}px`, 'important');
        dropdown.style.setProperty('width', `${width}px`, 'important');
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '2147483647', 'important');
        dropdown.style.setProperty('background', 'white', 'important');
        dropdown.style.setProperty('border', '3px solid red', 'important'); // Extra synlig border
        dropdown.style.setProperty('box-shadow', '0 0 20px rgba(255, 0, 0, 0.5)', 'important'); // Röd glöd
        dropdown.style.setProperty('transform', 'none', 'important');
        dropdown.style.setProperty('clip', 'none', 'important');
        dropdown.style.setProperty('clip-path', 'none', 'important');
        dropdown.style.setProperty('pointer-events', 'auto', 'important');
        dropdown.style.setProperty('user-select', 'none', 'important');
        
        console.log('📍 Dropdown positioned WITHIN VIEWPORT at:', {
          top,
          left,
          width,
          inputRect: rect,
          viewport: {
            width: viewportWidth,
            height: viewportHeight
          },
          isVisible: top >= 0 && left >= 0 && top < viewportHeight && left < viewportWidth,
          flippedVertical: top < rect.bottom,
          adjustedHorizontal: left !== rect.left
        });
        
        setShowSuggestions(true); // Uppdatera state
        
        // Populate suggestions med extra synlig styling
        dropdown.innerHTML = `
          <div style="background: #007bff; color: white; padding: 8px; font-weight: bold; border-radius: 4px 4px 0 0;">
            🗺️ ${predictions.length} adressförslag
          </div>
        ` + predictions.map((prediction, index) => `
          <div class="custom-suggestion-item" data-place-id="${prediction.place_id}" data-description="${prediction.description}" style="
            padding: 12px 16px !important;
            cursor: pointer !important;
            border-bottom: 1px solid #eee !important;
            font-size: 14px !important;
            background: white !important;
            color: #333 !important;
            transition: background-color 0.2s !important;
            pointer-events: auto !important;
            user-select: none !important;
            position: relative !important;
          " onmouseover="this.style.backgroundColor='#f8f9fa'; this.style.color='#007bff'; console.log('Hovering:', this.getAttribute('data-description'));" onmouseout="this.style.backgroundColor='white'; this.style.color='#333';" onclick="console.log('Inline click on:', this.getAttribute('data-description'));">
            📍 ${prediction.description}
          </div>
        `).join('');
        
        // Add click handlers med förbättrad funktionalitet
        dropdown.querySelectorAll('.custom-suggestion-item').forEach((item, index) => {
          item.addEventListener('click', (e) => {
            console.log('🖱️ Dropdown item clicked!', item);
            
            // KRITISK FIX: Förhindra modal från att stängas
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const description = item.getAttribute('data-description');
            console.log('📝 Selected description:', description);
            
            if (description) {
              console.log(`✅ Setting ${inputType} address to: ${description}`);
              
              // Markera att detta är en autocomplete-click
              window.autocompleteClickInProgress = true;
              setTimeout(() => {
                window.autocompleteClickInProgress = false;
              }, 500);
              
              // Uppdatera state
              if (inputType === 'start') {
                setNewStartAddress(description);
                console.log('🔄 Updated newStartAddress state');
              } else {
                setNewEndAddress(description);
                console.log('🔄 Updated newEndAddress state');
              }
              
              // Uppdatera input-fältet visuellt
              if (inputRef.current) {
                inputRef.current.value = description;
                console.log('✏️ Updated input field value');
                
                // Trigga change event för att säkerställa att React ser ändringen
                const changeEvent = new Event('change', { bubbles: true });
                inputRef.current.dispatchEvent(changeEvent);
              }
              
              // Stäng dropdown
              hideCustomDropdown(inputType);
              console.log('📦 Dropdown hidden');
              
              // Kolla om båda adresser är ifyllda för prisberäkning
              setTimeout(() => {
                const startAddr = inputType === 'start' ? description : newStartAddress;
                const endAddr = inputType === 'end' ? description : newEndAddress;
                
                if (startAddr && endAddr && startAddr.length > 5 && endAddr.length > 5) {
                  console.log('🔥 Both addresses filled, ready for price calculation!');
                  console.log('🔥 Start:', startAddr);
                  console.log('🔥 End:', endAddr);
                  // Här kan vi senare trigga automatisk prisberäkning
                }
              }, 100);
              
              console.log(`✅ Address selection complete: ${description}`);
            } else {
              console.error('❌ No description found on clicked item');
            }
          });
          
          // Extra debug för hover
          item.addEventListener('mouseenter', () => {
            console.log('🖱️ Hovering over:', item.getAttribute('data-description'));
          });
        });
        
        console.log(`✅ Showing custom dropdown with ${predictions.length} items`);
        
        // Debug: Check if dropdown actually exists and is visible
        setTimeout(() => {
          const debugDropdown = document.getElementById(`custom-dropdown-${inputType}`);
          if (debugDropdown) {
            const computedStyle = window.getComputedStyle(debugDropdown);
            console.log('🔍 Dropdown debug info:', {
              id: debugDropdown.id,
              className: debugDropdown.className,
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity,
              zIndex: computedStyle.zIndex,
              position: computedStyle.position,
              top: computedStyle.top,
              left: computedStyle.left,
              width: computedStyle.width,
              height: computedStyle.height,
              backgroundColor: computedStyle.backgroundColor,
              border: computedStyle.border,
              boxShadow: computedStyle.boxShadow,
              childElementCount: debugDropdown.children.length,
              innerHTML: debugDropdown.innerHTML.substring(0, 200) + '...'
            });
          } else {
            console.error('❌ Dropdown element not found in DOM!');
          }
        }, 100);
      };
      
      // Hide custom dropdown
      const hideCustomDropdown = (inputType: 'start' | 'end') => {
        const dropdown = document.getElementById(`custom-dropdown-${inputType}`);
        if (dropdown) {
          dropdown.style.display = 'none';
        }
        setShowSuggestions(false); // Uppdatera state
        setActiveSuggestionIndex(-1); // Reset selection
      };
      
      // Setup custom autocomplete for both inputs
      const setupCustomAutocomplete = () => {
        console.log('🔧 Setting up custom autocomplete...');
        
        // Create dropdowns
        createCustomDropdown(startAddressInputRef, 'start');
        createCustomDropdown(endAddressInputRef, 'end');
        
        // Setup start address input
        if (startAddressInputRef.current) {
          console.log('🔧 Setting up start address input...');
          
          startAddressInputRef.current.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            console.log('📝 Start input:', value);
            
            if (value.length >= 2) {
              getSuggestions(value, 'start');
            } else {
              hideCustomDropdown('start');
            }
          });
          
          startAddressInputRef.current.addEventListener('blur', () => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => hideCustomDropdown('start'), 150);
          });
          
          startAddressInputRef.current.addEventListener('focus', () => {
            const value = startAddressInputRef.current?.value;
            if (value && value.length >= 2) {
              getSuggestions(value, 'start');
            }
          });
        }
        
        // Setup end address input
        if (endAddressInputRef.current) {
          console.log('🔧 Setting up end address input...');
          
          endAddressInputRef.current.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            console.log('📝 End input:', value);
            
            if (value.length >= 2) {
              getSuggestions(value, 'end');
            } else {
              hideCustomDropdown('end');
            }
          });
          
          endAddressInputRef.current.addEventListener('blur', () => {
            setTimeout(() => hideCustomDropdown('end'), 150);
          });
          
          endAddressInputRef.current.addEventListener('focus', () => {
            const value = endAddressInputRef.current?.value;
            if (value && value.length >= 2) {
              getSuggestions(value, 'end');
            }
          });
        }
        
        console.log('✅ Custom autocomplete setup complete!');
        return true;
      };
      
      // Initialize custom autocomplete with retry
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryInit = () => {
        attempts++;
        console.log(`🔍 Custom autocomplete init attempt ${attempts}/${maxAttempts}`);
        
        if (setupCustomAutocomplete()) {
          console.log('✅ Custom autocomplete initialized successfully!');
          return;
        }
        
        if (attempts < maxAttempts) {
          setTimeout(tryInit, 200);
        } else {
          console.error('❌ Failed to initialize custom autocomplete after', maxAttempts, 'attempts');
        }
      };
      
      // Start initialization
      setTimeout(tryInit, 100);
      
      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up custom autocomplete...');
        ['start', 'end'].forEach(type => {
          const dropdown = document.getElementById(`custom-dropdown-${type}`);
          if (dropdown) {
            dropdown.remove();
          }
        });
      };
    }, [showAddressModal])

    // Check Google Maps API status on page load
    useEffect(() => {
      console.log('🗺️ PAGE LOAD - Google Maps API Status:');
      console.log('  - window.google:', !!window.google);
      console.log('  - google.maps:', !!window.google?.maps);
      console.log('  - google.maps.places:', !!window.google?.maps?.places);
      
      // Kontrollera om det finns Google Maps script i head
      const scripts = document.querySelectorAll('script');
      const googleMapsScript = Array.from(scripts).find(s => s.src?.includes('maps.googleapis.com'));
      console.log('📜 Google Maps script tag found:', !!googleMapsScript);
      if (googleMapsScript) {
        console.log('📜 Script src:', googleMapsScript.src);
        console.log('📜 Script async:', googleMapsScript.async);
        console.log('📜 Script defer:', googleMapsScript.defer);
      }
      
      // Kontrollera om Google Maps är laddat, annars vänta
      const checkGoogleMapsLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('✅ Google Maps API is fully loaded!');
          console.log('✅ Available libraries:', Object.keys(window.google.maps));
          return true;
        }
        return false;
      };
      
      if (!checkGoogleMapsLoaded()) {
        console.log('⏳ Google Maps not loaded yet, setting up listener...');
        
        let checkCount = 0;
        // Kolla var 100ms tills Google Maps är laddat
        const checkInterval = setInterval(() => {
          checkCount++;
          if (checkCount % 10 === 0) { // Logga var sekund
            console.log(`⏳ Still waiting for Google Maps... (${checkCount * 100}ms)`);
            console.log('  - window.google:', !!window.google);
            console.log('  - google.maps:', !!window.google?.maps);
            console.log('  - google.maps.places:', !!window.google?.maps?.places);
          }
          
          if (checkGoogleMapsLoaded()) {
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Timeout efter 10 sekunder (ökat från 5)
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!checkGoogleMapsLoaded()) {
            console.error('❌ Google Maps failed to load after 10 seconds');
            console.error('❌ This might be due to:');
            console.error('  - Network issues');
            console.error('  - Invalid API key');
            console.error('  - API key restrictions');
            console.error('  - Ad blockers or privacy extensions');
          }
        }, 10000);
      }
    }, []);

    // Hämta orderdata från Supabase
    useEffect(() => {
      // Prevent multiple fetches
      if (!orderId || hasFetchedOrder.current) return;
      
      const fetchOrder = async () => {
        // Mark that we've started fetching
        hasFetchedOrder.current = true;
        
        try {
          // Använd quoteService för att hämta orderdata
          const orderData = await quoteService.getQuote(orderId)
          
          if (!orderData) {
            throw new Error('Order not found')
          }
          
          // Om detta är en fallback-offert, visa ett meddelande till användaren
          if (orderData.isFallback) {
            console.warn(`Visar fallback-order istället för efterfrågat ID: ${orderId}`)
            setError(`Vi kunde inte hitta den exakta ordern du sökte. Vi visar vår senaste order istället.`)
          }
          
          // Kontrollera att offerten är accepterad
          const offerStatus = orderData.status?.toLowerCase() || "";
          const acceptedStatuses = ["accepted", "accepterad", "acceptera", "accept"];
          const isAccepted = acceptedStatuses.some(status => offerStatus.includes(status));
          
          if (!isAccepted) {
            console.warn("Offerten är inte accepterad. Status:", orderData.status)
            setError(`Denna offert måste accepteras innan du kan se orderbekräftelsen. 
              Vänligen gå tillbaka och klicka på "Acceptera offert" först.
              
              Nuvarande status: ${orderData.status || 'okänd'}`)
            return
          }
          
          // 🔧 NYTT: Funktion för att kapitalisera namn
  const capitalizeFullName = (name: string): string => {
    if (!name || typeof name !== 'string') return 'Ej angivet';
    
    return name
      .trim()
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  // Uppdatera hur vi hämtar kundnamn med kapitalisering
  const rawCustomerName = orderData.name || 
                        orderData.details?.name || 
                        orderData.customers?.name || 
                        orderData.customer_name || 
                        'Ej angivet';
  const customerName = capitalizeFullName(rawCustomerName);
                              
          // Lägg till debug-loggning för att se vad vi får för data
          console.log('🔍 DEBUG: Full orderData structure:', orderData);
          console.log('🔍 DEBUG: Services in orderData:', orderData.services);
          console.log('🔍 DEBUG: ServiceTypes in orderData:', orderData.serviceTypes || orderData.service_types);
          console.log('🔍 DEBUG: Details in orderData:', orderData.details);
          
          console.log('Debug customer data:', {
            directName: orderData.name,
            detailsName: orderData.details?.name,
            customersName: orderData.customers?.name,
            customerName: orderData.customer_name,
            finalName: customerName,
            fullOrderData: orderData
          });

          // 🔧 FIXAT: Konsistent ordernummer-generering från booking UUID
          const generateConsistentOrderNumber = (orderData: any, bookingId: string) => {
            // PRIORITET 1: Använd befintligt booking_reference om det finns
            if (orderData.booking_reference) {
              console.log('📋 Använder befintligt booking_reference:', orderData.booking_reference);
              return orderData.booking_reference;
            }
            
            // PRIORITET 2: Använd befintligt orderNumber om det finns  
            if (orderData.orderNumber || orderData.order_number) {
              console.log('📋 Använder befintligt orderNumber:', orderData.orderNumber || orderData.order_number);
              return orderData.orderNumber || orderData.order_number;
            }
            
            // PRIORITET 3: Skapa från booking UUID (samma som offerten använder)
            const cleanBookingId = bookingId.replace(/-/g, ''); // Ta bort bindestreck
            const orderNumber = `NF-${cleanBookingId.slice(0, 8).toUpperCase()}`;
            
            console.log('📋 Skapar ordernummer från booking UUID:', {
              bookingId: bookingId,
              cleanBookingId: cleanBookingId,
              orderNumber: orderNumber
            });
            
            return orderNumber;
          };

          // Generera konsistent ordernummer
          const orderNumber = generateConsistentOrderNumber(orderData, orderId);
          console.log('🔍 FINAL ORDERNUMMER:', orderNumber);
          
          // Strukturera om data för att passa din komponent
          let fromBookingsTable = false;
          
          // Kontrollera om det finns customers eller om det är en direkt kund-objekt
          if (orderData.customers && typeof orderData.customers === 'object') {
            fromBookingsTable = false;
          } else if (orderData.customer_id && orderData.start_address) {
            fromBookingsTable = true;
          }
          
          console.log("Datakälla:", fromBookingsTable ? "bookings" : "quotes", orderData);
          
          let transformedOrderData = {};
          
          if (fromBookingsTable) {
      // 🔧 FIXAT: Korrekt prismappning (samma som SMS/Email använder)
  const totalPrice = orderData.totalPrice ||  // ← Detta ger 3630 kr (samma som SMS/Email)
  orderData.value ||
  orderData.pricing?.total_after_rut || 
  orderData.pricing?.slutgiltig_kostnad || 
  orderData.pricing?.slutpris ||
  null; // ← Ingen fallback-värde

  // 🚨 Om inget pris hittas - visa fel istället för att gissa
  if (!totalPrice || totalPrice <= 0) {
  setError("Ett tekniskt fel uppstod vid beräkning av priset. Vänligen kontakta vår kundtjänst på 010-555 12 89 så löser vi detta omgående.");
  return;
  }

            console.log('💰 PRISMAPPNING (bookings):', {
              pricing_total_after_rut: orderData.pricing?.total_after_rut,
              pricing_slutgiltig_kostnad: orderData.pricing?.slutgiltig_kostnad,
              pricing_slutpris: orderData.pricing?.slutpris,
              total_price: orderData.total_price,
              value: orderData.value,
              finalPrice: totalPrice
            });
                              
            // 🔧 FIXAT: Läs services från details.services istället för egen kolumn
            let services = [];
            
            if (orderData.details?.full_services_json) {
              // Försök läsa från sparad JSON
              try {
                services = JSON.parse(orderData.details.full_services_json);
                console.log('📋 Använder sparade services från details.full_services_json:', services);
              } catch (e) {
                console.warn('📋 Kunde inte parsa full_services_json, använder fallback');
                services = null;
              }
            }
            
            if (!services || services.length === 0) {
              // Fallback: Skapa services från service_types
              services = (orderData.service_types || []).map((serviceType: string, index: number) => ({
                id: `service-${index}`,
                name: serviceType === 'moving' ? 'Flytthjälp' : 
                    serviceType === 'packing' ? 'Packning' : 
                    serviceType === 'cleaning' ? 'Flyttstädning' : serviceType,
                price: serviceType === 'moving' ? totalPrice : 
                      serviceType === 'packing' ? Math.max(PRICING_CONFIG.packingMinPrice, Number(orderData.details?.startLivingArea || 70) * PRICING_CONFIG.packingPerSqm) :
                      serviceType === 'cleaning' ? Math.max(PRICING_CONFIG.cleaningMinPrice, Number(orderData.details?.startLivingArea || 70) * PRICING_CONFIG.cleaningPerSqm) : 0
              }));
              console.log('📋 Skapade services från service_types:', services);
            }
            
            // 🔧 NYTT: Lägg till additional_services från bookings-tabellen
            if (orderData.additional_services && Array.isArray(orderData.additional_services)) {
              console.log('📋 Hittade additional_services:', orderData.additional_services);
              
              // Service name mapping för additional services
              const additionalServiceMapping: Record<string, string> = {
                'assembly': 'Upphängning & installation',
                'furniture-assembly': 'Möbelmontering',
                'disposal': 'Bortforsling & återvinning',
                'kartonger': 'Flyttkartonger',
                'emballering': 'Emballering'
              };
              
              // Lägg till additional services till services array
              orderData.additional_services.forEach((serviceId: string, index: number) => {
                const serviceName = additionalServiceMapping[serviceId] || serviceId;
                
                // Kolla om tjänsten redan finns
                const existingService = services.find((s: any) => s.name === serviceName);
                if (!existingService) {
                  services.push({
                    id: `additional-${index}`,
                    name: serviceName,
                    price: 0 // Priset är redan inkluderat i totalPrice
                  });
                }
              });
              
              console.log('📋 Services efter additional_services:', services);
            }
            
            // 🔧 NYTT: Lägg till flyttkartonger om de finns
            const movingBoxes = orderData.details?.movingBoxes || orderData.moving_boxes || 0;
            if (movingBoxes > 0) {
              services.push({
                id: 'moving-boxes',
                name: `Flyttkartonger (${movingBoxes} st)`,
                price: 0 // Priset är redan inkluderat i totalPrice
              });
              console.log('📋 La till flyttkartonger:', movingBoxes);
            }
            
            // 🔧 NYTT: Lägg till specialkartonger om de finns
            const rentalBoxes = orderData.details?.rentalBoxes || {};
            if (rentalBoxes && typeof rentalBoxes === 'object') {
              const rentalBoxNames: Record<string, string> = {
                'wardrobe': 'Garderobskartonger',
                'painting': 'Tavelkartonger',
                'mirror': 'Spegelkartonger'
              };
              
              Object.entries(rentalBoxes).forEach(([boxType, count]) => {
                if (count && Number(count) > 0) {
                  services.push({
                    id: `rental-${boxType}`,
                    name: `${rentalBoxNames[boxType] || boxType} (${count} st)`,
                    price: 0 // Priset är redan inkluderat i totalPrice
                  });
                }
              });
              console.log('📋 La till specialkartonger:', rentalBoxes);
            }
            
            // 🔧 SÄKERSTÄLL ATT SERVICES ALDRIG ÄR TOM
            if (!services || services.length === 0) {
              // Skapa åtminstone grundtjänsten 
              services = [{
                id: 'service-0',
                name: 'Flytthjälp',
                price: totalPrice || 3630
              }];
              console.log('⚠️ EMERGENCY: Skapade emergency services array:', services);
            }
            
            transformedOrderData = {
              id: orderData.id,
              customerName,
              email: orderData.customers?.email || orderData.details?.email || orderData.email || '',
              phone: orderData.customers?.phone || orderData.details?.phone || orderData.phone || '',
              totalPrice: totalPrice, // ← FIXAT: Använd korrekt totalpris
              orderNumber: orderNumber, // ← FIXAT: Använd konsistent ordernummer
              status: orderData.status || 'pending',
              services: services,
              serviceTypes: orderData.service_types || ['moving'],
              address: orderData.start_address || orderData.details?.startAddress || 'Startadress saknas',
              address_to: orderData.end_address || orderData.details?.endAddress || 'Slutadress saknas',
              moveDate: orderData.move_date || orderData.details?.moveDate || 'Datum saknas',
              moveTime: orderData.move_time || orderData.details?.moveTime || orderData.details?.time || '08:00',
              moveSize: orderData.details?.estimatedVolume || orderData.moveDetails?.volym_m3 || '19',
              details: orderData.details || {},
              additional_services: orderData.additional_services || orderData.details?.additional_services || [],
              isFallback: orderData.isFallback || false
            };
          } else {
            // 🔧 FIXAT: Samma prismappning för quotes-tabellen
            const totalPrice = orderData.totalPrice ||  // ← Samma som SMS/Email använder  
            orderData.value ||
            orderData.pricing?.total_after_rut || 
            orderData.pricing?.slutgiltig_kostnad || 
            orderData.pricing?.slutpris ||
            null; // ← Ingen fallback-värde

            console.log('💰 PRISMAPPNING (quotes):', {
              pricing_total_after_rut: orderData.pricing?.total_after_rut,
              pricing_slutgiltig_kostnad: orderData.pricing?.slutgiltig_kostnad,
              pricing_slutpris: orderData.pricing?.slutpris,
              total_price: orderData.total_price,
              value: orderData.value,
              finalPrice: totalPrice
            });
            
            // 🔧 FIXAT: Läs services direkt från databasen om de finns
            let services = [];
            
            if (orderData.details?.full_services_json) {
              // Försök läsa från sparad JSON (quotes)
              try {
                services = JSON.parse(orderData.details.full_services_json);
                console.log('📋 Använder sparade services från details.full_services_json (quotes):', services);
              } catch (e) {
                console.warn('📋 Kunde inte parsa full_services_json (quotes), använder fallback');
                services = null;
              }
            }
            
            if (!services || services.length === 0) {
              if (orderData.services && Array.isArray(orderData.services) && orderData.services.length > 0) {
                // Fallback till gamla services kolumn för quotes
                services = orderData.services;
                console.log('📋 Använder gamla services kolumn från quotes:', services);
              }
            }
            
            if (!services || services.length === 0) {
              // Fallback: Skapa services från serviceTypes
              services = (orderData.serviceTypes || ['moving']).map((serviceType: string, index: number) => ({
                id: `service-${index}`,
                name: serviceType === 'moving' ? 'Flytthjälp' : 
                    serviceType === 'packing' ? 'Packning' : 
                    serviceType === 'cleaning' ? 'Flyttstädning' : serviceType,
                price: serviceType === 'moving' ? totalPrice : 
                      serviceType === 'packing' ? Math.max(PRICING_CONFIG.packingMinPrice, Number(orderData.details?.startLivingArea || 70) * PRICING_CONFIG.packingPerSqm) :
                      serviceType === 'cleaning' ? Math.max(PRICING_CONFIG.cleaningMinPrice, Number(orderData.details?.startLivingArea || 70) * PRICING_CONFIG.cleaningPerSqm) : 0
              }));
              console.log('📋 Skapade services från serviceTypes (quotes):', services);
            }
            
            // 🔧 NYTT: Lägg till additional services från details objektet (quotes)
            if (orderData.details?.additionalBusinessServices && Array.isArray(orderData.details.additionalBusinessServices)) {
              console.log('📋 Hittade additionalBusinessServices i details (quotes):', orderData.details.additionalBusinessServices);
              
              // Service name mapping för additional services
              const additionalServiceMapping: Record<string, string> = {
                'assembly': 'Upphängning & installation',
                'furniture-assembly': 'Möbelmontering',
                'disposal': 'Bortforsling & återvinning',
                'kartonger': 'Flyttkartonger',
                'emballering': 'Emballering'
              };
              
              // Lägg till additional services till services array
              orderData.details.additionalBusinessServices.forEach((serviceId: string, index: number) => {
                const serviceName = additionalServiceMapping[serviceId] || serviceId;
                
                // Kolla om tjänsten redan finns
                const existingService = services.find((s: any) => s.name === serviceName);
                if (!existingService) {
                  services.push({
                    id: `additional-${index}`,
                    name: serviceName,
                    price: 0 // Priset är redan inkluderat i totalPrice
                  });
                }
              });
              
              console.log('📋 Services efter additionalBusinessServices (quotes):', services);
            }
            
            // 🔧 NYTT: Lägg till flyttkartonger om de finns (quotes)
            const movingBoxes = orderData.details?.movingBoxes || orderData.moving_boxes || 0;
            if (movingBoxes > 0) {
              services.push({
                id: 'moving-boxes',
                name: `Flyttkartonger (${movingBoxes} st)`,
                price: 0 // Priset är redan inkluderat i totalPrice
              });
              console.log('📋 La till flyttkartonger (quotes):', movingBoxes);
            }
            
            // 🔧 NYTT: Lägg till specialkartonger om de finns (quotes)
            const rentalBoxes = orderData.details?.rentalBoxes || {};
            if (rentalBoxes && typeof rentalBoxes === 'object') {
              const rentalBoxNames: Record<string, string> = {
                'wardrobe': 'Garderobskartonger',
                'painting': 'Tavelkartonger',
                'mirror': 'Spegelkartonger'
              };
              
              Object.entries(rentalBoxes).forEach(([boxType, count]) => {
                if (count && Number(count) > 0) {
                  services.push({
                    id: `rental-${boxType}`,
                    name: `${rentalBoxNames[boxType] || boxType} (${count} st)`,
                    price: 0 // Priset är redan inkluderat i totalPrice
                  });
                }
              });
              console.log('📋 La till specialkartonger (quotes):', rentalBoxes);
            }
            
            // 🔧 SÄKERSTÄLL ATT SERVICES ALDRIG ÄR TOM
            if (!services || services.length === 0) {
              // Skapa åtminstone grundtjänsten 
              services = [{
                id: 'service-0',
                name: 'Flytthjälp',
                price: totalPrice || 3630
              }];
              console.log('⚠️ EMERGENCY: Skapade emergency services array (quotes):', services);
            }
            
            transformedOrderData = {
              id: orderData.id,
              customerName,
              email: orderData.customers?.email || orderData.details?.email || orderData.email || '',
              phone: orderData.customers?.phone || orderData.details?.phone || orderData.phone || '',
              totalPrice: totalPrice, // ← FIXAT: Använd korrekt totalpris
              orderNumber: orderNumber, // ← FIXAT: Använd konsistent ordernummer
              status: orderData.status || 'pending',
              services: services,
              serviceTypes: orderData.serviceTypes || ['moving'],
              address: orderData.start_address || orderData.details?.startAddress || 'Startadress saknas',
              address_to: orderData.end_address || orderData.details?.endAddress || 'Slutadress saknas',
              moveDate: orderData.move_date || orderData.details?.moveDate || 'Datum saknas',
              moveTime: orderData.move_time || orderData.details?.moveTime || orderData.details?.time || '08:00',
              moveSize: orderData.details?.estimatedVolume || orderData.moveDetails?.volym_m3 || '19',
              details: orderData.details || {},
              additional_services: orderData.details?.additionalBusinessServices || [],
              isFallback: orderData.isFallback || false
            };
          }
          
          // 🔧 UPPDATERA TOTALPRIS BASERAT PÅ SERVICES
          const servicesTotal = (transformedOrderData as Order).services.reduce((sum, service) => sum + service.price, 0);
          if (servicesTotal > 0 && servicesTotal !== (transformedOrderData as Order).totalPrice) {
            console.log('💰 Uppdaterar totalpris baserat på services:', {
              originalTotal: (transformedOrderData as Order).totalPrice,
              servicesTotal: servicesTotal,
              services: (transformedOrderData as Order).services
            });
            (transformedOrderData as Order).totalPrice = servicesTotal;
          }
          
          // Lägg till felsökning för att se kunddata
          console.log('Customer data:', {
            name: customerName,
            orderNumber,
            totalPrice: (transformedOrderData as Order).totalPrice,
            services: (transformedOrderData as Order).services
          });
          
          setOrder(transformedOrderData as Order)
        } catch (error) {
          console.error('Error fetching order:', error)
          setError(`Kunde inte hämta orderinformationen (ID: ${orderId}). Vänligen kontrollera att ID är korrekt.`)
        } finally {
          setLoading(false)
        }
      }
      
      // Hjälpfunktion för att beräkna pris baserat på tjänstens namn
      function calculatePriceBasedOnService(service: string): number {
        const serviceName = service.toLowerCase();
        if (serviceName.includes('flytt')) {
          return 2700;
        } else if (serviceName.includes('pack')) {
          return 700;
        } else if (serviceName.includes('städ')) {
          return 2500;
        }
        // Standardpris för okända tjänster
        return 0;
      }
      
      if (orderId) {
        fetchOrder()
      }
    }, [orderId]) // Only depend on orderId since fetchOrder is defined inside

    // Lägg till felsökning för att se tillgänglig data
    useEffect(() => {
      console.log('Booking data in confirmation:', order);
    }, [order]);
    
    // Hämta tilläggstjänster från databasen
    useEffect(() => {
      async function fetchAdditionalServices() {
        if (!orderId) return;
        
        try {
          console.log('🔄 Hämtar tilläggstjänster för bokning:', orderId)
          const response = await fetch(`/api/bookings/${orderId}/additional-services`)
          
          console.log('📡 API Response status:', response.status)
          if (response.ok) {
            const data = await response.json()
            console.log('✅ Tilläggstjänster från databas:', data)
            
            if (data.additionalServices && data.additionalServices.length > 0) {
              console.log('📊 Setting dbAdditionalServices with:', data.additionalServices)
              setDbAdditionalServices(data.additionalServices)
              setAdditionalServicesTotal(data.totalAdditionalCost)
              console.log('✅ State updated - services should now display')
              
              // Uppdatera totalpriset om vi har tilläggstjänster
              if (data.totalAdditionalCost > 0 && order) {
                const newTotal = (order.totalPrice || 0) + data.totalAdditionalCost
                console.log('💰 Uppdaterar totalpris med tilläggstjänster:', {
                  original: order.totalPrice,
                  additional: data.totalAdditionalCost,
                  newTotal
                })
              }
            } else {
              console.log('❓ No additional services found in response')
            }
          } else {
            console.error('❌ API response not ok:', response.status, response.statusText)
            const errorText = await response.text()
            console.error('❌ Error details:', errorText)
          }
        } catch (error) {
          console.error('Fel vid hämtning av tilläggstjänster:', error)
        }
      }
      
      if (order) {
        fetchAdditionalServices()
      }
    }, [orderId, order])
    
    // Debug effect för att spåra dbAdditionalServices
    useEffect(() => {
      console.log('🔍 Debug dbAdditionalServices state:', {
        services: dbAdditionalServices,
        length: dbAdditionalServices.length,
        total: additionalServicesTotal
      })
    }, [dbAdditionalServices, additionalServicesTotal])
    
    // Funktion för att hämta foton från jobb
    const fetchJobPhotos = async (jobId: string) => {
      setIsLoadingPhotos(true)
      try {
        const response = await fetch(`/api/jobs/${jobId}/photos`)
        if (!response.ok) {
          throw new Error('Failed to fetch photos')
        }
        
        const data = await response.json()
        if (data.success && data.photos) {
          // Separera foton för flyttpersonal och städpersonal
          const movingPhotos = [
            ...(data.photos.before || []),
            ...(data.photos.during || []),
            ...(data.photos.after || [])
          ]
          const cleaningPhotos = [
            ...(data.photos.cleaning_before || []),
            ...(data.photos.cleaning_after || [])
          ]
          
          setJobPhotos({
            moving: movingPhotos,
            cleaning: cleaningPhotos
          })
        }
      } catch (error) {
        console.error('Error fetching job photos:', error)
      } finally {
        setIsLoadingPhotos(false)
      }
    }
    
    // Hämta foton när dokumentation-modal öppnas
    useEffect(() => {
      if (showPhotosModal && order?.details?.jobId) {
        fetchJobPhotos(order.details.jobId)
      }
    }, [showPhotosModal, order?.details?.jobId])
    
    // Ladda tilläggstjänster från order när komponenten laddas
    useEffect(() => {
      // 🔧 FIXAT: Kolla alla möjliga platser för additional services
      let additionalServicesData = null;
      
      // Kolla först order.additional_services (från bookings-tabellen)
      if (order?.additional_services && Array.isArray(order.additional_services)) {
        additionalServicesData = order.additional_services;
        console.log('📋 Hittade additional_services från bookings:', additionalServicesData);
      }
      // Kolla sedan order.details.additional_services
      else if (order?.details?.additional_services) {
        additionalServicesData = order.details.additional_services;
        console.log('📋 Hittade additional_services från details:', additionalServicesData);
      }
      // Kolla även order.details.additionalBusinessServices (från quotes)
      else if (order?.details?.additionalBusinessServices) {
        additionalServicesData = order.details.additionalBusinessServices;
        console.log('📋 Hittade additionalBusinessServices från details:', additionalServicesData);
      }
      
      // Om vi hittade additional services data, uppdatera state
      if (additionalServicesData && Array.isArray(additionalServicesData)) {
        const newState: any = {};
        additionalServicesData.forEach((serviceId: string) => {
          switch(serviceId) {
            case 'assembly':
              newState.mobelmontering = true;
              break;
            case 'furniture-assembly':
              newState.mobelmontering = true;
              break;
            case 'disposal':
              newState.vaggfixning = true; // Mappas till väggfixning för nu
              break;
            case 'kartonger':
              newState.packning = true;
              break;
            case 'emballering':
              newState.packning = true;
              break;
          }
        });
        setAdditionalServices(prev => ({ ...prev, ...newState }));
      }
      
      // Kolla också om tjänster redan finns i services array
      if (order?.services) {
        const hasExtraPackning = order.services.some(s => s.name === 'Packning (tillägg)')
        const hasFlyttstadning = order.services.some(s => s.name === 'Flyttstädning')
        const hasMobelmontering = order.services.some(s => s.name === 'Möbelmontering' || s.name === 'Upphängning & installation')
        const hasVaggfixning = order.services.some(s => s.name === 'Väggfixning & Målning' || s.name === 'Bortforsling & återvinning')
        const hasAbonnemangsflytt = order.services.some(s => s.name === 'Abonnemangsflytt')
        
        setAdditionalServices(prev => ({
          ...prev,
          packning: hasExtraPackning || prev.packning,
          flyttstadning: hasFlyttstadning || prev.flyttstadning,
          mobelmontering: hasMobelmontering || prev.mobelmontering,
          vaggfixning: hasVaggfixning || prev.vaggfixning,
          abonnemangsflytt: hasAbonnemangsflytt || prev.abonnemangsflytt
        }))
      }
      
      // Ladda checklista progress
      if (order?.details?.checklist_progress) {
        setChecklistProgress(order.details.checklist_progress)
      }
    }, [order]);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false)
    const [showChecklistModal, setShowChecklistModal] = useState(false)
    
    // 📋 PDF BEKRÄFTELSE STATE
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [pdfGenerationSuccess, setPdfGenerationSuccess] = useState(false)
    const [pdfGenerationError, setPdfGenerationError] = useState<string | null>(null)

    // 📋 PROFESSIONAL PDF GENERATION FUNCTION - HTML/CSS baserad
    const generatePDFConfirmation = async () => {
      if (!order) {
        setPdfGenerationError('Ingen orderdata tillgänglig')
        return
      }

      setIsGeneratingPDF(true)
      setPdfGenerationError(null)
      setPdfGenerationSuccess(false)

      try {
        console.log('🔥 Generating PROFESSIONAL PDF confirmation for order:', order.orderNumber)
        console.log('🔍 Order services:', order.services)
        console.log('🔍 Order total price:', order.totalPrice)
        
        // Skapa HTML element för PDF
        const pdfContent = document.createElement('div')
        pdfContent.style.cssText = `
          width: 794px;
          min-height: 1123px; 
          background: white;
          font-family: 'Arial', sans-serif;
          color: #333;
          padding: 40px;
          box-sizing: border-box;
          position: absolute;
          left: -9999px;
          top: 0;
        `
        
        // Beräkna korrekt totalpris från alla tjänster
        const calculatedTotalPrice = order.services.reduce((sum, service) => sum + (service.price || 0), 0)
        console.log('💰 Calculated total price:', calculatedTotalPrice)
        
        pdfContent.innerHTML = `
          <!-- HEADER -->
          <div style="border-bottom: 3px solid #002A5C; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center;">
                <img src="/nordflytt-logo.svg" alt="Nordflytt" style="height: 60px;" />
              </div>
              <div style="text-align: right; color: #666; font-size: 12px;">
                <p style="margin: 0;">Tel: 010-555 12 89</p>
                <p style="margin: 0;">hej@nordflytt.se</p>
                <p style="margin: 0;">www.nordflytt.se</p>
              </div>
            </div>
          </div>
          
          <!-- TITEL -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 28px; color: #002A5C; margin: 0; font-weight: bold;">FLYTTBEKRÄFTELSE</h2>
            <div style="background: #F0F8FF; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #002A5C;">
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #002A5C;">
                Bokningsnummer: ${order.orderNumber}
              </p>
            </div>
          </div>
          
          <!-- BOKNINGSDETALJER -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #002A5C; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #E5E5E5; padding-bottom: 5px;">
              📅 Bokningsdetaljer
            </h3>
            <div style="background: #F9F9F9; padding: 20px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>📅 Flyttdatum:</strong> ${order.moveDate}</p>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>🕐 Tid:</strong> ${order.moveTime}</p>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>📦 Volym:</strong> ${order.moveSize} kubikmeter</p>
                </div>
                <div>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>📍 Från:</strong><br>${order.address}</p>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>📍 Till:</strong><br>${order.address_to}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- KUNDUPPGIFTER -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #002A5C; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #E5E5E5; padding-bottom: 5px;">
              👤 Kunduppgifter
            </h3>
            <div style="background: #F9F9F9; padding: 20px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <p style="margin: 0; font-size: 14px;"><strong>Namn:</strong><br>${order.customerName}</p>
                <p style="margin: 0; font-size: 14px;"><strong>Telefon:</strong><br>${order.phone}</p>
                <p style="margin: 0; font-size: 14px;"><strong>E-post:</strong><br>${order.email}</p>
              </div>
            </div>
          </div>
          
          <!-- BOKADE TJÄNSTER -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #002A5C; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #E5E5E5; padding-bottom: 5px;">
              🛠️ Bokade tjänster
            </h3>
            <div style="border: 1px solid #E5E5E5; border-radius: 8px; overflow: hidden;">
              ${order.services.map((service, index) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; ${index % 2 === 0 ? 'background: #F9F9F9;' : 'background: white;'} border-bottom: 1px solid #E5E5E5;">
                  <div style="display: flex; align-items: center;">
                    <span style="color: #22C55E; font-size: 16px; margin-right: 10px;">✓</span>
                    <span style="font-size: 15px; font-weight: 500;">${service.name}</span>
                  </div>
                  <span style="font-size: 15px; font-weight: bold; color: #002A5C;">
                    ${(service.price || 0).toLocaleString('sv-SE')} kr
                  </span>
                </div>
              `).join('')}
              
              <!-- TOTALPRIS -->
              <div style="background: #002A5C; color: white; padding: 20px; text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 20px; font-weight: bold;">TOTALPRIS:</span>
                  <span style="font-size: 24px; font-weight: bold;">
                    ${calculatedTotalPrice.toLocaleString('sv-SE')} kr
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- NÄSTA STEG -->
          <div style="background: #F0F8FF; padding: 25px; border-radius: 8px; border-left: 4px solid #002A5C; margin-bottom: 30px;">
            <h3 style="color: #002A5C; font-size: 18px; margin: 0 0 15px 0;">🔄 Vad händer nu?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              <li style="margin-bottom: 8px;">Vi kontaktar dig 24 timmar före flyttdagen för bekräftelse</li>
              <li style="margin-bottom: 8px;">Håll denna bekräftelse tillgänglig på flyttdagen</li>
              <li style="margin-bottom: 8px;">Vid frågor eller ändringar, kontakta oss direkt</li>
              <li style="margin-bottom: 8px;">Spara detta dokument för dina arkiv</li>
            </ul>
          </div>
          
          <!-- KONTAKT -->
          <div style="border-top: 2px solid #E5E5E5; padding-top: 20px; text-align: center;">
            <h3 style="color: #002A5C; font-size: 18px; margin-bottom: 15px;">📞 Kontakt & Support</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center;">
              <div>
                <p style="margin: 0; font-weight: bold; color: #002A5C;">Telefon</p>
                <p style="margin: 5px 0 0 0;">010-555 12 89</p>
              </div>
              <div>
                <p style="margin: 0; font-weight: bold; color: #002A5C;">E-post</p>
                <p style="margin: 5px 0 0 0;">hej@nordflytt.se</p>
              </div>
              <div>
                <p style="margin: 0; font-weight: bold; color: #002A5C;">Webb</p>
                <p style="margin: 5px 0 0 0;">www.nordflytt.se</p>
              </div>
            </div>
          </div>
          
          <!-- FOOTER -->
          <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #E5E5E5; padding-top: 20px;">
            <p style="margin: 0;">Denna bekräftelse genererades automatiskt</p>
            <p style="margin: 5px 0 0 0;">Skapad: ${new Date().toLocaleDateString('sv-SE')} ${new Date().toLocaleTimeString('sv-SE')}</p>
          </div>
        `
        
        // Lägg till i DOM för rendering
        document.body.appendChild(pdfContent)
        
        // Vänta lite för rendering
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Skapa canvas från HTML
        const canvas = await html2canvas(pdfContent, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
        
        // Ta bort från DOM
        document.body.removeChild(pdfContent)
        
        // Skapa PDF från canvas
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        
        const imgWidth = 210 // A4 width in mm
        const pageHeight = 295 // A4 height in mm  
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        
        let position = 0
        
        // Lägg till första sidan
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        
        // Lägg till extra sidor om innehållet är för långt
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        
        // Ladda ner PDF
        const fileName = `Nordflytt_Bekraftelse_${order.orderNumber}.pdf`
        pdf.save(fileName)
        
        console.log('✅ PROFESSIONAL PDF generated and downloaded:', fileName)
        console.log('✅ Services included:', order.services.length)
        console.log('✅ Total price displayed:', calculatedTotalPrice.toLocaleString('sv-SE'), 'kr')
        
        // Visa framgång
        setPdfGenerationSuccess(true)
        
        // Reset success state efter 3 sekunder
        setTimeout(() => {
          setPdfGenerationSuccess(false)
        }, 3000)
        
      } catch (error) {
        console.error('❌ PROFESSIONAL PDF generation failed:', error)
        setPdfGenerationError('Kunde inte skapa PDF. Försök igen.')
      } finally {
        setIsGeneratingPDF(false)
      }
    }
    
    // 📋 INTERAKTIV CHECKLISTA STATE
    const [checklistProgress, setChecklistProgress] = useState({
      // 4-6 veckor före flytt
      hyreskontrakt: false,
      folkbokning: false,
      hemforsakring: false,
      barn_skola: false,
      
      // 3-4 veckor före flytt
      el: false,
      internet: false,
      tv_bredband: false,
      prenumerationer: false,
      
      // 2-3 veckor före flytt
      post: false,
      bank: false,
      borja_packa: false,
      parkeringstillstand: false,
      nathandel: false,
      
      // 1 vecka före flytt
      bekrafta_nordflytt: false,
      packa_klart: false,
      tomma_frysen: false,
      boka_hiss: false,
      betalning: false,
      
      // Flyttdagen
      vara_forberedd: false,
      kontaktinfo: false,
      stora_mobler: false,
      nycklar_koder: false,
      husdjur: false,
      
      // Första veckan efter flytt
      inflyttningsbesiktning: false,
      fixa_vaggar: false,
      mala: false,
      slutstadning: false,
      avflyttningsbesiktning: false,
      fa_tillbaka_deposition: false,
      packa_upp: false
    })
    
    const [additionalServices, setAdditionalServices] = useState({
      flyttstadning: false,
      packning: false,
      mobelmontering: false,
      vaggfixning: false,
      abonnemangsflytt: false
    })

    // 🔧 SYNKRONISERA additionalServices state med order.services
    useEffect(() => {
      if (order?.services) {
        console.log('🔄 Synkroniserar additionalServices med order.services:', order.services)
        
        const serviceNameToId = {
          'Flyttstädning': 'flyttstadning',
          'Packning (tillägg)': 'packning',
          'Packning': 'packning', // Även för befintlig packning
          'Möbelmontering': 'mobelmontering',
          'Väggfixning & Målning': 'vaggfixning',
          'Abonnemangsflytt': 'abonnemangsflytt'
        }
        
        const updatedAdditionalServices = {
          flyttstadning: false,
          packning: false,
          mobelmontering: false,
          vaggfixning: false,
          abonnemangsflytt: false
        }
        
        // Kolla vilka tjänster som redan finns
        order.services.forEach(service => {
          const serviceId = serviceNameToId[service.name]
          if (serviceId) {
            updatedAdditionalServices[serviceId] = true
            console.log(`✅ Service '${service.name}' mapped to '${serviceId}' = true`)
          }
        })
        
        setAdditionalServices(updatedAdditionalServices)
        console.log('🔄 additionalServices uppdaterad till:', updatedAdditionalServices)
      }
    }, [order?.services])

    // 📋 CHECKLISTA FUNKTIONER
    const handleChecklistChange = async (itemId: string) => {
      const updated = {
        ...checklistProgress,
        [itemId]: !checklistProgress[itemId]
      }
      setChecklistProgress(updated)
      
      // Spara till databas
      try {
        await fetch('/api/update-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: orderId,
            updates: {
              details: {
                checklist_progress: updated
              }
            }
          })
        })
      } catch (error) {
        console.error('Failed to save checklist progress:', error)
      }
    }
    
    // 🔒 SÄKER WRAPPER FÖR TILLÄGGSTJÄNSTER FRÅN CHECKLISTAN
    const handleUserClickedChecklistServiceAdd = async (serviceId: string, servicePrice: number) => {
      console.log(`🔒 handleUserClickedChecklistServiceAdd: Användare klickade på tilläggstjänst från checklistan: ${serviceId}`);
      console.log('✅ SÄKER ANVÄNDAR-HANDLING: Lägg till tjänst från checklista');
      
      // 🔧 FÖRENKLAD SÄKERHET - ingen fetch interceptor behövs längre
      
      // Anropa den faktiska service add funktionen direkt
      await handleServiceAdd(serviceId, servicePrice);
    }
    
    const handleServiceAdd = async (serviceId: string, servicePrice: number) => {
      console.log(`🔵 handleServiceAdd called with serviceId: ${serviceId}, price: ${servicePrice}`)
      console.log(`🔍 Current additionalServices state:`, additionalServices)
      console.log(`🔍 Current order.services:`, order?.services)
      
      const isCurrentlySelected = additionalServices[serviceId]
      console.log(`🔍 Service ${serviceId} is currently selected: ${isCurrentlySelected}`)
      
      const updated = {
        ...additionalServices,
        [serviceId]: !isCurrentlySelected
      }
      setAdditionalServices(updated)
      console.log(`🔍 Updated additionalServices:`, updated)
      
      if (!order) {
        console.error('❌ No order found, cannot update services')
        return
      }
      
      // Skapa ny services array
      let newServices = [...order.services]
      console.log(`🔍 Starting with services array:`, newServices)
      
      // Service namn mappning för alla tilläggstjänster
      const serviceNameMap: { [key: string]: string } = {
        'flyttstadning': 'Flyttstädning',
        'packning': 'Packning (tillägg)',
        'mobelmontering': 'Möbelmontering',
        'vaggfixning': 'Väggfixning & Målning',
        'abonnemangsflytt': 'Abonnemangsflytt'
      }
      
      const serviceName = serviceNameMap[serviceId]
      console.log(`🔍 Service ID '${serviceId}' maps to service name '${serviceName}'`)
      
      // 🔧 SÄKERHETSCHECK: Kontrollera att tjänsten finns
      if (!serviceName) {
        console.error(`❌ Service ID '${serviceId}' is not mapped to a service name!`)
        alert(`Tjänsten '${serviceId}' är inte konfigurerad korrekt.`)
        return
      }
      
      if (isCurrentlySelected) {
        // Ta bort tjänsten
        console.log(`🗑️ Removing service '${serviceName}' from services array`)
        const beforeRemove = newServices.length
        newServices = newServices.filter(s => s.name !== serviceNameMap[serviceId])
        console.log(`🗑️ Services array length: ${beforeRemove} -> ${newServices.length}`)
      } else {
        // Kontrollera om tjänsten redan finns
        const existingService = newServices.find(s => s.name === serviceNameMap[serviceId])
        if (!existingService) {
          // Lägg till tjänsten
          const newService = {
            id: `additional-${serviceId}`,
            name: serviceNameMap[serviceId],
            price: servicePrice
          }
          console.log(`➕ Adding new service:`, newService)
          newServices.push(newService)
          console.log(`➕ Services array now has ${newServices.length} services`)
        } else {
          console.log(`⚠️ Service '${serviceName}' already exists in array, skipping add`)
        }
      }
      
      // Beräkna nytt totalpris
      const newTotalPrice = newServices.reduce((sum, service) => sum + service.price, 0)
      
      // Uppdatera serviceTypes array
      const newServiceTypes = [...(order.serviceTypes || [])]
      if (!isCurrentlySelected && serviceId === 'flyttstadning' && !newServiceTypes.includes('cleaning')) {
        newServiceTypes.push('cleaning')
      } else if (isCurrentlySelected && serviceId === 'flyttstadning') {
        const index = newServiceTypes.indexOf('cleaning')
        if (index > -1) newServiceTypes.splice(index, 1)
      }
      
      // Spara till databas med uppdaterat pris och tjänster
      try {
        const requestPayload = {
          bookingId: orderId,
          updates: {
            total_price: newTotalPrice,
            service_types: newServiceTypes,
            details: {
              // 🔧 ANVÄND RÄTT DATABAS-FÄLT: additionalServices (string array)
              additionalServices: newServices
                .filter(s => s.id && s.id.startsWith('additional-'))
                .map(s => s.name),
              // Lägg till andra fält för debug/tracking  
              additional_services_state: updated,
              additional_services_total: newServices
                .filter(s => s.id && s.id.startsWith('additional-'))
                .reduce((sum, s) => sum + s.price, 0),
              // Spara hela services array som JSON för senare användning
              full_services_json: JSON.stringify(newServices)
            }
          }
        }
        
        console.log('🔥 SENDING TO API - Full request payload:')
        console.log(JSON.stringify(requestPayload, null, 2))
        console.log('🔥 Request URL: /api/update-booking')
        console.log('🔥 Booking ID:', orderId)
        console.log('🔥 New total price:', newTotalPrice)
        console.log('🔥 New services:', newServices)
        
        const response = await fetch('/api/update-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        })
        
        console.log('🔥 API RESPONSE STATUS:', response.status)
        console.log('🔥 API RESPONSE STATUS TEXT:', response.statusText)
        console.log('🔥 API RESPONSE OK:', response.ok)
        console.log('🔥 API RESPONSE HEADERS:', Object.fromEntries(response.headers.entries()))
        
        const result = await response.json()
        console.log('🔥 API RESPONSE BODY:', JSON.stringify(result, null, 2))
        if (result.success) {
          console.log('💾 API update successful, updating local state...')
          console.log('💾 New total price:', newTotalPrice)
          console.log('💾 New services array:', newServices)
          console.log('💾 New service types:', newServiceTypes)
          
          // Uppdatera local state med nytt pris OCH nya tjänster
          setOrder(prev => {
            const updatedOrder = prev ? {
              ...prev,
              totalPrice: newTotalPrice,
              services: newServices,
              serviceTypes: newServiceTypes
            } : null
            
            console.log('💾 Order state updated to:', updatedOrder)
            return updatedOrder
          })
          
          // ✅ STATE UPPDATERAT: Services och pris är nu synkroniserade
          console.log('✅ Tjänster och pris uppdaterade i både databas och local state')
          console.log('📋 Uppdaterad order.services:', newServices)
          console.log('💰 Uppdaterat order.totalPrice:', newTotalPrice)
          
          console.log(`✅ Tjänst ${isCurrentlySelected ? 'borttagen' : 'tillagd'}: ${serviceId}`)
          console.log(`📋 Nya tjänster:`, newServices.map(s => `${s.name}: ${s.price} kr`))
          console.log(`💰 Nytt totalpris: ${newTotalPrice} kr`)
          
          // 🔍 EXTRA DEBUG: Logga vad som faktiskt sparas och uppdateras
          console.log('🔍 EXTRA DEBUG: Services som sparas till API:', newServices)
          console.log('🔍 EXTRA DEBUG: API response:', result)
          console.log('🔍 EXTRA DEBUG: Local state kommer att uppdateras med:')
          console.log('  - services:', newServices)
          console.log('  - totalPrice:', newTotalPrice)
          console.log('  - serviceTypes:', newServiceTypes)
        } else {
          console.error('❌ API update failed:', result)
          console.error('❌ Full API response:', JSON.stringify(result, null, 2))
          console.error('❌ Error message:', result.error)
          console.error('❌ Success status:', result.success)
          alert(`Kunde inte spara tjänsten. Server error: ${result.error || 'Okänt fel'}`)
        }
      } catch (error) {
        console.error('❌ Failed to save additional services:', error)
        console.error('❌ Error details:', error.message)
        console.error('❌ Full error object:', error)
        alert(`Ett tekniskt fel uppstod: ${error.message}`)
      }
    }
    
    // Räkna progress
    const checkedCount = Object.values(checklistProgress).filter(Boolean).length
    const totalItems = Object.keys(checklistProgress).length
    const progressPercentage = Math.round((checkedCount / totalItems) * 100)

    // Funktion för att formatera datum
    const formatDate = (dateString: string) => {
      try {
        if (!dateString) return 'Datum saknas'
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return dateString // Returnera original om ogiltigt
        return date.toLocaleDateString('sv-SE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch (error) {
        console.error('Fel vid datumformatering:', error)
        return dateString || 'Datum saknas'
      }
    }

    // Funktion för att generera kalenderlänkar
    const generateCalendarLinks = () => {
      // TEMPORÄR FIX: Returnera tomma länkar för att undvika datum-fel
      return { google: '', outlook: '' };
    }

    const [showVolumeConfirmation, setShowVolumeConfirmation] = useState(false)

    // Funktion för att beräkna nytt pris baserat på volym
    const calculateNewPrice = (volume: number) => {
      const currentVolume = Number(order?.moveSize) || 19;
      const currentPrice = order?.totalPrice || 2700;
      const pricePerCubic = 150; // Pris per extra kubikmeter
      
      // Beräkna prisskillnaden baserat på volymförändringen
      const volumeDifference = volume - currentVolume;
      const priceAdjustment = volumeDifference * pricePerCubic;
      
      // Returnera det nya totalpriset
      return currentPrice + priceAdjustment;
    };

    // Uppdatera när volymen ändras
    const handleVolumeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const volume = e.target.value;
      setNewVolume(volume);
      
      if (volume && Number(volume) > 0) {
        const calculatedPrice = calculateNewPrice(Number(volume));
        // Avrunda till närmaste heltal
        setNewPrice(Math.round(calculatedPrice));
      } else {
        setNewPrice(null);
      }
    };

    const handleVolumeChange = async () => {
      try {
        const volumeNumber = Number(newVolume);
        if (!volumeNumber || !newPrice) return;
    
        // 🚨 SÄKERHET: Denna funktion ska INTE anropas direkt - använd handleUserClickedVolumeSave
        console.log('🚨 BLOCKING handleVolumeChange - should not auto-save');
        return; // BLOCKERA TILLS VI HITTAR PROBLEMET
        const response = await fetch('/api/update-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: orderId,
            updates: {
              volume: volumeNumber,
              total_price: newPrice
            }
          })
        });
    
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Update failed');
        
        // Uppdatera lokal state
        setOrder(prev => prev ? {
          ...prev,
          moveSize: String(volumeNumber),
          totalPrice: newPrice
        } : null);
        
        setShowVolumeModal(false);
        setShowEditModal(false);
        setNewPrice(null);
        console.log('✅ Volymen har uppdaterats!');
      } catch (error) {
        console.error('Error updating volume:', error);
        console.error('Kunde inte uppdatera volymen. Försök igen.');
      }
    };

    // 🔒 SÄKER VOLYM-SPARNING: Användare klickade "Spara ändringar"
    const handleUserClickedVolumeSave = async () => {
      try {
        const volumeNumber = Number(newVolume);
        if (!volumeNumber || !newPrice) return;
    
        console.log('🔒 handleUserClickedVolumeSave: Användare klickade "Spara ändringar" för volym');
        
        // Stack trace för säkerhetskontroll
        const error = new Error('Stack trace for volume save');
        const stack = error.stack || '';
        const isFromVolumeSave = stack.includes('handleUserClickedVolumeSave');
        
        console.log('🔍 VOLUME SAVE STACK ANALYSIS:');
        console.log('- From handleUserClickedVolumeSave:', isFromVolumeSave);
        
        if (!isFromVolumeSave) {
          console.error('🚨 SÄKERHETSFEL: handleUserClickedVolumeSave anropas inte korrekt!');
          console.log('🚨 isFromVolumeSave is:', isFromVolumeSave);
          return;
        }
        
        const response = await fetch('/api/update-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: orderId,
            updates: {
              total_price: newPrice,
              details: {
                estimatedVolume: volumeNumber
              }
            }
          })
        });
    
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Update failed');
        
        // Uppdatera lokal state
        setOrder(prev => prev ? {
          ...prev,
          moveSize: String(volumeNumber),
          totalPrice: newPrice,
          details: {
            ...prev.details,
            estimatedVolume: volumeNumber
          }
        } : null);
        
        setShowVolumeModal(false);
        setShowEditModal(false);
        setNewPrice(null);
        console.log('✅ Volymen har uppdaterats!');
      } catch (error) {
        console.error('Error updating volume:', error);
        console.error('Kunde inte uppdatera volymen. Försök igen.');
      }
    };

    const handleServiceToggle = async (serviceType: string) => {
      try {
        const livingArea = Number(order?.details?.startLivingArea || 70);
        const servicePrice = calculateServicePrice(serviceType, livingArea);
        
        const isRemoving = order?.serviceTypes?.includes(serviceType);
        let updatedServices, updatedServiceTypes, newTotalPrice;
        
        if (isRemoving) {
          // Ta bort tjänst
          updatedServices = order?.services?.filter(s => 
            s.name !== (serviceType === 'packing' ? 'Packning' : 'Flyttstädning')
          ) || [];
          updatedServiceTypes = order?.serviceTypes?.filter(st => st !== serviceType) || [];
          newTotalPrice = updatedServices.reduce((sum, s) => sum + s.price, 0);
        } else {
          // Lägg till tjänst
          const newService = {
            id: `service-${serviceType}-${Date.now()}`,
            name: serviceType === 'packing' ? 'Packning' : 'Flyttstädning',
            price: servicePrice || 0
          };
          updatedServices = [...(order?.services || []), newService];
          updatedServiceTypes = [...(order?.serviceTypes || []), serviceType];
          newTotalPrice = updatedServices.reduce((sum, s) => sum + s.price, 0);
        }
    
        // 🚨 SÄKERHET: Denna funktion ska INTE anropas direkt - använd handleUserClickedServiceSave
        console.log('🚨 BLOCKING handleServiceToggle - should not auto-save');
        return; // BLOCKERA TILLS VI HITTAR PROBLEMET
        const response = await fetch('/api/update-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: orderId,
            updates: {
              service_types: updatedServiceTypes,
              total_price: newTotalPrice
            }
          })
        });
    
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Update failed');
        
        // Uppdatera lokal state
        setOrder(prev => prev ? {
          ...prev,
          services: updatedServices,
          serviceTypes: updatedServiceTypes,
          totalPrice: newTotalPrice
        } : null);
        
        console.log(`✅ Tjänst ${isRemoving ? 'borttagen' : 'tillagd'}!`);
      } catch (error) {
        console.error('Error updating services:', error);
        console.error('Kunde inte uppdatera tjänster. Försök igen.');
      }
    };

    // 🔒 SÄKER TJÄNSTER-SPARNING: Användare klickade på tjänst-checkbox
    const handleUserClickedServiceSave = async (serviceType: string) => {
      try {
        console.log(`🔒 handleUserClickedServiceSave: Användare klickade på tjänst: ${serviceType}`);
        
        // Stack trace för säkerhetskontroll
        const error = new Error('Stack trace for service save');
        const stack = error.stack || '';
        const isFromServiceSave = stack.includes('handleUserClickedServiceSave');
        
        console.log('🔍 SERVICE SAVE STACK ANALYSIS:');
        console.log('- From handleUserClickedServiceSave:', isFromServiceSave);
        
        if (!isFromServiceSave) {
          console.error('🚨 SÄKERHETSFEL: handleUserClickedServiceSave anropas inte korrekt!');
          console.log('🚨 isFromServiceSave is:', isFromServiceSave);
          return;
        }
        
        const livingArea = Number(order?.details?.startLivingArea || 70);
        
        // 🔧 FIXA: Använd korrekt calculateServicePrice funktion baserat på serviceType
        const calculateCorrectServicePrice = (serviceType: string, livingArea: number = 70) => {
          switch (serviceType) {
            case 'moving':
              return order?.totalPrice || 0;
            case 'packing':
              return Math.max(livingArea * PRICING_CONFIG.packingPerSqm, PRICING_CONFIG.packingMinPrice);
            case 'cleaning':
              return Math.max(livingArea * PRICING_CONFIG.cleaningPerSqm, PRICING_CONFIG.cleaningMinPrice);
            default:
              return 0;
          }
        };
        
        const servicePrice = calculateCorrectServicePrice(serviceType, livingArea);
        
        // 🔍 DEBUG: Utforska order-struktur för att hitta NaN-problemet
        console.log('🔍 DEBUG ORDER STRUKTUR:');
        console.log('- order.services:', order?.services);
        console.log('- order.serviceTypes:', order?.serviceTypes);
        console.log('- livingArea:', livingArea);
        console.log('- serviceType parameter:', serviceType);
        console.log('- calculateServicePrice result:', servicePrice);
        
        // Debug calculateServicePrice funktion
        console.log('🔍 CALCULATESERVICEPRICE DEBUG:');
        console.log('- PRICING_CONFIG:', PRICING_CONFIG);
        
        const isRemoving = order?.serviceTypes?.includes(serviceType);
        let updatedServices, updatedServiceTypes, newTotalPrice;
        
        // Hämta grundpris för flytthjälp (ursprungligt pris utan tilläggstjänster)
        const baseMovePrice = order?.services?.find(s => s.name === 'Flytthjälp')?.price || order?.totalPrice || 0;
        
        if (isRemoving) {
          // Ta bort tjänst
          updatedServices = order?.services?.filter(s => 
            s.name !== (serviceType === 'packing' ? 'Packning' : 'Flyttstädning')
          ) || [];
          updatedServiceTypes = order?.serviceTypes?.filter(st => st !== serviceType) || [];
          
          // Räkna totalpris: grundpris + kvarvarande tilläggstjänster
          const additionalServicesPrice = updatedServices
            .filter(s => s.name !== 'Flytthjälp')
            .reduce((sum, s) => sum + s.price, 0);
          newTotalPrice = baseMovePrice + additionalServicesPrice;
        } else {
          // Lägg till tjänst
          const newService = {
            id: `service-${serviceType}-${Date.now()}`,
            name: serviceType === 'packing' ? 'Packning' : 'Flyttstädning',
            price: servicePrice || 0
          };
          updatedServices = [...(order?.services || []), newService];
          updatedServiceTypes = [...(order?.serviceTypes || []), serviceType];
          
          // Räkna totalpris: grundpris + ALLA tilläggstjänster
          const additionalServicesPrice = updatedServices
            .filter(s => s.name !== 'Flytthjälp')
            .reduce((sum, s) => sum + s.price, 0);
          newTotalPrice = baseMovePrice + additionalServicesPrice;
        }
        
        console.log('💰 PRISER DEBUG:');
        console.log('- Grundpris (flytthjälp):', baseMovePrice);
        console.log('- Tjänstpris (' + serviceType + '):', servicePrice);
        console.log('- Nytt totalpris:', newTotalPrice);
        
        const response = await fetch('/api/update-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: orderId,
            updates: {
              service_types: updatedServiceTypes,
              total_price: newTotalPrice
            }
          })
        });
    
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Update failed');
        
        // 🔧 FIXA: Uppdatera lokal state med korrekta individuella priser
        // Behåll grundpriset för flytthjälp, lägg bara till/ta bort tilläggstjänster
        const correctedServices = updatedServices.map(service => {
          if (service.name === 'Flytthjälp') {
            // Behåll ursprungligt pris för flytthjälp
            return {
              ...service,
              price: baseMovePrice
            };
          }
          return service; // Andra tjänster behåller sina korrekta priser
        });
        
        console.log('🔧 KORRIGERADE SERVICES:', correctedServices);
        console.log('🔧 TOTALPRIS (separat):', newTotalPrice);
        
        setOrder(prev => prev ? {
          ...prev,
          services: correctedServices,
          serviceTypes: updatedServiceTypes,
          totalPrice: newTotalPrice
        } : null);
        
        console.log(`✅ Tjänst ${isRemoving ? 'borttagen' : 'tillagd'}!`);
      } catch (error) {
        console.error('Error updating services:', error);
        console.error('Kunde inte uppdatera tjänster. Försök igen.');
      }
    };

    const [showShareModal, setShowShareModal] = useState(false)

    // Lägg till efter andra useEffect hooks
    const handleShare = (method: 'email' | 'sms' | 'whatsapp' | 'copy') => {
      const shareUrl = window.location.href
      // Formatera datum med tid
      const moveDateTime = order?.moveDate && order?.moveTime 
        ? `${new Date(order.moveDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })} kl. ${order.moveTime}`
        : order?.moveDate 
          ? new Date(order.moveDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'Datum ej angivet'

      const shareText = `Hej! 👋\n\nJag har bokat en flytt med Nordflytt och tänkte dela informationen med dig.\n\n📦 FLYTTDETALJER:\nFrån: ${order?.address}\nTill: ${order?.address_to}\nDatum: ${moveDateTime}\nBokningsnummer: ${order?.orderNumber}\n\nDu kan se all information här:`

      switch (method) {
        case 'email':
          window.location.href = `mailto:?subject=Min flytt ${moveDateTime} - Nordflytt&body=${encodeURIComponent(shareText)}\n\n${encodeURIComponent(shareUrl)}\n\nHa en bra dag!`
          break
        case 'sms':
          window.location.href = `sms:?body=${encodeURIComponent(shareText)}\n\n${encodeURIComponent(shareUrl)}\n\nHa en bra dag!`
          break
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}\n\n${encodeURIComponent(shareUrl)}\n\nHa en bra dag!`, '_blank')
          break
        case 'copy':
          navigator.clipboard.writeText(shareUrl)
          // TODO: Visa bekräftelse toast
          break
      }
      setShowShareModal(false)
    }

    const calculateServicePrice = (livingArea: number = 70) => {
      return livingArea * 44;
    };

    const livingArea = Number(order?.details?.startLivingArea || 70);
    const servicePrice = calculateServicePrice(livingArea);

    // SÄKER FUNKTION: Endast för användarinitierade klick
    const handleUserClickedDateTimeSave = async () => {
      console.log('🔵 User clicked "Spara ändringar" for date/time - LEGITIMATE CALL');
      
      if (!newDate || !newTime) {
        console.log('❌ Missing date or time');
        return;
      }
      
      console.log('🔄 Setting allowApiCall to true för datetime save');
      setAllowApiCall(true);
      
      try {
        console.log('🔥 Calling handleDateTimeChange from user action');
        await handleDateTimeChange();
      } catch (error) {
        console.error('❌ Error in datetime save:', error);
      } finally {
        console.log('🔄 Resetting allowApiCall to false');
        setAllowApiCall(false);
      }
    };

    const handleDateTimeChange = async () => {
      try {
        if (!newDate || !newTime) return;
    
        // SÄKERHETSKONTROLL: Samma som address modal - stack trace analysis
        const stack = new Error().stack || '';
        const isFromDateTimeSave = stack.includes('handleUserClickedDateTimeSave');
        
        console.log('🔍 DateTime save stack analysis:');
        console.log('- From handleUserClickedDateTimeSave:', isFromDateTimeSave);
        console.log('- allowApiCall flag:', allowApiCall);
        
        if (!allowApiCall && !isFromDateTimeSave) {
          console.log('🚨 BLOCKING handleDateTimeChange - should not auto-save');
          console.log('🚨 allowApiCall is:', allowApiCall);
          console.log('🚨 isFromDateTimeSave is:', isFromDateTimeSave);
          return; // BLOCKERA AUTO-SPARNING
        }
        
        console.log('✅ ALLOWING handleDateTimeChange - user initiated save');
        console.log('📅 Updating date/time:', { newDate, newTime, orderId });
        
        const requestBody = {
          bookingId: orderId,
          updates: {
            move_date: newDate,
            move_time: newTime
          }
        };
        
        console.log('🚀 Sending API request to /api/update-booking:', requestBody);
        
        const response = await fetch('/api/update-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        console.log('📡 API Response status:', response.status);
        console.log('📡 API Response ok:', response.ok);
        console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📡 Raw API Response text:', responseText);
        
        let result;
        try {
          result = JSON.parse(responseText);
          console.log('📡 Parsed API Response:', result);
        } catch (parseError) {
          console.error('❌ Failed to parse API response as JSON:', parseError);
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
        
        if (!response.ok) {
          console.error('❌ HTTP Error:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${result.error || result.message || 'Unknown error'}`);
        }
        
        if (!result.success) {
          console.error('❌ API returned success=false:', result);
          throw new Error(result.error || result.message || 'Update failed');
        }
        
        // Uppdatera lokal state
        setOrder(prev => prev ? {
          ...prev,
          moveDate: newDate,
          moveTime: newTime
        } : null);
        
        setShowDateModal(false);
        setShowEditModal(false);
        setNewDate("");
        setNewTime("");
        
        console.log('✅ Date/time update successful!');
        // Tyst sparning - inga störande popups
      } catch (error) {
        console.error('❌ DETAILED ERROR in handleDateTimeChange:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // Logga fel men visa ingen popup (samma som address modal)
        let userMessage = 'Kunde inte uppdatera datum/tid. ';
        if (error.message.includes('HTTP 400')) {
          userMessage += 'Ogiltig data skickades till servern.';
        } else if (error.message.includes('HTTP 500')) {
          userMessage += 'Serverfel inträffade.';
        } else if (error.message.includes('Failed to fetch')) {
          userMessage += 'Nätverksfel - kontrollera internetanslutningen.';
        } else {
          userMessage += `Fel: ${error.message}`;
        }
        
        console.error('❌ User-friendly error message:', userMessage);
        // Ingen alert - tyst error handling
      }
    };

    const handleAddressChange = async () => {
      console.log('🚨🚨🚨 OLD handleAddressChange CALLED - THIS SHOULD NOT HAPPEN!');
      console.trace('STACK TRACE - Who called OLD handleAddressChange?');
      
      // BLOCKERA AUTOMATISK SPARNING
      console.error('🚨 BLOCKING OLD handleAddressChange - SHOULD NOT RUN');
      return;
      
      try {
        if (!newStartAddress || !newEndAddress) return;
    
        // 🔧 NYTT: Anropa update-booking API
        const response = await fetch('/api/update-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: orderId,
            updates: {
              start_address: newStartAddress,
              end_address: newEndAddress,
              details: {
                startFloor: newStartFloor,
                endFloor: newEndFloor,
                startElevator: newStartElevator,
                endElevator: newEndElevator
              }
            }
          })
        });
    
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Update failed');
        
        // Uppdatera lokal state
        setOrder(prev => prev ? {
          ...prev,
          address: newStartAddress,
          address_to: newEndAddress,
          details: {
            ...prev.details,
            startAddress: newStartAddress,
            endAddress: newEndAddress,
            startFloor: newStartFloor,
            endFloor: newEndFloor,
            startElevator: newStartElevator,
            endElevator: newEndElevator
          }
        } : null);
        
        setShowAddressModal(false);
        setShowEditModal(false);
        setNewStartAddress("");
        setNewEndAddress("");
        setNewStartFloor("");
        setNewEndFloor("");
        setNewStartElevator('none');
        setNewEndElevator('none');
        console.log('✅ Address updated from OLD handleAddressChange!');
        alert('Adresser har uppdaterats!');
      } catch (error) {
        console.error('Error updating addresses:', error);
        alert('Kunde inte uppdatera adresser. Försök igen.');
      }
    };

    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false)
    const [cancellationReason, setCancellationReason] = useState("")


    const handleCancelBooking = async () => {
      try {
        if (!order) return;

        // Beräkna om avbokningen är kostnadsfri baserat på flyttdatum
        const moveDate = new Date(order.moveDate || "");
        const now = new Date();
        const hoursDifference = (moveDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isFreeCancel = hoursDifference >= 24;

        // Uppdatera lokal state
        setOrder(prev => prev ? {
          ...prev,
          status: 'cancelled',
          cancellationReason,
          cancellationDate: new Date().toISOString(),
          cancellationFee: isFreeCancel ? 0 : Math.round(prev.totalPrice * 0.5)
        } : null);

        // TODO: Uppdatera i Supabase
        // const { data, error } = await supabase
        //   .from('bookings')
        //   .update({
        //     status: 'cancelled',
        //     cancellation_reason: cancellationReason,
        //     cancellation_date: new Date().toISOString(),
        //     cancellation_fee: isFreeCancel ? 0 : Math.round(order.totalPrice * 0.5)
        //   })
        //   .eq('id', params.id);

        setShowCancelConfirmModal(false);
        setShowEditModal(false);
        setCancellationReason("");
        router.push('/'); // Omdirigera till startsidan
        // Visa success toast eller meddelande
      } catch (error) {
        console.error('Error cancelling booking:', error);
        // Visa error toast eller meddelande
      }
    };

    // Review handling
    const handleReviewSubmit = async (rating: number, feedback?: string) => {
      if (!order) {
        console.error('Cannot submit review: No order data available');
        alert('Ett fel uppstod. Vänligen försök igen senare.');
        return;
      }

      try {
        console.log('Submitting review for booking:', orderId);
        
        const response = await reviewService.submitReview({
          bookingId: orderId,
          rating,
          comment: feedback,
          fromAddress: order.details?.startAddress || order.address || '',
          toAddress: order.details?.endAddress || order.address_to || '',
          customerId: order.customer_id
        });

        console.log('Review submission response:', response);

        if (response.success) {
          if (rating <= 2) {
            // Visa bekräftelse för lågt betyg
            setShowLowRatingModal(false);
            alert('Tack för din feedback! Vi kommer att kontakta dig inom kort.');
          } else {
            // Öppna Google Review modal för högt betyg
            setShowGoogleReviewModal(true);
          }
        } else {
          console.error('Failed to submit review:', response.error);
          throw new Error('Failed to submit review');
        }
      } catch (error) {
        console.error('Error in handleReviewSubmit:', error);
        alert('Det gick tyvärr inte att skicka din recension. Försök igen senare.');
      }
    };

    // Kontrollera om användaren redan har lämnat en recension
    useEffect(() => {
      // Prevent multiple checks
      if (!orderId || hasCheckedReview.current) return;
      
      const checkExistingReview = async () => {
        hasCheckedReview.current = true;
        
        const existingReview = await reviewService.getReview(orderId);
        if (existingReview) {
          setSelectedRating(existingReview.rating);
        }
      };

      checkExistingReview();
    }, [orderId]);

    if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Laddar orderbekräftelse...</p>
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
              <h2 className="mt-2 text-xl font-semibold text-gray-800">Ett fel uppstod</h2>
              <p className="mt-2 text-gray-600">{error}</p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => router.push(`/offer/${orderId}`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Tillbaka till offert
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Försök igen
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    if (!order) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="mt-2 text-xl font-semibold text-gray-800">Order hittades inte</h2>
              <p className="mt-2 text-gray-600">Den begärda ordern kunde inte hittas.</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Tillbaka till startsidan
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="min-h-screen bg-[#F7F5F0] pb-24">
        {showConfetti && (
          <ReactConfetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={200}
          />
        )}

        <div className="mx-auto px-4 md:px-8 max-w-full md:max-w-[720px] lg:max-w-[1200px]">
          {/* Header + bekräftelsemeddelande */}
          <section className="pt-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E6F7ED] rounded-full mb-4">
              <CheckIcon className="w-8 h-8 text-[#4CAF50]" aria-hidden="true" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-black">Tack, {order?.customerName} – din flytt är bokad!</h1>
            <p className="text-base md:text-lg text-[#4F4F4F] mt-2 max-w-xl mx-auto">
              Här är allt samlat inför flytten.
            </p>
            <div className="mt-4 bg-[#F5F9FF] p-3 rounded-lg inline-flex items-center text-sm">
              <InfoIcon className="w-4 h-4 mr-2 text-[#002A5C]" aria-hidden="true" />
              <span>Detta är ditt personliga flyttkonto – spara länken som genväg</span>
            </div>
          </section>

          {/* Kreditkontroll-varning om nekad */}
          {creditRejected && (
            <section className="mt-6">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Betalningsmetod har ändrats</AlertTitle>
                <AlertDescription className="text-orange-700">
                  För att säkra din bokning behöver vi förskottsbetalning med Swish. 
                  Du kommer få instruktioner för betalning inom kort. 
                  Din flytt är fortfarande bokad och bekräftad!
                </AlertDescription>
              </Alert>
            </section>
          )}

          {/* Sammanfattning av bokningen med obligatorisk information */}
          <section className="mt-6">
            <Card className="p-5 border border-[#E0E0E0] shadow-md bg-white">
              <h2 className="text-xl font-bold mb-4">Din bokning</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                      <CalendarIcon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-[#4F4F4F]">Datum och tid:</p>
                      <p className="font-medium">
                        {order?.moveDate ? new Date(order.moveDate).toLocaleDateString('sv-SE') : 'Ej angivet'}, 
                        kl. {order?.moveTime?.substring(0, 5) || '08:00'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                      <TruckIcon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-[#4F4F4F]">Bokad volym:</p>
                      <p className="font-medium">{order?.moveSize} m³</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                      <HomeIcon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-[#4F4F4F]">Från adress:</p>
                      <p className="font-medium">{order?.address}</p>
                      {order?.details?.startPropertyType && (
                        <p className="text-sm text-[#4F4F4F]">
                          {order.details.startPropertyType === 'apartment' ? 'Lägenhet' : 'Villa'}, 
                          {order.details.startLivingArea} m², 
                          {order.details.startFloor} tr, 
                          Hiss: {order.details.startElevator === 'big' ? 'Stor' : 
                                order.details.startElevator === 'small' ? 'Liten' : 'Ingen'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                      <HomeIcon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-[#4F4F4F]">Till adress:</p>
                      <p className="font-medium">{order?.address_to}</p>
                      {order?.details?.endPropertyType && (
                        <p className="text-sm text-[#4F4F4F]">
                          {order.details.endPropertyType === 'apartment' ? 'Lägenhet' : 'Villa'}, 
                          {order.details.endLivingArea} m², 
                          {order.details.endFloor} tr, 
                          Hiss: {order.details.endElevator === 'big' ? 'Stor' : 
                                order.details.endElevator === 'small' ? 'Liten' : 'Ingen'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                      <UserIcon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-[#4F4F4F]">Kunduppgifter:</p>
                      <p className="font-medium">{order?.customerName}</p>
                      <p className="text-sm text-[#4F4F4F]">{order?.phone}</p>
                      <p className="text-sm text-[#4F4F4F]">{order?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                      <InfoIcon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-[#4F4F4F]">Ordernummer:</p>
                      <p className="font-medium">{order?.orderNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Credit check status display */}
                {order?.details?.creditCheckStatus && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        order.details.creditCheckStatus === 'approved' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        {order.details.creditCheckStatus === 'approved' ? (
                          <CheckIcon className="w-4 h-4 text-green-600" aria-hidden="true" />
                        ) : (
                          <InfoIcon className="w-4 h-4 text-orange-600" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {order.details.creditCheckStatus === 'approved' 
                            ? 'Kreditprövning godkänd'
                            : 'Alternativ betalning aktiverad'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.details.creditCheckStatus === 'approved' 
                            ? `Betalningsmetod: ${order.details.paymentMethod === 'invoice' ? 'Faktura' : order.details.paymentMethod}`
                            : order.details.creditCheckReason === 'low_credit_score'
                              ? 'Kreditprövningen kunde inte godkännas. Vi har automatiskt bytt till förskottsbetalning med Swish för din säkerhet.'
                              : 'Vi har bytt till förskottsbetalning med Swish baserat på kreditprövningen.'}
                        </p>
                        {order.details.creditCheckStatus === 'rejected' && (
                          <p className="text-sm text-orange-600 mt-2 font-medium">
                            Betalningsmetod: Swish-förskott (hela beloppet betalas innan flytt)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bokade tjänster */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Bokade tjänster:</h3>
                  <div className="space-y-4">
                    {/* Visa alla tjänster från services array - SÄKER FALLBACK */}
                    {(order?.services || []).map((service, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
                              <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
                            </div>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              {service.name === 'Flytthjälp' && (
                                <p className="text-sm text-gray-600">{order?.moveSize} kubikmeter</p>
                              )}
                              {(service.name === 'Packning' || service.name === 'Packning (tillägg)' || service.name === 'Flyttstädning') && (
                                <p className="text-sm text-gray-600">{order.details?.startLivingArea || 70} m²</p>
                              )}
                            </div>
                          </div>
                          <span className="font-medium">{(service.price || 0).toLocaleString('sv-SE')} kr</span>
                        </div>
                    ))}
                    
                  </div>
                  
                  {/* Visa tilläggstjänster från databasen som egen sektion */}
                  {dbAdditionalServices.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">Tilläggstjänster under uppdraget:</h3>
                      <p className="text-sm text-gray-600 mb-4 flex items-center">
                        <span className="mr-2">💡</span>
                        Nödvändigt material tillkommer för att göra flytten säker och effektiv
                      </p>
                      <div className="space-y-3">
                        {dbAdditionalServices.map((service) => (
                          <div key={service.id} className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <Plus className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{service.service_name}</p>
                                <p className="text-sm text-gray-600">
                                  {service.quantity} {service.unit || 'st'} • Tillagd av {service.added_by}
                                </p>
                              </div>
                            </div>
                            <span className="font-medium text-blue-600">+{(service.total_price || 0).toLocaleString('sv-SE')} kr</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                    {/* Visa tillgängliga tjänster att lägga till inom bokade tjänster */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-3 flex items-center">
                        <span className="mr-2">💡</span>
                        Du kan lägga till dessa tjänster fram till dagen innan flytten:
                      </p>
                      <div className="space-y-3">
                      {!order?.serviceTypes?.includes('packing') && !order?.services?.some(s => s.name === 'Packning' || s.name === 'Packning (tillägg)') && (
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-dashed border-blue-300 hover:border-solid hover:shadow-sm transition-all">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                              <PackageIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Packning</p>
                              <p className="text-sm text-gray-500">Vi packar dina ägodelar professionellt • Baserat på {order.details?.startLivingArea || 70} m²</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            onClick={() => handleUserClickedServiceSave('packing')}
                          >
                            Lägg till +{Math.max(PRICING_CONFIG.packingMinPrice, (Number(order.details?.startLivingArea || 70) * PRICING_CONFIG.packingPerSqm)).toLocaleString('sv-SE')} kr
                          </Button>
                        </div>
                      )}

                      {!order?.serviceTypes?.includes('cleaning') && !order?.services?.some(s => s.name === 'Flyttstädning') && (
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-dashed border-blue-300 hover:border-solid hover:shadow-sm transition-all">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                              <HomeIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Flyttstädning</p>
                              <p className="text-sm text-gray-500">Professionell slutstädning av din bostad • Baserat på {order.details?.startLivingArea || 70} m²</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            onClick={() => handleUserClickedServiceSave('cleaning')}
                          >
                            Lägg till +{Math.max(PRICING_CONFIG.cleaningMinPrice, (Number(order.details?.startLivingArea || 70) * PRICING_CONFIG.cleaningPerSqm)).toLocaleString('sv-SE')} kr
                          </Button>
                        </div>
                      )}
                      </div>
                    </div>
                  <div className="mt-4 p-3 bg-[#F5F9FF] rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Grundpris:</span>
                      <span className="text-lg">{order?.totalPrice?.toLocaleString('sv-SE')} kr</span>
                    </div>
                    {additionalServicesTotal > 0 && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                        <span className="font-medium">Tilläggstjänster:</span>
                        <span className="text-lg text-blue-600">+{additionalServicesTotal.toLocaleString('sv-SE')} kr</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-300">
                      <span className="font-bold">Totalt pris:</span>
                      <span className="font-bold text-xl text-[#002A5C]">
                        {((order?.totalPrice || 0) + additionalServicesTotal).toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Din flyttpärm */}
          <section className="mt-6">
            <Card className="p-5 border border-[#E0E0E0] shadow-md bg-white">
              <h2 className="text-xl font-bold mb-4">Din flyttpärm</h2>
              <p className="text-base text-[#4F4F4F] mb-4">
                Här hittar du alla viktiga dokument och information om din flytt samlat på ett ställe.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bekräftelse */}
                <div 
                  onClick={generatePDFConfirmation}
                  className={`p-4 bg-white border border-[#E0E0E0] rounded-lg transition-all cursor-pointer group ${
                    isGeneratingPDF 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-lg hover:border-[#002A5C]'
                  } ${
                    pdfGenerationSuccess 
                      ? 'border-green-500 bg-green-50' 
                      : ''
                  } ${
                    pdfGenerationError 
                      ? 'border-red-500 bg-red-50' 
                      : ''
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      pdfGenerationSuccess 
                        ? 'bg-green-100' 
                        : pdfGenerationError 
                          ? 'bg-red-100' 
                          : 'bg-[#F5F9FF] group-hover:bg-[#002A5C]/10'
                    }`}>
                      {isGeneratingPDF ? (
                        <div className="w-6 h-6 border-2 border-[#002A5C] border-t-transparent rounded-full animate-spin" />
                      ) : pdfGenerationSuccess ? (
                        <CheckIcon className="w-6 h-6 text-green-600" />
                      ) : pdfGenerationError ? (
                        <XIcon className="w-6 h-6 text-red-600" />
                      ) : (
                        <FileIcon className="w-6 h-6 text-[#002A5C]" />
                      )}
                    </div>
                    <h3 className="font-medium mb-1">Bekräftelse</h3>
                    <p className="text-sm text-[#4F4F4F] mb-3">PDF</p>
                    <Button 
                      variant="outline" 
                      disabled={isGeneratingPDF}
                      className={`w-full transition-all ${
                        isGeneratingPDF 
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                          : pdfGenerationSuccess 
                            ? 'border-green-500 text-green-600 bg-green-50' 
                            : pdfGenerationError 
                              ? 'border-red-500 text-red-600 bg-red-50' 
                              : 'group-hover:border-[#002A5C] group-hover:text-[#002A5C]'
                      }`}
                    >
                      {isGeneratingPDF 
                        ? 'Skapar bekräftelse...' 
                        : pdfGenerationSuccess 
                          ? '✅ Bekräftelse skapad!' 
                          : pdfGenerationError 
                            ? '⚠️ Försök igen' 
                            : 'Ladda ner'
                      }
                    </Button>
                    {pdfGenerationError && (
                      <p className="text-xs text-red-600 mt-2">{pdfGenerationError}</p>
                    )}
                  </div>
                </div>

                {/* Checklista */}
                <div 
                  onClick={(e) => {
                    console.log('🔴 "Checklista" knapp klickad');
                    e.preventDefault();
                    e.stopPropagation();
                    setShowChecklistModal(true);
                  }}
                  className="p-4 bg-white border border-[#E0E0E0] rounded-lg hover:shadow-lg transition-all cursor-pointer hover:border-[#002A5C] group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F5F9FF] flex items-center justify-center mb-3 group-hover:bg-[#002A5C]/10">
                      <CheckSquareIcon className="w-6 h-6 text-[#002A5C]" />
                    </div>
                    <h3 className="font-medium mb-1">Checklista</h3>
                    <p className="text-sm text-[#4F4F4F] mb-3">PDF</p>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:border-[#002A5C] group-hover:text-[#002A5C]"
                    >
                      Öppna
                    </Button>
                  </div>
                </div>

                {/* Kalender */}
                <div 
                  onClick={() => setShowCalendarModal(true)}
                  className="p-4 bg-white border border-[#E0E0E0] rounded-lg hover:shadow-lg transition-all cursor-pointer hover:border-[#002A5C] group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F5F9FF] flex items-center justify-center mb-3 group-hover:bg-[#002A5C]/10">
                      <CalendarIcon className="w-6 h-6 text-[#002A5C]" />
                    </div>
                    <h3 className="font-medium mb-1">Kalender</h3>
                    <p className="text-sm text-[#4F4F4F] mb-3">Lägg till</p>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:border-[#002A5C] group-hover:text-[#002A5C]"
                    >
                      Lägg till
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Dokumentation */}
                <div 
                  onClick={(e) => {
                    console.log('🔴 "Dokumentation" knapp klickad');
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPhotosModal(true);
                  }}
                  className="p-4 bg-white border border-[#E0E0E0] rounded-lg hover:shadow-lg transition-all cursor-pointer hover:border-[#002A5C] group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F5F9FF] flex items-center justify-center mb-3 group-hover:bg-[#002A5C]/10">
                      <CameraIcon className="w-6 h-6 text-[#002A5C]" />
                    </div>
                    <h3 className="font-medium mb-1">Dokumentation</h3>
                    <p className="text-sm text-[#4F4F4F] mb-3">Bilder</p>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:border-[#002A5C] group-hover:text-[#002A5C]"
                    >
                      Visa bilder
                    </Button>
                  </div>
                </div>

                {/* Ändra */}
                <div 
                  onClick={(e) => {
                    console.log('🔴 "Redigera" knapp klickad');
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="p-4 bg-white border border-[#E0E0E0] rounded-lg hover:shadow-lg transition-all cursor-pointer hover:border-[#002A5C] group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F5F9FF] flex items-center justify-center mb-3 group-hover:bg-[#002A5C]/10">
                      <PencilIcon className="w-6 h-6 text-[#002A5C]" />
                    </div>
                    <h3 className="font-medium mb-1">Ändra</h3>
                    <p className="text-sm text-[#4F4F4F] mb-3">Bokning</p>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:border-[#002A5C] group-hover:text-[#002A5C]"
                    >
                      Ändra
                    </Button>
                  </div>
                </div>

                {/* Dela */}
                <div 
                  onClick={() => setShowShareModal(true)}
                  className="p-4 bg-white border border-[#E0E0E0] rounded-lg hover:shadow-lg transition-all cursor-pointer hover:border-[#002A5C] group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F5F9FF] flex items-center justify-center mb-3 group-hover:bg-[#002A5C]/10">
                      <ShareIcon className="w-6 h-6 text-[#002A5C]" />
                    </div>
                    <h3 className="font-medium mb-1">Dela</h3>
                    <p className="text-sm text-[#4F4F4F] mb-3">Bokning</p>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:border-[#002A5C] group-hover:text-[#002A5C]"
                    >
                      Dela bokning
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between bg-[#F5F9FF] p-3 rounded-lg">
                <div className="flex items-center">
                  <FolderIcon className="w-5 h-5 text-[#002A5C] mr-2" />
                  <span className="text-sm">Bokningsnummer: {order?.orderNumber}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#002A5C]"
                  onClick={() => {
                    navigator.clipboard.writeText(order?.orderNumber || '');
                    // TODO: Visa bekräftelse toast
                  }}
                >
                  Kopiera
                </Button>
              </div>
            </Card>
          </section>

          {/* Nästa steg */}
          <section className="mt-6">
            <Card className="p-5 border border-[#E0E0E0] shadow-md bg-white">
              <h2 className="text-xl font-bold mb-4">Nästa steg</h2>
              
              <div className="space-y-6">
                {/* Steg 1 - Bokningsbekräftelse */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3 text-[#4CAF50]">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Din flytt är bokad till {order?.moveDate ? new Date(order.moveDate).toLocaleDateString('sv-SE') : '2025-05-21'} kl. {order?.moveTime?.substring(0, 5) || '08:00'}.</p>
                    <p className="text-sm text-gray-600">Du behöver inte göra något mer just nu.</p>
                  </div>
                </div>

                {/* Steg 2 - Checklista */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                    <CheckSquareIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Använd checklistan för att förbereda dig i god tid.</p>
                    <p className="text-sm text-gray-600">Du hittar den längre upp på sidan – bocka av allt som blir klart.</p>
                  </div>
                </div>

                {/* Steg 3 - Tilläggstjänster */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                    <PackageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Vill du lägga till packning, bortforsling eller flyttstädning?</p>
                    <p className="text-sm text-gray-600">Det går bra att lägga till fler tjänster fram till dagen innan flytten.</p>
                  </div>
                </div>

                {/* Steg 4 - Ankomstsamtal */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                    <PhoneIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Vi ringer dig ca 30 minuter innan vi anländer på flyttdagen ({order?.moveDate ? new Date(order.moveDate).toLocaleDateString('sv-SE') : '2025-05-21'}).</p>
                  </div>
                </div>

                {/* Steg 5 - Fakturering */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 text-[#002A5C]">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Efter flytten skickar vi fakturan till din e-post.</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* SMS-påminnelse */}
          <section className="mt-6">
            <Card className="p-4 border border-[#E0E0E0] shadow-sm bg-white">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3">
                  <BellIcon className="w-5 h-5 text-[#002A5C]" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">SMS-påminnelse aktiverad</h3>
                  <p className="text-sm text-[#4F4F4F]">
                    Vi påminner dig automatiskt 24 timmar innan flytten. Du kommer få ett SMS till {order?.phone} med viktig information.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Recensionsmodul */}
          <section className="mt-6">
            <Card className="p-4 border border-[#E0E0E0] shadow-sm bg-white">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3">
                  <MessageCircleIcon className="w-5 h-5 text-[#002A5C]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-2">Hur nöjd är du med din flytt?</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          setSelectedRating(star);
                          handleReviewSubmit(star);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          selectedRating >= star 
                            ? 'bg-[#FFD700] text-white' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-[#4F4F4F]">
                    Ditt omdöme hjälper oss att bli bättre och hjälper andra att hitta pålitlig flytthjälp.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Google Review Modal */}
          <Dialog open={showGoogleReviewModal} onOpenChange={setShowGoogleReviewModal}>
            <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Tack för ditt fina betyg! 🌟</DialogTitle>
                <DialogDescription>
                  Vill du dela din positiva upplevelse på Google? Det tar bara en minut och hjälper andra att hitta pålitlig flytthjälp.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div className="bg-[#F5F9FF] rounded-lg p-4 text-center">
                  <p className="text-2xl mb-2">{'★'.repeat(selectedRating)}</p>
                  <p className="font-medium">Du gav oss {selectedRating} av 5 stjärnor</p>
                </div>
                <div className="flex flex-col space-y-3">
                  <Button 
                    className="w-full bg-[#4CAF50] hover:bg-[#388E3C]"
                    onClick={() => {
                      window.open('https://g.page/r/CVxHFntu6EddEBM/review', '_blank');
                      setShowGoogleReviewModal(false);
                    }}
                  >
                    Lämna recension på Google
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowGoogleReviewModal(false)}
                  >
                    Kanske senare
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Low Rating Modal */}
          <Dialog open={showLowRatingModal} onOpenChange={setShowLowRatingModal}>
            <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Vi beklagar att du inte är helt nöjd</DialogTitle>
                <DialogDescription>
                  Vi vill gärna höra mer om din upplevelse så att vi kan bli bättre. En av våra flyttkoordinatorer kommer att kontakta dig inom kort.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div className="bg-[#FFF5F7] rounded-lg p-4">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Berätta gärna mer om din upplevelse (valfritt)..."
                    className="w-full p-2 border rounded-md h-24 resize-none"
                  />
                </div>
                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={() => {
                      handleReviewSubmit(selectedRating, feedbackText);
                    }}
                  >
                    Skicka feedback
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowLowRatingModal(false)}
                  >
                    Stäng
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Trygghet & kontaktsektion */}
          <section className="mt-6">
            <Card className="p-5 border border-[#E0E0E0] shadow-md bg-white">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3">
                  <MessageCircleIcon className="w-6 h-6 text-[#002A5C]" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Frågor om din order?</h2>
                  <p className="text-[#4F4F4F]">Kontakta oss om du har några frågor eller funderingar.</p>
                </div>
              </div>

              <Button
                className="w-full bg-[#4CAF50] hover:bg-[#388E3C]"
                asChild
              >
                <a href="tel:010-555 12 89">
                  <MessageCircleIcon className="w-4 h-4 mr-2" />
                  Kontakta oss
                </a>
              </Button>
            </Card>
          </section>

          {/* Share Modal */}
          <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
            <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg p-0">
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Dela din bokning</DialogTitle>
                  <p className="text-gray-600 mt-2">
                    Dela din bokningsinformation med familj, vänner eller andra som behöver veta om din flytt.
                  </p>
                </DialogHeader>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Dela via</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleShare('email')}
                      className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                          <MessageCircleIcon className="w-5 h-5 text-[#002A5C]" />
                        </div>
                        <span>E-post</span>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                    </button>

                    <button 
                      onClick={() => handleShare('sms')}
                      className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                          <MessageSquareIcon className="w-5 h-5 text-[#002A5C]" />
                        </div>
                        <span>SMS</span>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                    </button>

                    <button 
                      onClick={() => handleShare('whatsapp')}
                      className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                          <PhoneIcon className="w-5 h-5 text-[#002A5C]" />
                        </div>
                        <span>WhatsApp</span>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                    </button>

                    <button 
                      onClick={() => handleShare('copy')}
                      className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                          <LinkIcon className="w-5 h-5 text-[#002A5C]" />
                        </div>
                        <span>Kopiera länk</span>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Footer */}
          <section className="mt-12 text-center">
            <p className="text-base md:text-lg mb-3">Tack för att du valde Nordflytt!</p>
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Nordflytt. Alla rättigheter förbehållna.</p>
          </section>

          {/* 📋 INTERAKTIV CHECKLISTA MODAL */}
          <Dialog open={showChecklistModal} onOpenChange={setShowChecklistModal}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col min-h-0">
              <div className="flex-1 min-h-0 flex flex-col">
                <div 
                  className="flex-1 overflow-y-scroll overflow-x-hidden p-6"
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    maxHeight: '80vh'
                  }}
                >
                  {/* Header med progress bar */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">📅 Din Flyttchecklista</h1>
                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                      <em>Nu när din flytt med Nordflytt är bokad kan du andas ut – det svåraste är gjort!</em>
                    </p>
                    
                    <div className="bg-gray-200 rounded-full h-4 mb-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-medium">{checkedCount}/{totalItems} steg klara</span>
                      <span className="font-bold text-lg">{progressPercentage}%</span>
                    </div>
                  </div>

                  {/* 🏠 4-6 VECKOR FÖRE FLYTT */}
                  <div className="mb-8">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800">🏠 4-6 VECKOR FÖRE FLYTT</h2>
                      <p className="text-gray-600">Viktiga kontakter och avtal</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { id: 'hyreskontrakt', icon: '🏠', title: 'Säg upp hyreskontrakt', desc: 'Uppsägningstid är oftast 3 månader' },
                        { id: 'folkbokning', icon: '🏛️', title: 'Folkbokföring', desc: 'Anmäl flyttning på skatteverket.se eller via app' },
                        { id: 'hemforsakring', icon: '💳', title: 'Hemförsäkring', desc: 'Ring din försäkring och uppdatera adressen' },
                        { id: 'barn_skola', icon: '👨‍👩‍👧‍👦', title: 'Barn och skola', desc: 'Anmäl skolbyte i god tid (om det gäller er)' }
                      ].map(item => {
                        const isChecked = checklistProgress[item.id]
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleChecklistChange(item.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isChecked 
                                ? 'bg-green-50 border-green-300 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                {isChecked ? (
                                  <CheckIcon className="w-6 h-6 text-green-500" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xl">{item.icon}</span>
                                  <h3 className={`font-medium ${isChecked ? 'text-green-800' : 'text-gray-800'}`}>
                                    {item.title}
                                  </h3>
                                </div>
                                <p className={`text-sm ${isChecked ? 'text-green-600' : 'text-gray-600'}`}>
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                    </div>
                  </div>

                  {/* 🔌 3-4 VECKOR FÖRE FLYTT */}
                  <div className="mb-8">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800">🔌 3-4 VECKOR FÖRE FLYTT</h2>
                      <p className="text-gray-600">El, internet och vardagsabonnemang</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { id: 'el', icon: '⚡', title: 'El', desc: 'Kontakta elbolag för att säkerställa ström från dag 1' },
                        { id: 'internet', icon: '📶', title: 'Internet', desc: 'Boka installation i god tid (kan ta 2-4 veckor)' },
                        { id: 'tv_bredband', icon: '📺', title: 'TV & Bredband', desc: 'Ordna överlappning så du inte blir utan' },
                        { id: 'prenumerationer', icon: '📱', title: 'Prenumerationer', desc: 'Uppdatera adress för tidningar och streaming' }
                      ].map(item => {
                        const isChecked = checklistProgress[item.id]
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleChecklistChange(item.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isChecked 
                                ? 'bg-green-50 border-green-300 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                {isChecked ? (
                                  <CheckIcon className="w-6 h-6 text-green-500" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xl">{item.icon}</span>
                                  <h3 className={`font-medium ${isChecked ? 'text-green-800' : 'text-gray-800'}`}>
                                    {item.title}
                                  </h3>
                                </div>
                                <p className={`text-sm ${isChecked ? 'text-green-600' : 'text-gray-600'}`}>
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 📮 2-3 VECKOR FÖRE FLYTT */}
                  <div className="mb-8">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800">📮 2-3 VECKOR FÖRE FLYTT</h2>
                      <p className="text-gray-600">Post, bank och packning</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { id: 'post', icon: '📮', title: 'Eftersändning av post', desc: 'Beställ via postnord.se för säker posthantering' },
                        { id: 'bank', icon: '💳', title: 'Bank och ekonomi', desc: 'Uppdatera adress hos bank och försäkringar' },
                        { id: 'borja_packa', icon: '📦', title: 'Börja packa', desc: 'Packa saker du inte använder dagligen' },
                        { id: 'parkeringstillstand', icon: '🚛', title: 'Parkeringstillstånd', desc: 'Ansök om tillstånd för flyttbil hos kommunen' },
                        { id: 'nathandel', icon: '🛒', title: 'Näthandel och leveranser', desc: 'Uppdatera leveransadresser hos webbutiker' }
                      ].map(item => {
                        const isChecked = checklistProgress[item.id]
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleChecklistChange(item.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isChecked 
                                ? 'bg-green-50 border-green-300 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                {isChecked ? (
                                  <CheckIcon className="w-6 h-6 text-green-500" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xl">{item.icon}</span>
                                  <h3 className={`font-medium ${isChecked ? 'text-green-800' : 'text-gray-800'}`}>
                                    {item.title}
                                  </h3>
                                </div>
                                <p className={`text-sm ${isChecked ? 'text-green-600' : 'text-gray-600'}`}>
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                    </div>
                  </div>

                  {/* 🏃‍♂️ 1 VECKA FÖRE FLYTT */}
                  <div className="mb-8">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800">🏃‍♂️ 1 VECKA FÖRE FLYTT</h2>
                      <p className="text-gray-600">Sista förberedelserna</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { id: 'bekrafta_nordflytt', icon: '📞', title: 'Bekräfta med Nordflytt', desc: 'Vi ringer dig dagen före för bekräftelse' },
                        { id: 'packa_klart', icon: '📦', title: 'Packa klart', desc: 'Allt ska vara packat och redo för flytt' },
                        { id: 'tomma_frysen', icon: '☕', title: 'Tömma frysen', desc: 'Förbruka mat som inte kan flyttas' },
                        { id: 'boka_hiss', icon: '🏢', title: 'Boka hiss', desc: 'Reservera hiss i både gamla och nya fastigheten' },
                        { id: 'betalning', icon: '💳', title: 'Betalning klar', desc: 'Säkerställ att betalning till Nordflytt är klar' }
                      ].map(item => {
                        const isChecked = checklistProgress[item.id]
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleChecklistChange(item.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isChecked 
                                ? 'bg-green-50 border-green-300 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                {isChecked ? (
                                  <CheckIcon className="w-6 h-6 text-green-500" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xl">{item.icon}</span>
                                  <h3 className={`font-medium ${isChecked ? 'text-green-800' : 'text-gray-800'}`}>
                                    {item.title}
                                  </h3>
                                </div>
                                <p className={`text-sm ${isChecked ? 'text-green-600' : 'text-gray-600'}`}>
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 🚛 FLYTTDAGEN */}
                  <div className="mb-8">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800">🚛 FLYTTDAGEN</h2>
                      <p className="text-gray-600">När flytten sker</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { id: 'vara_forberedd', icon: '📅', title: 'Var hemma och förberedd', desc: 'Var hemma 30 min före avtalad tid' },
                        { id: 'kontaktinfo', icon: '📞', title: 'Kontaktinfo tillgänglig', desc: 'Ha telefonnummer till oss sparade' },
                        { id: 'stora_mobler', icon: '🏠', title: 'Demontera stora möbler', desc: 'Gör det lättare för våra flyttare' },
                        { id: 'nycklar_koder', icon: '🔑', title: 'Nycklar och koder', desc: 'Ha alla nycklar och portalkoder redo' },
                        { id: 'husdjur', icon: '❤️', title: 'Husdjur i säkerhet', desc: 'Se till att husdjur är trygga under flytten' }
                      ].map(item => {
                        const isChecked = checklistProgress[item.id]
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleChecklistChange(item.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isChecked 
                                ? 'bg-green-50 border-green-300 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                {isChecked ? (
                                  <CheckIcon className="w-6 h-6 text-green-500" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xl">{item.icon}</span>
                                  <h3 className={`font-medium ${isChecked ? 'text-green-800' : 'text-gray-800'}`}>
                                    {item.title}
                                  </h3>
                                </div>
                                <p className={`text-sm ${isChecked ? 'text-green-600' : 'text-gray-600'}`}>
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                    </div>
                  </div>

                  {/* 🏡 FÖRSTA VECKAN EFTER FLYTT */}
                  <div className="mb-8">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800">🏡 FÖRSTA VECKAN EFTER FLYTT</h2>
                      <p className="text-gray-600">Avsluta det gamla och börja det nya</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { id: 'inflyttningsbesiktning', icon: '🔍', title: 'Inflyttningsbesiktning', desc: 'Dokumentera nya bostadens skick' },
                        { id: 'fixa_vaggar', icon: '🎨', title: 'Fixa väggar (gamla)', desc: 'Laga hål och repor i gamla bostaden' },
                        { id: 'mala', icon: '🎨', title: 'Måla (vid behov)', desc: 'Måla gamla bostaden om det behövs' },
                        { id: 'slutstadning', icon: '✨', title: 'Slutstädning', desc: 'Städa gamla bostaden för utflyttning' },
                        { id: 'avflyttningsbesiktning', icon: '🔍', title: 'Avflyttningsbesiktning', desc: 'Genomför besiktning med hyresvärd' },
                        { id: 'fa_tillbaka_deposition', icon: '💳', title: 'Få tillbaka deposition', desc: 'Följ upp att depositionen betalas tillbaka' },
                        { id: 'packa_upp', icon: '📦', title: 'Packa upp och inred', desc: 'Gör ditt nya hem mysigt och funktionellt' }
                      ].map(item => {
                        const isChecked = checklistProgress[item.id]
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleChecklistChange(item.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isChecked 
                                ? 'bg-green-50 border-green-300 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                {isChecked ? (
                                  <CheckIcon className="w-6 h-6 text-green-500" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xl">{item.icon}</span>
                                  <h3 className={`font-medium ${isChecked ? 'text-green-800' : 'text-gray-800'}`}>
                                    {item.title}
                                  </h3>
                                </div>
                                <p className={`text-sm ${isChecked ? 'text-green-600' : 'text-gray-600'}`}>
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      
                    </div>
                  </div>

                  {/* 🌟 INTERAKTIVA TILLÄGGSTJÄNSTER */}
                  <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="text-xl font-bold text-yellow-800 mb-4">🌟 Lägg till tilläggstjänster</h3>
                    <p className="text-yellow-700 mb-4">Klicka för att lägga till direkt i din beställning!</p>
                    
                    <div className="space-y-4">
                      {[
                        {
                          id: 'flyttstadning',
                          icon: '✨',
                          title: 'Flyttstädning',
                          description: 'Professionell slutstädning av din gamla bostad',
                          price: Math.max(PRICING_CONFIG.cleaningMinPrice, (Number(order?.details?.startLivingArea) || 70) * PRICING_CONFIG.cleaningPerSqm),
                          selected: additionalServices.flyttstadning
                        },
                        {
                          id: 'packning',
                          icon: '📦',
                          title: 'Packning & Uppackning',
                          description: 'Vi packar och packar upp dina tillhörigheter',
                          price: Math.max(PRICING_CONFIG.packingMinPrice, (Number(order?.details?.startLivingArea) || 70) * PRICING_CONFIG.packingPerSqm),
                          selected: additionalServices.packning
                        },
                        {
                          id: 'mobelmontering',
                          icon: '🏠',
                          title: 'Möbelmontering',
                          description: 'Demontering och montering av möbler',
                          price: 1200,
                          selected: additionalServices.mobelmontering
                        },
                        {
                          id: 'vaggfixning',
                          icon: '🎨',
                          title: 'Väggfixning & Målning',
                          description: 'Fixar väggar och målar efter behov',
                          price: 2200,
                          selected: additionalServices.vaggfixning
                        },
                        {
                          id: 'abonnemangsflytt',
                          icon: '📶',
                          title: 'Abonnemangsflytt',
                          description: 'Vi hjälper dig flytta el, bredband och andra avtal',
                          price: 800,
                          selected: additionalServices.abonnemangsflytt
                        }
                      ].map((service) => {
                        return (
                          <div
                            key={service.id}
                            onClick={() => handleUserClickedChecklistServiceAdd(service.id, service.price)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                              service.selected 
                                ? 'bg-green-50 border-green-300 shadow-md' 
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {service.selected ? (
                                    <CheckIcon className="w-6 h-6 text-green-500" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl">{service.icon}</span>
                                  <div>
                                    <h4 className={`font-medium ${service.selected ? 'text-green-800' : 'text-gray-800'}`}>
                                      {service.title}
                                    </h4>
                                    <p className={`text-sm ${service.selected ? 'text-green-600' : 'text-gray-600'}`}>
                                      {service.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold text-lg ${service.selected ? 'text-green-800' : 'text-gray-800'}`}>
                                  {service.price.toLocaleString('sv-SE')} kr
                                </div>
                                {service.selected && (
                                  <div className="text-xs text-green-600 font-medium">
                                    Tillagd!
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {Object.values(additionalServices).filter(Boolean).length > 0 && (
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-green-800 font-medium">
                          ✅ {Object.values(additionalServices).filter(Boolean).length} tilläggstjänst{Object.values(additionalServices).filter(Boolean).length > 1 ? 'er' : ''} tillagd{Object.values(additionalServices).filter(Boolean).length > 1 ? 'a' : ''}!
                        </p>
                        <p className="text-green-600 text-sm">Tjänsterna har lagts till i din beställning och priset uppdateras automatiskt.</p>
                      </div>
                    )}
                  </div>

                  {/* 💡 SMARTA TIPS */}
                  <div className="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h3 className="text-xl font-bold text-indigo-800 mb-4">💡 SMARTA TIPS</h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-lg border border-indigo-100">
                        <h4 className="font-medium text-indigo-900 mb-2">📦 Packningsråd</h4>
                        <p className="text-sm text-indigo-700">
                          Packa tyngre saker i små kartonger och lätta saker i stora. Märk tydligt vilken rum kartongerna ska till.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white rounded-lg border border-indigo-100">
                        <h4 className="font-medium text-indigo-900 mb-2">🔍 Besiktningsråd</h4>
                        <p className="text-sm text-indigo-700">
                          Ta foton under både in- och utflyttningsbesiktning. Detta skyddar dig om det uppstår tvister om skador.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white rounded-lg border border-indigo-100">
                        <h4 className="font-medium text-indigo-900 mb-2">🤝 Samarbetsråd</h4>
                        <p className="text-sm text-indigo-700">
                          Var hemma och tillgänglig på flyttdagen. Ju bättre vi kan samarbeta, desto smidigare blir flytten för alla.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Completion meddelande */}
                  {progressPercentage === 100 && (
                    <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-center">
                        <CheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 Grattis!</h3>
                        <p className="text-green-700 text-lg">
                          Du har bockat av alla punkter i checklistan. Du är redo för flytten!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stäng knapp */}
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setShowChecklistModal(false)}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                    >
                      Stäng checklista
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Contact Modal */}
          <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
            <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Kontakta oss</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-[#F5F9FF] rounded-lg">
                  <h3 className="font-medium mb-2">Din kontaktperson</h3>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
                      <UserIcon className="w-6 h-6 text-[#4CAF50]" />
                    </div>
                    <div>
                      <p className="font-medium">Henrik</p>
                      <p className="text-sm text-gray-600">Flyttkoordinator</p>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-[#4CAF50] hover:bg-[#388E3C]"
                    asChild
                  >
                    <a href="tel:010-555 12 89">
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      Ring Henrik
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Modal */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="max-w-[600px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Ändra din bokning</DialogTitle>
                <DialogDescription>
                  Välj vad du vill ändra i din bokning. Vissa ändringar kan påverka priset.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ändra datum och tid */}
                  <button 
                    onClick={(e) => {
                      console.log('🔴 Datum knapp klickad');
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDateModal(true);
                    }}
                    className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                        <CalendarIcon className="w-5 h-5 text-[#002A5C]" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Datum & Tid</span>
                        <p className="text-sm text-gray-600">Ändra flyttdatum eller tid</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                  </button>

                  {/* Ändra adresser */}
                  <button 
                    onClick={(e) => {
                      console.log('🔴 "Ändra adresser" knapp klickad');
                      console.log('🔴 Setting showAddressModal to TRUE');
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAddressModal(true);
                      console.log('🔴 showAddressModal should now be TRUE');
                    }}
                    className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                        <HomeIcon className="w-5 h-5 text-[#002A5C]" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Adresser</span>
                        <p className="text-sm text-gray-600">Ändra från- eller till-adress</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                  </button>

                  {/* Ändra volym */}
                  <button 
                    onClick={(e) => {
                      console.log('🔴 Volym knapp klickad');
                      e.preventDefault();
                      e.stopPropagation();
                      setShowVolumeModal(true);
                    }}
                    className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                        <PackageIcon className="w-5 h-5 text-[#002A5C]" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Volym</span>
                        <p className="text-sm text-gray-600">Ändra antal kubikmeter</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                  </button>

                  {/* Lägg till tjänster */}
                  <button 
                    onClick={(e) => {
                      console.log('🔴 Tjänster knapp klickad');
                      e.preventDefault();
                      e.stopPropagation();
                      setShowServicesModal(true);
                    }}
                    className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                        <TruckIcon className="w-5 h-5 text-[#002A5C]" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Tjänster</span>
                        <p className="text-sm text-gray-600">Lägg till eller ta bort tjänster</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                  </button>
                </div>

                <div className="border-t pt-4 mt-6">
                  <button 
                    onClick={() => setShowCancelConfirmModal(true)}
                    className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    Avboka flytten
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Date Modal */}
          <Dialog open={showDateModal} onOpenChange={setShowDateModal}>
            <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Ändra datum och tid</DialogTitle>
                <DialogDescription>
                  Välj nytt datum och tid för din flytt.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nytt datum</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ny tid</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                  >
                    <option value="">Välj tid</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowDateModal(false)} className="flex-1">
                    Avbryt
                  </Button>
                  <Button onClick={handleUserClickedDateTimeSave} disabled={!newDate || !newTime} className="flex-1">
                    Spara ändringar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

         {/* Enhanced Address Modal - Ersätt din befintliga Address Modal (rad 1850-1950) */}
         <Dialog 
            open={showAddressModal} 
            onOpenChange={(open) => {
              // Force overflow visible när modal öppnas
              if (open) {
                setTimeout(() => {
                  // Hitta alla dialog elements och sätt overflow visible
                  document.querySelectorAll('[role="dialog"], [data-radix-dialog-content], [data-radix-portal]').forEach(el => {
                    (el as HTMLElement).style.setProperty('overflow', 'visible', 'important');
                    console.log('🔧 Set overflow:visible on:', el.className || el.tagName);
                  });
                  
                  // Hitta dialog overlay och content
                  const dialogContent = document.querySelector('[data-radix-dialog-content]');
                  const dialogOverlay = document.querySelector('[data-radix-dialog-overlay]');
                  
                  if (dialogContent) {
                    (dialogContent as HTMLElement).style.setProperty('overflow', 'visible', 'important');
                    // Lägg till en klass för CSS styling
                    dialogContent.classList.add('address-modal-overflow-fix');
                  }
                  
                  if (dialogOverlay) {
                    (dialogOverlay as HTMLElement).style.setProperty('pointer-events', 'auto', 'important');
                  }
                }, 100);
              }
              
              // Förhindra stängning när autocomplete dropdowns klickas
              const pacContainer = document.querySelector('.pac-container');
              const customDropdowns = document.querySelectorAll('.custom-autocomplete-dropdown');
              
              // Kolla Google Maps PAC container
              if (!open && pacContainer && (pacContainer.matches(':hover') || pacContainer.querySelector(':hover'))) {
                console.log('🚫 Preventing modal close - Google Maps autocomplete is active');
                return;
              }
              
              // Kolla våra custom autocomplete dropdowns
              let customDropdownActive = false;
              customDropdowns.forEach(dropdown => {
                if (dropdown.matches(':hover') || dropdown.querySelector(':hover')) {
                  customDropdownActive = true;
                }
              });
              
              if (!open && customDropdownActive) {
                console.log('🚫 Preventing modal close - custom autocomplete dropdown is active');
                return;
              }
              
              // Extra säkerhet: Kolla om autocomplete click pågår
              if (!open && (window as any).autocompleteClickInProgress) {
                console.log('🚫 Preventing modal close - autocomplete click in progress');
                return;
              }
              console.log('📝 Address modal state changing to:', open);
              setShowAddressModal(open);
              
              // SÄKERHET: Reset states när modal stängs
              if (!open) {
                console.log('🔄 Reset states när modal stängs');
                setAllowApiCall(false);
                setIsSaving(false);
                setSaveSuccess(false);
                setShowConfirmationStep(false);
                setPreviewData(null);
              }
              
              // Rensa autocomplete-flaggor när modal stängs
              if (!open) {
                setTimeout(() => {
                  if (startAddressInputRef.current) {
                    startAddressInputRef.current.removeAttribute('data-autocomplete-init');
                  }
                  if (endAddressInputRef.current) {
                    endAddressInputRef.current.removeAttribute('data-autocomplete-init');
                  }
                }, 100);
              }
            }}
          >
            <DialogContent className="max-w-[600px] max-h-[80vh] rounded-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ändra adresser</DialogTitle>
                <DialogDescription>
                  Uppdatera från- eller till-adress för din flytt. Priset beräknas automatiskt baserat på nya avståndet.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                console.log('🚨🚨🚨 ADDRESS FORM SUBMIT BLOCKED!');
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}>
                <div className="space-y-4 p-4">
                {/* Från adress med Google Maps autocomplete */}
                <div>
                  <label className="block text-sm font-medium mb-2">Från adress</label>
                  <div className="relative">
                    <input
                      ref={startAddressInputRef}
                      type="text"
                      value={newStartAddress}
                      onChange={(e) => {
                        console.log('📝 🔥 MANUAL START ADDRESS INPUT:', e.target.value);
                        console.trace('🔍 WHO TRIGGERED MANUAL START ADDRESS CHANGE?');
                        setNewStartAddress(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          console.log('🚨🚨🚨 ENTER PRESSED IN START ADDRESS - BLOCKING!');
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                      placeholder={order?.address}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                    />
                    {isCalculatingDistance && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#002A5C]"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Våning</label>
                    <input
                      type="text"
                      value={newStartFloor}
                      onChange={(e) => {
                        console.log('📝 Start floor changed:', e.target.value);
                        setNewStartFloor(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          console.log('🚨 ENTER PRESSED IN START FLOOR - BLOCKING!');
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      placeholder="ex. 2"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hiss</label>
                    <select
                      value={newStartElevator}
                      onChange={(e) => {
                        console.log('📝 Start elevator changed:', e.target.value);
                        setNewStartElevator(e.target.value as 'big' | 'small' | 'none');
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                    >
                      <option value="none">Ingen hiss</option>
                      <option value="small">Liten hiss</option>
                      <option value="big">Stor hiss</option>
                    </select>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2">Till adress</label>
                  <div className="relative">
                    <input
                      ref={endAddressInputRef}
                      type="text"
                      value={newEndAddress}
                      onChange={(e) => {
                        console.log('📝 🔥 MANUAL END ADDRESS INPUT:', e.target.value);
                        console.trace('🔍 WHO TRIGGERED MANUAL END ADDRESS CHANGE?');
                        setNewEndAddress(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          console.log('🚨🚨🚨 ENTER PRESSED IN END ADDRESS - BLOCKING!');
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                      placeholder={order?.address_to}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                    />
                    {isCalculatingDistance && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#002A5C]"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Våning</label>
                    <input
                      type="text"
                      value={newEndFloor}
                      onChange={(e) => {
                        console.log('📝 End floor changed:', e.target.value);
                        setNewEndFloor(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          console.log('🚨 ENTER PRESSED IN END FLOOR - BLOCKING!');
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      placeholder="ex. 1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hiss</label>
                    <select
                      value={newEndElevator}
                      onChange={(e) => {
                        console.log('📝 End elevator changed:', e.target.value);
                        setNewEndElevator(e.target.value as 'big' | 'small' | 'none');
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                    >
                      <option value="none">Ingen hiss</option>
                      <option value="small">Liten hiss</option>
                      <option value="big">Stor hiss</option>
                    </select>
                  </div>
                </div>

                {/* Distance & Price Calculation Results */}
                {calculatedDistance && (
                  <div className="mt-4 p-4 bg-[#F5F9FF] rounded-lg border">
                    <h4 className="font-medium mb-2">Beräknad information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avstånd:</span>
                        <span>{calculatedDistance} km</span>
                      </div>
                      {newCalculatedPrice && (
                        <>
                          <div className="flex justify-between">
                            <span>Nuvarande pris:</span>
                            <span>{order?.totalPrice?.toLocaleString('sv-SE')} kr</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Nytt pris:</span>
                            <span className={newCalculatedPrice > (order?.totalPrice || 0) ? 'text-red-600' : 'text-green-600'}>
                              {newCalculatedPrice.toLocaleString('sv-SE')} kr
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Prisändring:</span>
                            <span className={newCalculatedPrice > (order?.totalPrice || 0) ? 'text-red-600' : 'text-green-600'}>
                              {newCalculatedPrice > (order?.totalPrice || 0) ? '+' : ''}{(newCalculatedPrice - (order?.totalPrice || 0)).toLocaleString('sv-SE')} kr
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Price Warning */}
                {newCalculatedPrice && newCalculatedPrice > (order?.totalPrice || 0) + 500 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <InfoIcon className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Prisökning</h4>
                        <p className="text-sm text-yellow-700">
                          Den nya sträckan medför en prisökning på {(newCalculatedPrice - (order?.totalPrice || 0)).toLocaleString('sv-SE')} kr. 
                          Vill du fortsätta med ändringen?
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowAddressModal(false)} className="flex-1">
                    Avbryt
                  </Button>
                  <Button 
                    onClick={handleCalculateAndPreview} 
                    disabled={!newStartAddress || !newEndAddress || isCalculatingDistance || showConfirmationStep} 
                    className="flex-1"
                  >
                    {isCalculatingDistance ? 'Beräknar pris...' : 'Beräkna ändringar'}
                  </Button>
                </div>
                
                {/* BEKRÄFTELSE-STEG */}
                {showConfirmationStep && previewData && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      Bekräfta ändringar
                    </h3>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Från:</span> {previewData.newStartAddress}
                      </div>
                      <div>
                        <span className="font-medium">Till:</span> {previewData.newEndAddress}
                      </div>
                      <div>
                        <span className="font-medium">Avstånd:</span> {previewData.distance} km
                      </div>
                      
                      <div className="border-t border-blue-200 pt-3">
                        <div className="flex justify-between">
                          <span>Nuvarande pris:</span>
                          <span>{previewData.oldPrice.toLocaleString('sv-SE')} kr</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Nytt pris:</span>
                          <span className={previewData.priceChange >= 0 ? 'text-orange-600' : 'text-green-600'}>
                            {previewData.newPrice.toLocaleString('sv-SE')} kr
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {previewData.priceChange >= 0 ? '+' : ''}{previewData.priceChange.toLocaleString('sv-SE')} kr förändring
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowConfirmationStep(false)}
                        className="flex-1"
                      >
                        Ångra
                      </Button>
                      <Button 
                        onClick={handleConfirmAndSave}
                        disabled={isSaving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isSaving ? 'Sparar...' : saveSuccess ? '✅ Sparat!' : 'Godkänn ändringarna'}
                      </Button>
                    </div>
                  </div>
                )}
                
                </div>
              </form>
            </DialogContent>
          </Dialog>
          {/* Volume Modal */}
          <Dialog open={showVolumeModal} onOpenChange={setShowVolumeModal}>
            <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Ändra volym</DialogTitle>
                <DialogDescription>
                  Justera antalet kubikmeter för din flytt. Priset kommer att uppdateras automatiskt.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nuvarande volym</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{order?.moveSize} m³</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ny volym (m³)</label>
                  <input
                    type="number"
                    value={newVolume}
                    onChange={handleVolumeInputChange}
                    min="1"
                    max="200"
                    placeholder="ex. 25"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
                  />
                </div>
                {newPrice && (
                  <div className="p-4 bg-[#F5F9FF] rounded-lg">
                    <div className="flex justify-between items-center">
                      <span>Nuvarande pris:</span>
                      <span>{order?.totalPrice?.toLocaleString('sv-SE')} kr</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-[#002A5C]">
                      <span>Nytt pris:</span>
                      <span>{newPrice.toLocaleString('sv-SE')} kr</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Skillnad:</span>
                      <span className={newPrice > (order?.totalPrice || 0) ? 'text-red-600' : 'text-green-600'}>
                        {newPrice > (order?.totalPrice || 0) ? '+' : ''}{(newPrice - (order?.totalPrice || 0)).toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowVolumeModal(false)} className="flex-1">
                    Avbryt
                  </Button>
                  <Button onClick={handleUserClickedVolumeSave} disabled={!newVolume || !newPrice} className="flex-1">
                    Uppdatera volym
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Services Modal */}
          <Dialog open={showServicesModal} onOpenChange={setShowServicesModal}>
            <DialogContent className="max-w-[500px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Hantera tjänster</DialogTitle>
                <DialogDescription>
                  Lägg till eller ta bort tjänster från din bokning.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div className="space-y-3">
                  {/* Packning */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <PackageIcon className="w-5 h-5 text-[#002A5C] mr-3" />
                      <div>
                        <span className="font-medium">Packning</span>
                        <p className="text-sm text-gray-600">{livingArea} m² - {servicePrice.toLocaleString('sv-SE')} kr</p>
                      </div>
                    </div>
                    <Button
                      variant={order?.serviceTypes?.includes('packing') ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleUserClickedServiceSave('packing')}
                    >
                      {order?.serviceTypes?.includes('packing') ? 'Ta bort' : 'Lägg till'}
                    </Button>
                  </div>

                  {/* Städning */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <BroomIcon className="w-5 h-5 text-[#002A5C] mr-3" />
                      <div>
                        <span className="font-medium">Flyttstädning</span>
                        <p className="text-sm text-gray-600">{livingArea} m² - {servicePrice.toLocaleString('sv-SE')} kr</p>
                      </div>
                    </div>
                    <Button
                      variant={order?.serviceTypes?.includes('cleaning') ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleUserClickedServiceSave('cleaning')}
                    >
                      {order?.serviceTypes?.includes('cleaning') ? 'Ta bort' : 'Lägg till'}
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Totalt pris:</span>
                    <span>{order?.totalPrice?.toLocaleString('sv-SE')} kr</span>
                  </div>
                </div>
                
                <Button variant="outline" onClick={() => setShowServicesModal(false)} className="w-full">
                  Stäng
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cancel Confirmation Modal */}
          <Dialog open={showCancelConfirmModal} onOpenChange={setShowCancelConfirmModal}>
            <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Avboka flytten</DialogTitle>
                <DialogDescription>
                  Är du säker på att du vill avboka din flytt? Denna åtgärd kan inte ångras.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2">Avbokningsvillkor</h3>
                  <p className="text-sm text-yellow-700">
                    {order && (() => {
                      const moveDate = new Date(order.moveDate || "");
                      const now = new Date();
                      const hoursDifference = (moveDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                      const isFreeCancel = hoursDifference >= 24;
                      
                      return isFreeCancel 
                        ? "Avbokning mer än 24 timmar före flytten är kostnadsfri."
                        : `Avbokning mindre än 24 timmar före flytten debiteras 50% av totalpriset (${Math.round((order.totalPrice || 0) * 0.5).toLocaleString('sv-SE')} kr).`;
                    })()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Anledning till avbokning (valfritt)</label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Berätta gärna varför du avbokar..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002A5C] focus:border-transparent h-20 resize-none"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowCancelConfirmModal(false)} className="flex-1">
                    Behåll bokningen
                  </Button>
                  <Button variant="destructive" onClick={handleCancelBooking} className="flex-1">
                    Avboka flytten
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Calendar Modal */}
          <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
            <DialogContent className="max-w-[400px] md:max-w-[500px] rounded-lg">
              <DialogHeader>
                <DialogTitle>Lägg till i kalender</DialogTitle>
                <DialogDescription>
                  Välj hur du vill lägga till din flyttbokning i din kalender.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div className="space-y-4">
                  {/* Google Calendar */}
                  <a
                    href={generateCalendarLinks().google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                        <CalendarIcon className="w-5 h-5 text-[#002A5C]" />
                      </div>
                      <span>Google Calendar</span>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                  </a>

                  {/* Apple/Outlook Calendar */}
                  <a
                    href={generateCalendarLinks().outlook}
                    className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-[#002A5C] hover:shadow-md transition-all cursor-pointer group"
                    download="nordflytt-flyttbokning.ics"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center mr-3 group-hover:bg-[#002A5C]/10">
                        <CalendarIcon className="w-5 h-5 text-[#002A5C]" />
                      </div>
                      <span>Apple/Outlook Calendar</span>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-[#002A5C]" />
                  </a>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Kalenderhändelsen innehåller all viktig information om din flytt.
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 📷 DOKUMENTATION MODAL */}
          <Dialog open={showPhotosModal} onOpenChange={setShowPhotosModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Dokumentation från flytten</DialogTitle>
                <DialogDescription>
                  Bilder tagna av flyttpersonal och städpersonal under uppdraget
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 p-4">
                {isLoadingPhotos ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Flyttpersonalens bilder */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <TruckIcon className="w-5 h-5 mr-2" />
                        Flyttpersonalens dokumentation
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {jobPhotos.moving.length > 0 ? (
                          jobPhotos.moving.map((photo: any) => (
                            <div
                              key={photo.id}
                              className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <img
                                src={photo.file?.publicUrl || photo.file?.public_url}
                                alt={photo.caption || 'Flyttfoto'}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                  </svg>
                                </div>
                              </div>
                              {photo.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <p className="text-white text-sm truncate">{photo.caption}</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-gray-400 text-sm text-center p-4">Inga bilder från flyttpersonalen ännu</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Städpersonalens bilder */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <HomeIcon className="w-5 h-5 mr-2" />
                        Städpersonalens dokumentation
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {jobPhotos.cleaning.length > 0 ? (
                          jobPhotos.cleaning.map((photo: any) => (
                            <div
                              key={photo.id}
                              className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <img
                                src={photo.file?.publicUrl || photo.file?.public_url}
                                alt={photo.caption || 'Städfoto'}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                  </svg>
                                </div>
                              </div>
                              {photo.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <p className="text-white text-sm truncate">{photo.caption}</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-gray-400 text-sm text-center p-4">Inga bilder från städpersonalen ännu</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info om när bilder kommer */}
                    {jobPhotos.moving.length === 0 && jobPhotos.cleaning.length === 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          💡 Bilder från flytt- och städpersonal blir tillgängliga här efter att tjänsterna har utförts.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end p-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => setShowPhotosModal(false)}
                >
                  Stäng
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* 🖼️ BILDFÖRSTORING MODAL */}
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
              {selectedPhoto && (
                <div className="relative bg-black">
                  {/* Stäng-knapp */}
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20 transition-colors"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                  
                  {/* Bild */}
                  <div className="flex items-center justify-center min-h-[60vh] p-4">
                    <img
                      src={selectedPhoto.file?.publicUrl || selectedPhoto.file?.public_url}
                      alt={selectedPhoto.caption || 'Förstoring'}
                      className="max-w-full max-h-[85vh] object-contain"
                    />
                  </div>
                  
                  {/* Information */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white p-6">
                    <div className="max-w-3xl mx-auto space-y-2">
                      {selectedPhoto.caption && (
                        <h3 className="text-xl font-semibold">{selectedPhoto.caption}</h3>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {selectedPhoto.photoType && (
                          <div>
                            <span className="opacity-70">Typ:</span>{' '}
                            <span className="font-medium">
                              {selectedPhoto.photoType === 'before' && 'Före'}
                              {selectedPhoto.photoType === 'during' && 'Under'}
                              {selectedPhoto.photoType === 'after' && 'Efter'}
                              {selectedPhoto.photoType === 'cleaning_before' && 'Före städning'}
                              {selectedPhoto.photoType === 'cleaning_after' && 'Efter städning'}
                            </span>
                          </div>
                        )}
                        {selectedPhoto.location && (
                          <div>
                            <span className="opacity-70">Plats:</span>{' '}
                            <span className="font-medium">{selectedPhoto.location}</span>
                          </div>
                        )}
                        {selectedPhoto.uploadedBy && (
                          <div>
                            <span className="opacity-70">Tagen av:</span>{' '}
                            <span className="font-medium">{selectedPhoto.uploadedBy.name}</span>
                          </div>
                        )}
                        {selectedPhoto.takenAt && (
                          <div>
                            <span className="opacity-70">Tidpunkt:</span>{' '}
                            <span className="font-medium">
                              {format(new Date(selectedPhoto.takenAt), 'PPpp', { locale: sv })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </div>

        {/* Sticky-bottom på mobil */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] p-3 z-40 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-[#4F4F4F]">Totalt pris:</p>
                <p className="font-bold text-lg">{order?.totalPrice?.toLocaleString('sv-SE')} kr</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 border-[#002A5C] text-[#002A5C]"
                  onClick={() => window.print()}
                  aria-label="Ladda ner bekräftelse"
                >
                  <DownloadIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                  Bekräftelse
                </Button>
                <Button
                  className="h-10 bg-[#4CAF50] hover:bg-[#388E3C]"
                  asChild
                >
                  <a href="tel:010-555 12 89">
                    <MessageCircleIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                    Chatta
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Maja AI Chatbot - Orderbekräftelse-specifik kontext */}
        {order && (
          <ChatWidget 
              initialMessage={`Hej! 👋 Jag ser att du just har bekräftat din bokning för flytten från ${order?.details?.startAddress || order?.address || 'din nuvarande adress'} till ${order?.details?.endAddress || order?.address_to || 'din nya adress'} den ${order?.moveDate ? format(new Date(order.moveDate), 'd MMMM', { locale: sv }) : 'valda datumet'}.

Grattis till din bekräftade flytt! 🎉

Jag kan hjälpa dig med:
• Frågor om din bokning och vad som ingår
• Information om förberedelser inför flytten
• Tips för en smidig flyttdag
• Ändra eller komplettera din bokning
• Kontaktuppgifter till vårt team

Vad kan jag hjälpa dig med?`}
            />
        )}
        </div>
      </div>
    )
  }

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C]"></div>
      </div>
    }>
      <OrderConfirmationPageInner />
    </Suspense>
  )
}
"use client"

import { useState, useEffect } from "react"
import type { FormData } from "@/types/formData"
import { BankIDAuth } from "@/components/BankIDAuth"
import { CreditCheckResult } from "@/components/CreditCheckResult"
import { SwishPayment } from "@/components/SwishPayment"
import { useCreditCheck } from "@/hooks/useCreditCheck"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, CreditCard } from "lucide-react"
import { ButtonLoadingSpinner } from "@/components/ui/loading-spinner"

interface Step4Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  prevStep: () => void
  handleSubmit: () => void
  isSubmitting?: boolean
}

export default function Step4SummaryWithCreditCheck({ formData, updateFormData, prevStep, handleSubmit, isSubmitting = false }: Step4Props) {
  const { customerType, customerInfo, moveDetails, services, additionalServices, totalPrice } = formData
  const selectedAdditionalServices = additionalServices.filter((service) => service.selected)
  
  const [personalNumber, setPersonalNumber] = useState("")
  const [showCreditCheck, setShowCreditCheck] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"invoice" | "direct" | "swish" | null>(null)
  const [acceptedDeposit, setAcceptedDeposit] = useState(false)
  const [showSwishPayment, setShowSwishPayment] = useState(false)
  const [bookingReference, setBookingReference] = useState("")
  
  const {
    state: creditCheckState,
    personalNumber: authenticatedPN,
    startCreditCheck,
    handleAuthSuccess,
    handleAuthError,
    handleAuthCancel,
    reset: resetCreditCheck,
  } = useCreditCheck()

  // Handle booking button click - now starts credit check immediately for private customers
  const handleBookingClick = () => {
    if (customerType === "business") {
      // Business customers don't need credit check
      updateFormData({ paymentMethod: "invoice" })
      handleSubmit()
    } else {
      // Private customers - start credit check immediately if invoice payment
      // Default to invoice payment for seamless experience
      setPaymentMethod("invoice")
      setShowCreditCheck(true)
      // Auto-start credit check with a default personal number format
      // User will be prompted to authenticate with BankID
      setTimeout(() => {
        startCreditCheck(personalNumber || "")
      }, 100)
    }
  }

  // Handle payment method selection
  const handlePaymentMethodSelection = (method: "invoice" | "direct") => {
    setPaymentMethod(method)
    if (method === "direct") {
      // Direct payment doesn't require credit check
      updateFormData({ paymentMethod: "direct" })
      handleSubmit()
    }
  }

  // Format personal number
  const formatPersonalNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length > 8) {
      return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}`
    }
    return cleaned
  }

  // Handle credit check completion - always continue to confirmation
  const handleCreditCheckComplete = () => {
    if (creditCheckState.result?.status === "approved") {
      updateFormData({ 
        paymentMethod: "invoice",
        creditCheckId: creditCheckState.result.checkId,
        personalNumber: authenticatedPN,
        creditCheckStatus: "approved"
      })
    } else if (creditCheckState.result?.status === "rejected") {
      // Automatically switch to Swish prepayment on rejection
      updateFormData({ 
        paymentMethod: "swish_prepayment",
        creditCheckId: creditCheckState.result.checkId,
        personalNumber: authenticatedPN,
        creditCheckStatus: "rejected",
        creditCheckReason: creditCheckState.result.rejectReason
      })
    }
    // Always proceed to submit
    handleSubmit()
  }

  // Handle deposit acceptance
  const handleAcceptDeposit = () => {
    setAcceptedDeposit(true)
    updateFormData({ 
      paymentMethod: "invoice_with_deposit",
      depositAmount: creditCheckState.result?.depositAmount,
      creditCheckId: creditCheckState.result?.checkId,
      personalNumber: authenticatedPN,
    })
    handleSubmit()
  }

  // Handle alternative payment selection
  const handleAlternativePayment = (option: any) => {
    if (option.type === "direct_payment") {
      updateFormData({ paymentMethod: "direct" })
      handleSubmit()
    } else if (option.type === "swish") {
      setPaymentMethod("swish")
      setShowSwishPayment(true)
      // Generate booking reference
      const ref = `NF${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      setBookingReference(ref)
      updateFormData({ 
        paymentMethod: "swish_prepayment",
        bookingReference: ref
      })
    } else if (option.type === "contact") {
      // Show contact information
      alert("Ring oss på 08-123 456 78 för att diskutera betalningsalternativ")
    }
  }

  // Handle Swish payment completion
  const handleSwishPaymentComplete = (paymentId: string) => {
    updateFormData({ 
      paymentMethod: "swish_prepayment",
      swishPaymentId: paymentId,
      paymentStatus: "prepaid"
    })
    handleSubmit()
  }

  // Auto-proceed when credit check is complete
  useEffect(() => {
    if (creditCheckState.status === "complete" && creditCheckState.result) {
      // Auto-proceed after a brief delay to show the result
      const timer = setTimeout(() => {
        handleCreditCheckComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [creditCheckState.status, creditCheckState.result])

  // If showing credit check flow
  if (showCreditCheck) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Välj betalningsmetod</h2>

        {/* Payment method selection */}
        {!paymentMethod && creditCheckState.status === "idle" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handlePaymentMethodSelection("invoice")}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Faktura
                </CardTitle>
                <CardDescription>
                  Betala efter genomförd flytt med 30 dagars betalningsvillkor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Kräver godkänd kreditprövning
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handlePaymentMethodSelection("direct")}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Direktbetalning
                </CardTitle>
                <CardDescription>
                  Betala direkt med kort eller Swish
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ingen kreditprövning krävs
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Skip personal number input - go directly to BankID */}
        {paymentMethod === "invoice" && creditCheckState.status === "idle" && (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Startar BankID...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BankID authentication */}
        {creditCheckState.status === "authenticating" && (
          <BankIDAuth
            personalNumber={personalNumber}
            onSuccess={handleAuthSuccess}
            onError={handleAuthError}
            onCancel={handleAuthCancel}
          />
        )}

        {/* Credit check in progress */}
        {creditCheckState.status === "checking" && (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Genomför kreditprövning...</p>
                <p className="text-sm text-muted-foreground">Detta tar bara några sekunder</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credit check result - auto-proceed after completion */}
        {creditCheckState.status === "complete" && creditCheckState.result && !showSwishPayment && (
          <>
            {/* Show brief result before auto-proceeding */}
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-lg font-medium">
                    {creditCheckState.result.status === "approved" 
                      ? "Kreditprövning godkänd! Slutför din bokning..."
                      : "Förbereder alternativ betalning..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Swish payment */}
        {showSwishPayment && (
          <SwishPayment
            amount={totalPrice}
            bookingReference={bookingReference}
            customerPhone={customerInfo.phone}
            onPaymentComplete={handleSwishPaymentComplete}
            onCancel={() => {
              setShowSwishPayment(false)
              setPaymentMethod(null)
            }}
          />
        )}

        {/* Error state */}
        {creditCheckState.status === "error" && (
          <Alert variant="destructive">
            <AlertDescription>
              {creditCheckState.error || "Ett fel uppstod. Försök igen."}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Original summary view
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Sammanfattning</h2>

      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Kunduppgifter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Kundtyp</p>
              <p className="font-medium">{customerType === "private" ? "Privatperson" : "Företag"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Namn</p>
              <p className="font-medium">{customerInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">E-post</p>
              <p className="font-medium">{customerInfo.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefon</p>
              <p className="font-medium">{customerInfo.phone}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Flyttinformation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Typ av flytt</p>
              <p className="font-medium">
                {moveDetails.moveType === "local"
                  ? "Lokalflytt"
                  : moveDetails.moveType === "distance"
                    ? "Distansflytt"
                    : "Utlandsflytt"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Storlek</p>
              <p className="font-medium">
                {moveDetails.moveSize === "small"
                  ? "Liten bostad"
                  : moveDetails.moveSize === "medium"
                    ? "Mellanstor bostad"
                    : moveDetails.moveSize === "large"
                      ? "Stor bostad"
                      : "Kontor"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Från-adress</p>
              <p className="font-medium">{moveDetails.startAddress}</p>
              <p className="text-xs text-gray-500">
                Våning: {moveDetails.floors.start === 0 ? "Bottenvåning" : `${moveDetails.floors.start}:a våningen`}
                {moveDetails.elevator.start ? ", Hiss finns" : ", Ingen hiss"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Till-adress</p>
              <p className="font-medium">{moveDetails.endAddress}</p>
              <p className="text-xs text-gray-500">
                Våning: {moveDetails.floors.end === 0 ? "Bottenvåning" : `${moveDetails.floors.end}:a våningen`}
                {moveDetails.elevator.end ? ", Hiss finns" : ", Ingen hiss"}
              </p>
            </div>
            {moveDetails.moveDate && (
              <div>
                <p className="text-sm text-gray-500">Önskat flyttdatum</p>
                <p className="font-medium">{new Date(moveDetails.moveDate).toLocaleDateString("sv-SE")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Tjänster</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">Flyttjänst</p>
                <p className="text-sm text-gray-500">
                  {moveDetails.moveType === "local"
                    ? "Lokalflytt"
                    : moveDetails.moveType === "distance"
                      ? "Distansflytt"
                      : "Utlandsflytt"}
                  {" - "}
                  {moveDetails.moveSize === "small"
                    ? "Liten bostad"
                    : moveDetails.moveSize === "medium"
                      ? "Mellanstor bostad"
                      : moveDetails.moveSize === "large"
                        ? "Stor bostad"
                        : "Kontor"}
                </p>
              </div>
              <p className="font-medium">
                {totalPrice - selectedAdditionalServices.reduce((sum, service) => sum + service.price, 0)} kr
              </p>
            </div>

            {selectedAdditionalServices.map((service) => (
              <div key={service.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{service.name}</p>
                </div>
                <p className="font-medium">{service.price} kr</p>
              </div>
            ))}

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <p className="font-medium">Totalt</p>
                <p className="text-xl font-bold">{totalPrice} kr</p>
              </div>
              <p className="text-sm text-gray-500">Inkl. moms och försäkring</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Vad händer nu?</h3>
          <p className="text-blue-700">
            När du klickar på "Boka flytthjälp" kommer du att få välja betalningsmetod. 
            {customerType === "private" && " För faktura krävs en snabb kreditprövning med BankID."}
          </p>
        </div>
      </div>

      <div className="step-form-navigation">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 min-h-[44px] min-w-[100px]"
          disabled={isSubmitting}
        >
          Tillbaka
        </button>
        <button 
          onClick={handleBookingClick} 
          className="next-button min-h-[44px] min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          disabled={isSubmitting}
        >
          <ButtonLoadingSpinner loading={isSubmitting} loadingText="Behandlar...">
            Boka flytthjälp
          </ButtonLoadingSpinner>
        </button>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Offer, Service } from "@/types/offer"

export function OfferDetails({ offer }: { offer: Offer }) {
  const [isBooked, setIsBooked] = useState(false)

  const handleBooking = async () => {
    // TODO: Implement booking logic
    setIsBooked(true)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Hej {offer.customerName},</CardTitle>
        <CardDescription>Här är din offert baserad på din förfrågan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Valda tjänster:</h3>
          <ul className="list-disc list-inside">
            {offer.services.map((service: Service) => (
              <li key={service.name}>{service.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Prisuppdelning:</h3>
          {offer.services.map((service: Service) => (
            <p key={service.name}>
              {service.name}: {service.price} kr
            </p>
          ))}
          <p className="font-bold mt-2">Totalpris: {offer.totalPrice} kr efter RUT-avdrag</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Tidsuppskattning och personalallokering:</h3>
          {offer.timeline.map((item, index) => (
            <p key={index}>
              {item.service}: {item.startTime}–{item.endTime} ({item.personnel} {item.personnelType})
            </p>
          ))}
          <p className="mt-2">
            Total tid för flytten: {offer.totalTime} timmar med {offer.totalPersonnel} personal
          </p>
          <p>Förväntad sluttid: {offer.expectedEndTime}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleBooking} disabled={isBooked} className="w-full">
          {isBooked ? "Bokning bekräftad" : "Boka din flytt/städning nu"}
        </Button>
      </CardFooter>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Customer, CRMOffer } from "@/types/crm"

interface CustomerDetailsProps {
  customerId: string
}

export function CustomerDetails({ customerId }: CustomerDetailsProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [offers, setOffers] = useState<CRMOffer[]>([])

  useEffect(() => {
    // Fetch customer details and offers
    // This is a mock implementation
    const mockCustomer: Customer = {
      id: customerId,
      name: "John Doe",
      email: "john@example.com",
      phone: "0701234567",
      offerStatus: "Skickad",
    }
    const mockOffers: CRMOffer[] = [
      { id: "1", customerName: "John Doe", sentDate: "2023-05-01", status: "Öppnad", bookingDate: null },
      { id: "2", customerName: "John Doe", sentDate: "2023-05-10", status: "Bokad", bookingDate: "2023-05-12" },
    ]
    setCustomer(mockCustomer)
    setOffers(mockOffers)
  }, [customerId])

  if (!customer) {
    return <div>Laddar kunduppgifter...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kunduppgifter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Namn:</p>
              <p>{customer.name}</p>
            </div>
            <div>
              <p className="font-semibold">E-post:</p>
              <p>{customer.email}</p>
            </div>
            <div>
              <p className="font-semibold">Telefon:</p>
              <p>{customer.phone}</p>
            </div>
            <div>
              <p className="font-semibold">Offertstatus:</p>
              <p>{customer.offerStatus}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offerter</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offert ID</TableHead>
                <TableHead>Skickad</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bokad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>{offer.id}</TableCell>
                  <TableCell>{offer.sentDate}</TableCell>
                  <TableCell>{offer.status}</TableCell>
                  <TableCell>{offer.bookingDate || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

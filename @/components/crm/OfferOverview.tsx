"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CRMOffer } from "@/types/crm"

const mockOffers: CRMOffer[] = [
  { id: "1", customerName: "John Doe", sentDate: "2023-05-01", status: "Öppnad", bookingDate: null },
  { id: "2", customerName: "Jane Smith", sentDate: "2023-05-02", status: "Bokad", bookingDate: "2023-05-03" },
  { id: "3", customerName: "Alice Johnson", sentDate: "2023-05-03", status: "Avböjd", bookingDate: null },
]

export function OfferOverview() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Offertöversikt</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kund</TableHead>
            <TableHead>Skickad</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bokad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockOffers.map((offer) => (
            <TableRow key={offer.id}>
              <TableCell>{offer.customerName}</TableCell>
              <TableCell>{offer.sentDate}</TableCell>
              <TableCell>{offer.status}</TableCell>
              <TableCell>{offer.bookingDate || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

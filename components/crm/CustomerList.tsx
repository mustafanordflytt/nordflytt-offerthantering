"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Customer } from "@/types/crm"

const mockCustomers: Customer[] = [
  { id: "1", name: "John Doe", email: "john@example.com", phone: "0701234567", offerStatus: "Skickad" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", phone: "0709876543", offerStatus: "Accepterad" },
  { id: "3", name: "Alice Johnson", email: "alice@example.com", phone: "0703456789", offerStatus: "Avböjd" },
]

interface CustomerListProps {
  onCustomerSelect: (customerId: string) => void
}

export function CustomerList({ onCustomerSelect }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Kundhantering</h2>
      <Input
        type="text"
        placeholder="Sök kunder..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Namn</TableHead>
            <TableHead>E-post</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Offertstatus</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCustomers.map((customer) => (
            <TableRow
              key={customer.id}
              onClick={() => onCustomerSelect(customer.id)}
              className="cursor-pointer hover:bg-gray-100"
            >
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.offerStatus}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

"use client"

import type { FormData, CustomerType } from "@/types/formData"
import { useState } from "react"

interface Step1Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  nextStep: () => void
}

export default function Step1CustomerType({ formData, updateFormData, nextStep }: Step1Props) {
  const [customerType, setCustomerType] = useState<CustomerType>(formData.customerType)
  const [name, setName] = useState(formData.customerInfo.name)
  const [email, setEmail] = useState(formData.customerInfo.email)
  const [phone, setPhone] = useState(formData.customerInfo.phone)

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const validateForm = () => {
    let valid = true
    const newErrors = {
      name: "",
      email: "",
      phone: "",
    }

    if (!name.trim()) {
      newErrors.name = "Namn är obligatoriskt"
      valid = false
    }

    if (!email.trim()) {
      newErrors.email = "E-post är obligatoriskt"
      valid = false
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Ogiltig e-postadress"
      valid = false
    }

    if (!phone.trim()) {
      newErrors.phone = "Telefonnummer är obligatoriskt"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = () => {
    if (validateForm()) {
      updateFormData({
        customerType,
        customerInfo: {
          ...formData.customerInfo,
          name,
          email,
          phone,
        },
      })
      nextStep()
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Vem är du?</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          className={`moving-type-card ${customerType === "private" ? "selected" : ""}`}
          onClick={() => setCustomerType("private")}
        >
          <div className="card-icon">👨‍👩‍👧‍👦</div>
          <h3>Privatperson</h3>
          <p>Jag flyttar mitt hem eller bostad</p>
        </div>

        <div
          className={`moving-type-card ${customerType === "business" ? "selected" : ""}`}
          onClick={() => setCustomerType("business")}
        >
          <div className="card-icon">🏢</div>
          <h3>Företag</h3>
          <p>Vi flyttar vårt kontor eller verksamhet</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {customerType === "private" ? "Namn" : "Företagsnamn"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder={customerType === "private" ? "Ditt namn" : "Företagets namn"}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="din@epost.se"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefonnummer</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="07X-XXX XX XX"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={handleSubmit} className="next-button">
          Nästa steg
        </button>
      </div>
    </div>
  )
}

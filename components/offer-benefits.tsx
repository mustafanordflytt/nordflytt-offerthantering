"use client"

import { ShieldIcon, WrenchIcon, UsersIcon, BanknoteIcon, LockIcon, FileTextIcon } from "lucide-react"

export function OfferBenefits() {
  const services = [
    {
      icon: <ShieldIcon className="w-5 h-5 fill-[#002A5C]" />,
      title: "Tryggt möbelskydd ingår",
      description: "Alltid med filt och plast",
    },
    {
      icon: <WrenchIcon className="w-5 h-5 fill-[#002A5C]" />,
      title: "Vi monterar åt dig",
      description: "30 min ingår utan extra kostnad",
    },
    {
      icon: <UsersIcon className="w-5 h-5 fill-[#002A5C]" />,
      title: "Bärhjälp oavsett trappa",
      description: "Vi löser det, oavsett våning",
    },
    {
      icon: <BanknoteIcon className="w-5 h-5 fill-[#002A5C]" />,
      title: "Inga dolda avgifter",
      description: "Priset du ser är vad du betalar",
    },
    {
      icon: <LockIcon className="w-5 h-5 fill-[#002A5C]" />,
      title: "Försäkrat hela vägen",
      description: "Full försäkring via Trygg-Hansa",
    },
    {
      icon: <FileTextIcon className="w-5 h-5 fill-[#002A5C]" />,
      title: "Betala efter flytten",
      description: "Välj mellan Swish, faktura eller delbetalning",
    },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-8">
      <div className="p-5">
        <h2 className="text-xl font-bold text-[#002A5C] mb-6">
          Därför lönar det sig att boka hos oss
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex items-start">
                <div className="bg-blue-50 p-2 rounded-full mr-3">
                  {service.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#002A5C] mb-1">
                    {service.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
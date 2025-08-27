"use client"

import { useState, useEffect } from "react"
import { Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OfferHero() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  })

  // Nedräkningstimer för erbjudandet
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else {
          clearInterval(timer)
          return { hours: 0, minutes: 0, seconds: 0 }
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative bg-gradient-to-b from-[#002A5C] to-[#001F45] text-white py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Ditt personliga flytterbjudande</h1>
          <p className="text-lg md:text-xl max-w-2xl mb-6">
            Vi har skapat ett skräddarsytt erbjudande baserat på din 2:a i Stockholm
          </p>

          {/* Nedräkningstimer */}
          <div className="bg-white/10 rounded-lg p-4 mb-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Erbjudandet går ut om:</span>
              <div className="flex gap-1 font-mono text-lg">
                <span className="bg-white/20 rounded px-2 py-1">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span>:</span>
                <span className="bg-white/20 rounded px-2 py-1">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span>:</span>
                <span className="bg-white/20 rounded px-2 py-1">{String(timeLeft.seconds).padStart(2, "0")}</span>
              </div>
            </div>
          </div>

          {/* USP-punkter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-4xl">
            {[
              { text: "Fast pris utan överraskningar" },
              { text: "RUT-avdrag redan avdraget" },
              { text: "Fri avbokning upp till 48h innan" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <Button size="lg" className="bg-[#4CAF50] hover:bg-[#388E3C] text-white font-medium text-lg px-8 py-6 h-auto">
            Boka flytthjälp nu
          </Button>
        </div>
      </div>

      {/* Dekorativ våg i botten */}
      <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-full"
          fill="white"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C0,0,0,0,0,0Z"></path>
        </svg>
      </div>
    </section>
  )
}

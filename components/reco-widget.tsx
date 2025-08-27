"use client"

import { useEffect, useRef } from "react"

export function RecoWidget() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Säkerställ att iframe är responsiv
    const handleResize = () => {
      if (iframeRef.current) {
        iframeRef.current.style.width = "100%"
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Kör en gång vid laddning

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div>
      <iframe
        ref={iframeRef}
        src="https://widget.reco.se/v2/venues/5916883/horizontal/xlarge?inverted=false&border=false"
        title="Nordflytt - Omdömen på Reco"
        height="225"
        style={{ width: "100%", border: 0, display: "block", overflow: "hidden" }}
      />
    </div>
  )
}

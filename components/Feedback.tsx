"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/StarRating"
import { submitFeedback } from "@/lib/api"

export function Feedback({ offerId }: { offerId: string }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async () => {
    try {
      await submitFeedback(offerId, rating, comment)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      // TODO: Show error message to user
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">Tack för din feedback!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lämna feedback</CardTitle>
        <CardDescription>Hjälp oss förbättra vår service genom att dela din upplevelse</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StarRating rating={rating} onRatingChange={setRating} />
        <Textarea
          placeholder="Berätta om din upplevelse..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={rating === 0}>
          Skicka feedback
        </Button>
      </CardFooter>
    </Card>
  )
}

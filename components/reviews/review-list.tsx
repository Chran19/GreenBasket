"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ThumbsUp, ThumbsDown, Flag } from "lucide-react"

interface Review {
  id: string | number
  author: string
  rating: number
  date: string
  comment: string
  verified: boolean
  helpful?: number
  productId?: string
  authorRole?: 'buyer' | 'farmer'
}

interface ReviewListProps {
  reviews: Review[]
  showProductName?: boolean
}

export function ReviewList({ reviews, showProductName = false }: ReviewListProps) {
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({})

  const handleHelpfulVote = (reviewId: string | number, isHelpful: boolean) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: isHelpful,
    }))
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{review.author}</span>
                  {review.verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified Purchase
                    </Badge>
                  )}
                  {review.authorRole && (
                    <Badge variant="outline" className="text-xs">
                      {review.authorRole === 'buyer' ? 'Buyer' : 'Farmer'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Flag className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-muted-foreground mb-4 leading-relaxed">{review.comment}</p>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Was this helpful?</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpfulVote(review.id, true)}
                  className={`h-8 px-3 ${helpfulVotes[review.id] === true ? "bg-green-100 text-green-700" : ""}`}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Yes {review.helpful && `(${review.helpful})`}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpfulVote(review.id, false)}
                  className={`h-8 px-3 ${helpfulVotes[review.id] === false ? "bg-red-100 text-red-700" : ""}`}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  No
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

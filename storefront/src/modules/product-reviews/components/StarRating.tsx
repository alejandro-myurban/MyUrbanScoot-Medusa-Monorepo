"use client"

import { Star } from "lucide-react"
import React from "react"

interface StarRatingProps {
  rating: number | number[]
  size?: number
  color?: string
  className?: string
  readOnly?: boolean
  onChange?: (rating: number) => void
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 20,
  color = "#FFD700",
  className = "",
  readOnly = true,
  onChange,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0)

  const handleStarClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index)
    }
  }

  return (
    <div className={`flex ${className}`}>
      {[1, 2, 3, 4, 5].map((index) => {
        const fill = readOnly
          ? index <= (Array.isArray(rating) ? rating[0] || 0 : rating)
          : index <= (hoverRating || (Array.isArray(rating) ? rating[0] || 0 : rating))
        
        return (
          <Star
            key={index}
            size={size}
            fill={fill ? color : "none"}
            stroke={color}
            className={!readOnly ? "cursor-pointer" : ""}
            onMouseEnter={() => !readOnly && setHoverRating(index)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            onClick={() => handleStarClick(index)}
          />
        )
      })}
    </div>
  )
}

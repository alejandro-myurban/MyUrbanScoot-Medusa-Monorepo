"use client"

import React from "react"

interface RatingDistributionProps {
  ratingsCount: { [key: number]: number }
  totalReviews: number
  className?: string
}

export const RatingDistribution: React.FC<RatingDistributionProps> = ({
  ratingsCount,
  totalReviews,
  className = "",
}) => {
  // Convert ratings object to array for easier rendering
  const ratingLevels = [5, 4, 3, 2, 1]

  return (
    <div className={`space-y-2 ${className}`}>
      {ratingLevels.map((level) => {
        const count = ratingsCount[level] || 0
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

        return (
          <div key={level} className="flex items-center gap-2">
            <div className="text-sm font-medium w-8">{level} ★</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 w-10 text-right">{count}</div>
          </div>
        )
      })}
    </div>
  )
}

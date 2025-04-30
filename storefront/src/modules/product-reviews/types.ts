export type ProductReview = {
  id: string
  product_id: string
  product_variant_id?: string | null
  customer_id?: string | null
  rating: number
  title?: string | null
  content?: string | null
  approved?: boolean
  status?: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export type ProductReviewCreateBody = {
  display_name: string
  rating: number
  title?: string
  content?: string
  product_variant_id?: string
}

export type ProductReviewStats = {
  product_id: string
  average_rating: number
  ratings_count: {
    [key: number]: number
  }
  total_reviews: number
}

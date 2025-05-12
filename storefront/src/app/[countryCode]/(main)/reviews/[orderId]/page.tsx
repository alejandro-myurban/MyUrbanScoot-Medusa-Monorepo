// src/app/[countryCode]/(main)/reviews/[orderId]/page.tsx
import CreateProductReview from "@modules/product-reviews/components/CreateProductReview"
import { retrieveOrder } from "@lib/data/orders"

interface ReviewPageProps {
  params: {
    countryCode: string
    orderId: string
  }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { countryCode, orderId } = params

  // fetch on the server
  const order = await retrieveOrder(orderId)

  return (
    <div className="content-container">
      <h2>Reseña para la orden {orderId}</h2>
      <CreateProductReview order={order as any} countryCode={countryCode} />
    </div>
  )
}

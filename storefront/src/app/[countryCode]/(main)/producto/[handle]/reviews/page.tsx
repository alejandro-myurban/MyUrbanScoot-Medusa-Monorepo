import React from "react"
// import { ProductReviewsList } from "../../../../../../modules/product-reviews/components/ProductReviewList"
// import { ProductReviewForm } from "../../../../../../modules/product-reviews/components/ProductReviewForm"
import { notFound } from "next/navigation"

async function getProduct(handle: string) {
  try {
    console.log("ooooooOOOOO")
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "/api"  
      }/store/products?handle=${handle}`,
      { next: { revalidate: 10 } }
    )
    console.log("RESPONSe", response)
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`)
    }

    const { products } = await response.json()
    return products[0] || null
  } catch (error) {     
    console.error("Error fetching product:", error)
    return null
  }
}

export default async function ProductReviewsPage({
  params,
}: {
  params: { handle: string }
}) {
  const product = await getProduct(params.handle)



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* <h1 className="text-2xl font-bold mb-8">Reviews for {product.title}</h1> */}
    HOLA
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8">
          {/* <ProductReviewsList productId={product.id} /> */}
        </div>

        <div className="md:col-span-4">
          {/* <ProductReviewForm productId={product.id} /> */}
        </div>
      </div>
    </div>
  )
}

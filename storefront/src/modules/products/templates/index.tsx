import React, { Suspense } from "react"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import { ColorContextProvider } from "../../../lib/context/color-content-provider"
import ClientImageGallery from "../../products/components/image-gallery/client-image-gallery"
import Spinner from "@modules/common/icons/spinner"
import { ProductReviewsSummary } from "@modules/product-reviews/components/ProductReviewSummary"
// Importa solo el componente BoughtTogether correcto
import BoughtTogether from "../components/bought-together"
import { CombinedCartProvider } from "../components/bought-together/bt-context"
import CustomNameNumberForm from "../components/custom-name-number"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  searchParams?: { [key: string]: string | string[] | undefined }
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  searchParams,
}) => {
  if (!product || !product.id) {
    return notFound()
  }
  // Get color or base option from product
  const variantOption = product.options?.find(
    (opt) =>
      opt.title === "Color" ||
      opt.title === "Base" ||
      opt.title === "Pedana" ||
      opt.title === "Deck"
  )
  const optionValues = variantOption?.values || []

  // Get the translated title if available
  const optionTitle =
  //@ts-ignore
    variantOption?.translations?.title || variantOption?.title || ""

  // Validate option value from parameters
  const selectedParam = searchParams?.option?.toString() || ""
  const isValidOption = optionValues.some((v) => v.value === selectedParam)

  // Set initial option value
  const initialValue = isValidOption
    ? selectedParam
    : optionValues[0]?.value || ""

  try {
    return (
      <Suspense
        fallback={
          <div>
            <Spinner />
          </div>
        }
      >
        <ColorContextProvider
          initialColor={initialValue}
          optionTitle={optionTitle}
        >
          <div
            className="content-container flex flex-col small:flex-row small:items-start py-6 relative"
            data-testid="product-container"
          >
            <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
              <ProductInfo product={product} />
              <ProductTabs product={product} />
            </div>
            <div className="block w-full relative">
              <ClientImageGallery images={product.images || []} />
            </div>
            <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
              <ProductOnboardingCta />
              <CombinedCartProvider>
                <Suspense
                  fallback={
                    <ProductActions
                      disabled={true}
                      product={product}
                      region={region}
                    />
                  }
                >
                  <CustomNameNumberForm product={product} />
                  <ProductActionsWrapper id={product.id} region={region} countryCode={countryCode} />
                  <BoughtTogether product={product} region={region} />
                </Suspense>
              </CombinedCartProvider>
            </div>
          </div>
          <div
            className="content-container my-16 small:my-32"
            data-testid="related-products-container"
          >
            <ProductReviewsSummary
              productId={product.id}
              productHandle={product.handle}
            />
            <Suspense fallback={<SkeletonRelatedProducts />}>
              <RelatedProducts product={product} countryCode={countryCode} />
            </Suspense>
          </div>
        </ColorContextProvider>
      </Suspense>
    )
  } catch (error) {
    console.error("Error rendering ProductTemplate:", error)
    return <div>Error loading product. Please try again.</div>
  }
}

export default ProductTemplate

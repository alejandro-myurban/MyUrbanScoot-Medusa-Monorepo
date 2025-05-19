import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"

type Props = {
  params: { countryCode: string; handle: string }
}

export async function generateStaticParams() {
  const countryCodes = await listRegions().then(
    (regions) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  if (!countryCodes) {
    return null
  }

  const products = await Promise.all(
    countryCodes.map((countryCode) => {
      return getProductsList({ countryCode })
    })
  ).then((responses) =>
    responses.map(({ response }) => response.products).flat()
  )

  const staticParams = countryCodes
    ?.map((countryCode) =>
      products.map((product) => ({
        countryCode,
        handle: product.handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const selectedCountry = region.countries?.find(
    (c) => c.iso_2 === params.countryCode
  )

  if (!selectedCountry) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id, params.countryCode)

  if (!product) {
    notFound()
  }

  // Use translated title if available, fallback to original title
  const title = product.translations?.title || product.title
  const description = product.translations?.description || product.description || product.title

  return {
    title: `${title} | Medusa Store`,
    description: `${description}`,
    openGraph: {
      title: `${title} | Medusa Store`,
      description: `${description}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }
  
  const selectedCountry = region.countries?.find(
    (c) => c.iso_2 === params.countryCode
  )

  if (!selectedCountry) {
    notFound()
  }


  const countryCodeGb = params.countryCode === "gb" ? params.countryCode = "en" : params.countryCode

  const pricedProduct = await getProductByHandle(params.handle, region.id, countryCodeGb)
  
  if (!pricedProduct) {
    notFound()
  }

  // Use translations if available
  const translatedProduct = {
    ...pricedProduct,
    title: pricedProduct.translations?.title || pricedProduct.title,
    description: pricedProduct.translations?.description || pricedProduct.description,
    subtitle: pricedProduct.translations?.subtitle || pricedProduct.subtitle,
  }

  console.log("Country Code:", params.countryCode)
  console.log("Translated Product:", translatedProduct)

  return (
    <>
      <ProductTemplate
        product={translatedProduct}
        region={region}
        countryCode={params.countryCode}
      />
    </>
  )
}
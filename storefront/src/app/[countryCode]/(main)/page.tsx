import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "MyUrbanScoot | Todo para tu patinete eléctrico",
  description:
    "MyUrbanScoot: Tu tienda online especializada en repuestos y accesorios para patinetes eléctricos. Encuentra piezas de calidad, ruedas, baterías y mucho más para mantener tu patinete siempre a punto.",
  openGraph: {
    title: "MyUrbanScoot | Todo para tu patinete eléctrico",
    description:
      "MyUrbanScoot: Tu tienda online especializada en repuestos y accesorios para patinetes eléctricos. Encuentra piezas de calidad, ruedas, baterías y mucho más para mantener tu patinete siempre a punto.",
    url: "https://myurbanscoot.com",
    siteName: "MyUrbanScoot",
    images: [
      {
        url: "https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png", // Pon aquí la URL de la imagen OG
        width: 1200,
        height: 630,
        alt: "MyUrbanScoot - Accesorios para patinetes eléctricos",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
}

export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      {/* <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div> */}
    </>
  )
}

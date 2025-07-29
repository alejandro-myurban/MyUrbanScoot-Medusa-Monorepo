import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

// Shipping actions
export const listCartShippingMethods = cache(async function (cartId: string) {
  return sdk.store.fulfillment
    .listCartOptions({ cart_id: cartId }, { next: { tags: ["shipping"] } })
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
})

export const listCartShippingMethodsWithTranslations = async (
  cartId: string,
  countryCode?: string
) => {
  console.log("🔍 Debug - Parámetros:", { cartId, countryCode })

  try {
    const queryParams = {
      cart_id: cartId,
      country_code: countryCode || "ES",
    }

    console.log("🔍 Debug - Query params:", queryParams)
    console.log(
      "🔍 Debug - URL completa:",
      `/store/shipping-options/tolgee?cart_id=${cartId}&country_code=${
        countryCode || "ES"
      }`
    )

    const response =
      await sdk.client.fetch<HttpTypes.StoreShippingOptionListResponse>(
        `/store/shipping-options/tolgee`,
        {
          method: "GET",
          query: queryParams,
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-cache", // Para debugging en producción
        }
      )

    console.log("🔍 Debug - Respuesta completa:", response)
    console.log("🔍 Debug - Shipping options:", response.shipping_options)

    return response.shipping_options || []
  } catch (error) {
    console.error(
      "❌ Error fetching shipping methods with Tolgee translations:",
      error
    )

    // Vamos a probar también el endpoint original para comparar
    console.log("🔄 Probando endpoint original...")
    try {
      const fallbackMethods = await listCartShippingMethods(cartId)
      console.log("🔍 Debug - Métodos del endpoint original:", fallbackMethods)
      return fallbackMethods
    } catch (fallbackError) {
      console.error("❌ Error también en endpoint original:", fallbackError)
      return []
    }
  }
}

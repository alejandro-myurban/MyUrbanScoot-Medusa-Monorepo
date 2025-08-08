import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

// Define la URL del backend de Medusa usando la variable de entorno.
// Esto es necesario porque la instancia del SDK no expone 'baseUrl' directamente.
const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

// Shipping actions
// export const listCartShippingMethods = cache(async function (cartId: string) {
//   console.log("🔍 listCartShippingMethods: Usando SDK con Tolgee habilitado...")

//   try {
//     const { shipping_options } = await sdk.store.fulfillment.listCartOptions(
//       { cart_id: cartId },
//       { next: { tags: ["shipping"] } }
//     )

//     console.log("🔍 Datos RAW de Tolgee:", shipping_options)

//     // 🔧 FIX: Corregir provider_id que Tolgee corrompe
//     const fixedShippingOptions = shipping_options?.map((option) => {
//       let correctedProviderId = option.provider_id

//       // Si provider_id no tiene el prefijo fp_, añadirlo
//       if (correctedProviderId && !correctedProviderId.startsWith("fp_")) {
//         correctedProviderId = `fp_${correctedProviderId}`
//         console.log(
//           `🔧 Corrigiendo provider_id: ${option.provider_id} → ${correctedProviderId}`
//         )
//       }

//       return {
//         ...option,
//         provider_id: correctedProviderId,
//       }
//     })

//     console.log(
//       "🔍 listCartShippingMethods: Opciones corregidas:",
//       fixedShippingOptions
//     )
//     return fixedShippingOptions
//   } catch (error) {
//     console.error("❌ listCartShippingMethods: Error:", error)
//     return null
//   }
// })

export const listCartShippingMethodsWithTranslations = async (
  cartId: string,
  countryCode?: string
) => {
  console.log(
    "🔍 Debug - Parámetros para listCartShippingMethodsWithTranslations:",
    { cartId, countryCode }
  )

  const effectiveCountryCode = countryCode || "es" // Default to "es" if not provided
  console.log("🔍 Debug - Código de país efectivo:", effectiveCountryCode)

  try {
    const queryParams = {
      cart_id: cartId,
      country_code: effectiveCountryCode,
    }

    console.log("🔍 Debug - Query params para Tolgee:", queryParams)
    console.log(
      "🔍 Debug - URL completa para Tolgee:",
      // === CAMBIO CLAVE AQUÍ: Usar MEDUSA_BACKEND_URL directamente ===
      `${MEDUSA_BACKEND_URL}/store/shipping-options/tolgee?cart_id=${cartId}&country_code=${effectiveCountryCode}`
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

    console.log("🔍 Debug - Respuesta completa de Tolgee:", response)
    console.log(
      "🔍 Debug - Shipping options de Tolgee:",
      response.shipping_options
    )

    if (response.shipping_options && response.shipping_options.length > 0) {
      console.log("✅ Tolgee endpoint devolvió opciones de envío.")
      return response.shipping_options
    } else {
      console.warn(
        "⚠️ Tolgee endpoint no devolvió opciones de envío. Probando endpoint original como fallback..."
      )
      const fallbackMethods = await listCartShippingMethods(cartId)
      return fallbackMethods || [] // Asegurarse de devolver un array vacío si el fallback es null
    }
  } catch (error) {
    console.error(
      "❌ Error fetching shipping methods with Tolgee translations (catch principal):",
      error
    )

    // Vamos a probar también el endpoint original para comparar
    console.log("🔄 Probando endpoint original como fallback final...")
    try {
      const fallbackMethods = await listCartShippingMethods(cartId)
      console.log(
        "🔍 Debug - Métodos del endpoint original (fallback final):",
        fallbackMethods
      )
      return fallbackMethods || [] // Asegurarse de devolver un array vacío si el fallback es null
    } catch (fallbackError) {
      console.error(
        "❌ Error también en endpoint original (fallback final falló):",
        fallbackError
      )
      return []
    }
  }
}

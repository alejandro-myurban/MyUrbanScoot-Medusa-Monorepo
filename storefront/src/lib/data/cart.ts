"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes, PaymentSessionDTO } from "@medusajs/types"
import { omit } from "lodash"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getProductsById } from "./products"
import { getRegion } from "./regions"

/**
 * Añade un cargo adicional a los items del carrito que tienen custom_name en sus metadatos
 * @returns {Promise<boolean>} - True si la operación fue exitosa
 */
export async function addCustomNameFee() {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No se encontró un carrito existente")
  }

  return sdk.client
    .fetch(`/store/carts/${cartId}/custom-line-items`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
    .then(async (response: any) => {
      // Parse the response body
      revalidateTag("cart")
      return response.success // Access the `success` property directly
    })
    .catch(medusaError)
}

export async function deleteRelatedItems(id: string) {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No se encontró un carrito existente")
  }

  return sdk.client
    .fetch(`/store/carts/${cartId}/delete-related-items`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: { line_item_id: id },
    })
    .then(async (response: any) => {
      // Parse the response body
      revalidateTag("cart")
      return response.sucess // Access the `success` property directly
    })
    .catch(medusaError)
}

export async function retrieveCart(cartId = getCartId()) {
  if (!cartId) {
    return null
  }

  return await sdk.store.cart
    .retrieve(cartId, {}, { next: { tags: ["cart"] }, ...getAuthHeaders() })
    .then(({ cart }) => cart)
    .catch(() => {
      return null
    })
}

export async function getOrSetCart(countryCode: string) {
  let cart = await retrieveCart()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (!cart) {
    const cartResp = await sdk.store.cart.create({ region_id: region.id })
    cart = cartResp.cart
    setCartId(cart.id)
    revalidateTag("cart")
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(
      cart.id,
      { region_id: region.id },
      {},
      getAuthHeaders()
    )
    revalidateTag("cart")
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  return sdk.store.cart
    .update(cartId, data, {}, getAuthHeaders())
    .then(({ cart }) => {
      revalidateTag("cart")
      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
  metadata,
}: {
  variantId: string
  quantity: number
  countryCode: string
  metadata?: Record<string, unknown>
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)
  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
        metadata,
      },
      {},
      getAuthHeaders()
    )
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, getAuthHeaders())
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, getAuthHeaders())
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
  revalidateTag("cart")

  const { cart } = await sdk.store.cart.retrieve(cartId, {}, getAuthHeaders())

  if (!cart.items?.length) {
    removeCartId()
  }

  return cart
}

export async function enrichLineItems(
  lineItems:
    | HttpTypes.StoreCartLineItem[]
    | HttpTypes.StoreOrderLineItem[]
    | null,
  regionId: string
) {
  if (!lineItems) return []

  // Prepare query parameters
  const queryParams = {
    ids: lineItems.map((lineItem) => lineItem.product_id!),
    regionId: regionId,
  }

  // Fetch products by their IDs
  const products = await getProductsById(queryParams)
  // If there are no line items or products, return an empty array
  if (!lineItems?.length || !products) {
    return []
  }

  // Enrich line items with product and variant information
  const enrichedItems = lineItems.map((item) => {
    const product = products.find((p: any) => p.id === item.product_id)
    const variant = product?.variants?.find(
      (v: any) => v.id === item.variant_id
    )

    // If product or variant is not found, return the original item
    if (!product || !variant) {
      return item
    }

    // If product and variant are found, enrich the item
    return {
      ...item,
      variant: {
        ...variant,
        product: omit(product, "variants"),
      },
    }
  }) as HttpTypes.StoreCartLineItem[]

  return enrichedItems
}
<<<<<<< Updated upstream

// En tu setShippingMethod, añade más logs
=======
>>>>>>> Stashed changes
export async function setShippingMethod({
  cartId,
  shippingMethodId,
  optionData, // <-- agrega este parámetro
}: {
  cartId: string
  shippingMethodId: string
  optionData: { id: string; [key: string]: any } // <-- tipo para los datos de la opción
}) {
<<<<<<< Updated upstream
  console.log("📤 setShippingMethod - Params:", {
    cartId,
    shippingMethodId,
  })

  // Interceptar la petición del SDK
  const originalFetch = global.fetch
  global.fetch = function (...args) {
    console.log("🌐 Fetch interceptado:", {
      url: args[0],
      options: args[1],
      body: typeof args[1]?.body === "string" ? JSON.parse(args[1].body) : args[1]?.body,
    })
    return originalFetch.apply(this, args)
  }

  try {
    const result = await sdk.store.cart.addShippingMethod(
=======
  console.log("INTENTANDO agregar método de envío:", {
    cartId,
    shippingMethodId,
    optionData,
  })

  return sdk.store.cart
    .addShippingMethod(
>>>>>>> Stashed changes
      cartId,
      { 
        option_id: shippingMethodId,
        data: optionData // <-- aquí pasas los datos de la opción
      },
      {},
      getAuthHeaders()
    )
<<<<<<< Updated upstream

    console.log("✅ Resultado exitoso:", result)
    revalidateTag("cart")
    return result
  } catch (error) {
    console.error("❌ Error en setShippingMethod:", error)
    throw error
  } finally {
    // Restaurar fetch original
    global.fetch = originalFetch
  }
=======
    .then(() => {
      console.log("✅ Método de envío agregado con éxito")
      revalidateTag("cart")
    })
    .catch((err) => {
      console.error("❌ Error al agregar método de envío", err)
      medusaError(err)
    })
>>>>>>> Stashed changes
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: {
    provider_id: string
    context?: Record<string, unknown>
  }
) {
  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, getAuthHeaders())
    .then((resp) => {
      revalidateTag("cart")
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No existing cart found")
  }

  await updateCart({ promo_codes: codes })
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    } as any

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    console.log("data", data)
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }

  redirect(
    `/${formData.get("shipping_address.country_code")}/checkout?step=delivery`
  )
}

export async function placeOrder(cartId = getCartId()) {
  if (!cartId) {
    throw new Error("No existing cart found when placing an order")
  }

  const cartRes = await sdk.store.cart
    .complete(cartId, {}, getAuthHeaders())
    .then((cartRes) => {
      revalidateTag("cart")
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()
    removeCartId()
    redirect(`/${countryCode}/order/confirmed/${cartRes?.order.id}`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    revalidateTag("cart")
  }

  revalidateTag("regions")
  revalidateTag("products")

  redirect(`/${countryCode}${currentPath}`)
}

// APPLY THE LOYALTY POINTS

export async function applyLoyaltyPointsOnCart() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client
    .fetch<{
      cart: HttpTypes.StoreCart & {
        promotions: HttpTypes.StorePromotion[]
      }
    }>(`/store/carts/${cartId}/loyalty-points`, {
      method: "POST",
      headers,
    })
    .then(async (result) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      return result
    })
}

export async function removeLoyaltyPointsOnCart() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<{
      cart: HttpTypes.StoreCart & {
        promotions: HttpTypes.StorePromotion[]
      }
    }>(`/store/carts/${cartId}/loyalty-points`, {
      method: "DELETE",
      headers,
    })
    .then(async (result) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      return result
    })
}

type PaymentSessionDTO = {
  provider_id: string
}

/**
 * Actualiza el método de pago del carrito
 * @param cartId - ID del carrito
 * @param paymentSessionDTO - Datos de la sesión de pago
 */
export async function updateCartPaymentMethod(
  cartId: string,
  paymentSessionDTO: PaymentSessionDTO
) {
  try {
    // Primero, aseguramos que las sesiones de pago estén inicializadas
    // Diferentes versiones de Medusa tienen diferentes formas de hacer esto
    try {
      // Intentamos primero con refreshPaymentSession (Medusa nueva versión)
      await sdk.store.payment.refreshPaymentSession(
        cartId,
        paymentSessionDTO.provider_id
      )
    } catch (error) {
      // Si falla, intentamos con el método alternativo o asumimos que ya están inicializadas
      console.log("Refresh session failed, continuing with selection", error)
    }

    // Ahora, seleccionamos la sesión de pago
    const { cart } = await medusaClient.carts.setPaymentSession(cartId, {
      provider_id: paymentSessionDTO.provider_id,
    })

    // Actualizar las cookies y revalidar las etiquetas para actualizar la UI
    const cartCookies = cookies()
    cartCookies.set("_medusa_cart_id", cart.id, { path: "/" })

    revalidateTag("cart")

    return cart
  } catch (error) {
    console.error("Error updating payment method:", error)
    throw new Error("No se pudo actualizar el método de pago")
  }
}

// Añade esta función a tu archivo @lib/data/cart.ts

export async function createPaymentCollection(cartId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-collections`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({
          cart_id: cartId,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.message ||
          `Failed to create payment collection: ${response.statusText}`
      )
    }

    const data = await response.json()

    // Recargar el carrito para obtener la payment collection actualizada
    const cartResponse = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${cartId}`,
      {
        headers: {
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
      }
    )

    if (!cartResponse.ok) {
      throw new Error("Failed to reload cart after creating payment collection")
    }

    const cartData = await cartResponse.json()
    return cartData
  } catch (error) {
    console.error("Error creating payment collection:", error)
    throw error
  }
}

import { useEffect, useState } from "react"
import { sdk } from "@lib/config"
/**
 * Obtiene o crea un carrito
 */
export async function getOrSetCart(countryCode: string) {
  try {
    // Primero intentamos recuperar un carrito existente
    const cartId = localStorage.getItem("cart_id")
    
    if (cartId) {
      try {
        const { cart } = await sdk.store.cart.retrieve(cartId, {}, getAuthHeaders())
        
        if (cart) {
          return cart
        }
      } catch (e) {
        localStorage.removeItem("cart_id")
        // Si hay error al recuperar, simplemente creamos uno nuevo
      }
    }
    
    // Si no hay carrito o hubo error, creamos uno nuevo
    const { cart } = await sdk.store.cart.create(
      { region_id: countryCode },
      {},
      getAuthHeaders()
    )
    
    localStorage.setItem("cart_id", cart.id)
    return cart
  } catch (e) {
    return undefined
  }
}

/**
 * Obtiene los headers de autenticación si es necesario
 */
export function getAuthHeaders() {
  // Implementa según tu lógica de autenticación
  // Por ejemplo:
  // const customer = getCustomerFromStorage()
  // if (customer && customer.token) return { Authorization: `Bearer ${customer.token}` }
  return {}
}

/**
 * Añade un producto al carrito
 */
export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
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
      },
      {},
      getAuthHeaders()
    )
    .then(() => {
      // Revalidar el carrito si usas SWR o React Query
      if (typeof window !== "undefined") {
        // Usando la API de revalidación de SWR/React Query si la usas
        // revalidateTag("cart")
        
        // O emitir un evento personalizado
        window.dispatchEvent(new CustomEvent("cart:updated"))
      }
    })
  
  return cart.id
}

/**
 * Hook personalizado para manejar operaciones del carrito
 */
export function useCartActions() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [cartId, setCartId] = useState<string | null>(null)
  
  // Recupera el ID del carrito del localStorage al iniciar
  useEffect(() => {
    const storedCartId = localStorage.getItem("cart_id")
    if (storedCartId) {
      setCartId(storedCartId)
    }
  }, [])
  
  /**
   * Añade varios productos al carrito
   */
  const addMultipleToCart = async (
    items: Array<{ variantId: string; quantity: number }>,
    countryCode: string
  ) => {
    if (items.length === 0) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      let currentCartId = cartId
      
      // Asegurarse de que existe un carrito
      if (!currentCartId) {
        const cart = await getOrSetCart(countryCode)
        if (!cart) throw new Error("Could not create cart")
        currentCartId = cart.id
        setCartId(currentCartId)
      }
      
      // Añadir cada producto al carrito secuencialmente
      for (const item of items) {
        await sdk.store.cart.createLineItem(
          currentCartId,
          {
            variant_id: item.variantId,
            quantity: item.quantity,
          },
          {},
          getAuthHeaders()
        )
      }
      
      // Opcionalmente, revalidar el carrito
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cart:updated"))
      }
      
      return currentCartId
    } catch (err) {
      console.error("Error adding items to cart:", err)
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  return {
    isLoading,
    error,
    cartId,
    addToCart,
    addMultipleToCart
  }
}
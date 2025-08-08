// src/api/store/carts/[id]/shipping-methods-workaround/route.ts
import type { 
  MedusaRequest, 
  MedusaResponse,
} from "@medusajs/framework/http"
import { 
  ContainerRegistrationKeys,
  MedusaError,
  Modules
} from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest<{ option_id: string }>,
  res: MedusaResponse
) => {
  const { id: cartId } = req.params
  const { option_id } = req.body
  
  console.log("🚀 Workaround endpoint llamado:", { cartId, option_id })
  
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartModule = req.scope.resolve(Modules.CART)
    const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)
    
    // 1. Obtener el cart
    const cart = await cartModule.retrieveCart(cartId, {
      relations: ["shipping_methods", "items", "shipping_address"]
    })
    
    if (!cart) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Cart ${cartId} not found`
      )
    }
    
    console.log("📦 Cart encontrado:", {
      id: cart.id,
      has_items: cart.items?.length > 0,
      has_address: !!cart.shipping_address
    })
    
    // 2. Obtener la shipping option directamente
    const { data: shippingOptions } = await query.graph({
      entity: "shipping_option",
      filters: { id: option_id },
      fields: [
        "id",
        "name",
        "price_type",
        "provider_id",
        "service_zone_id",
        "shipping_profile_id",
        "data",
        "rules.*",
        "type.*",
        "provider.*",
        "prices.*"
      ]
    })
    
    if (!shippingOptions?.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Shipping option ${option_id} not found`
      )
    }
    
    const shippingOption = shippingOptions[0]
    console.log("✅ Shipping option encontrada:", {
      id: shippingOption.id,
      name: shippingOption.name,
      provider_id: shippingOption.provider_id,
      price_type: shippingOption.price_type
    })
    
    // 3. Validar que el provider existe (opcional pero recomendado)
    const providerKey = `fp_${shippingOption.provider_id}`
    const hasProvider = req.scope.hasRegistration(providerKey)
    
    if (!hasProvider) {
      console.warn(`⚠️ Provider ${providerKey} no está registrado, continuando de todos modos...`)
      
      // Registrar un provider dummy si no existe
      req.scope.register(providerKey, {
        //@ts-ignore
        asValue: {
          identifier: shippingOption.provider_id,
          getName: () => shippingOption.name,
          validateFulfillmentData: (data: any) => data,
          validateOption: () => true,
          canCalculate: () => false,
          calculatePrice: () => null,
        }
      })
    }
    
    // 4. Calcular el precio
    let amount = 0
    if (shippingOption.price_type === "flat" && shippingOption.prices?.length > 0) {
      amount = shippingOption.prices[0].amount || 0
    } else if (shippingOption.price_type === "calculated") {
      // Aquí deberías llamar al provider para calcular, por ahora usamos 0
      console.log("📊 Precio calculado no implementado, usando 0")
      amount = 0
    }
    
    // 5. Eliminar shipping methods existentes
    if (cart.shipping_methods?.length > 0) {
      console.log("🗑️ Eliminando shipping methods existentes:", cart.shipping_methods.map(sm => sm.id))
      await cartModule.deleteShippingMethods(cart.shipping_methods.map(sm => sm.id))
    }
    
    // 6. Agregar el nuevo shipping method
    const shippingMethodData = {
      cart_id: cartId,
      name: shippingOption.name,
      amount,
      shipping_option_id: shippingOption.id,
      data: {
        ...shippingOption.data,
        provider_id: shippingOption.provider_id
      }
    }
    
    console.log("➕ Creando shipping method:", shippingMethodData)
    
    const [shippingMethod] = await cartModule.addShippingMethods([shippingMethodData])
    
    console.log("✅ Shipping method creado:", shippingMethod)
    
    // 7. Obtener el cart actualizado (simplificado para evitar errores)
    let updatedCart;
    try {
      // Intentar con relaciones completas
      updatedCart = await cartModule.retrieveCart(cartId, {
        relations: [
          "items",
          "shipping_methods",
          "shipping_address",
          "billing_address"
        ]
      });
    } catch (error) {
      console.log("⚠️ Error con relaciones completas, intentando sin relaciones anidadas");
      // Si falla, obtener sin relaciones anidadas problemáticas
      updatedCart = await cartModule.retrieveCart(cartId, {
        relations: [
          "items",
          "shipping_methods"
        ]
      });
    }
    
    // 8. Obtener información adicional usando query en lugar de relaciones
    let itemsWithDetails = [];
    let addressDetails = null;
    
    try {
      // Obtener items con detalles usando query
      if (updatedCart.items?.length > 0) {
        const itemIds = updatedCart.items.map(item => item.id);
        const { data: items } = await query.graph({
          entity: "cart_item",
          filters: { id: itemIds },
          fields: [
            "id",
            "quantity", 
            "unit_price",
            "variant_id",
            "product_id",
            "title",
            "subtitle",
            "thumbnail"
          ]
        });
        itemsWithDetails = items || updatedCart.items;
      }
      
      // Obtener dirección si existe
      if (updatedCart.shipping_address_id) {
        const { data: addresses } = await query.graph({
          entity: "address",
          filters: { id: updatedCart.shipping_address_id },
          fields: ["*"]
        });
        addressDetails = addresses?.[0];
      }
    } catch (e) {
      console.log("ℹ️ No se pudieron obtener detalles adicionales, usando datos básicos");
      itemsWithDetails = updatedCart.items || [];
    }
    
    // 9. Calcular totales (simplificado)
    const items = itemsWithDetails.length > 0 ? itemsWithDetails : updatedCart.items || [];
    const subtotal = items.reduce((acc, item) => {
      return acc + (item.unit_price || 0) * item.quantity;
    }, 0);
    
    const shipping_total = updatedCart.shipping_methods?.reduce((acc, sm) => {
      return acc + (sm.amount || 0);
    }, 0) || 0;
    
    const total = subtotal + shipping_total;
    
    console.log("✅ Cart actualizado con shipping method");
    
    res.json({
      cart: {
        ...updatedCart,
        items: itemsWithDetails.length > 0 ? itemsWithDetails : updatedCart.items,
        shipping_address: addressDetails || updatedCart.shipping_address,
        // Agregar campos calculados que el frontend espera
        subtotal,
        shipping_total,
        total,
        tax_total: 0, // Simplificado
      }
    })
    
  } catch (error: any) {
    console.error("❌ Error en workaround:", error)
    
    res.status(error.type === MedusaError.Types.NOT_FOUND ? 404 : 500).json({
      message: error.message,
      type: error.type || "unknown_error"
    })
  }
}

// GET para verificar shipping methods actuales
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: cartId } = req.params
  
  try {
    const cartModule = req.scope.resolve(Modules.CART)
    
    const cart = await cartModule.retrieveCart(cartId, {
      relations: ["shipping_methods"]
    })
    
    res.json({
      cart_id: cart.id,
      shipping_methods: cart.shipping_methods
    })
    
  } catch (error: any) {
    res.status(500).json({
      message: error.message
    })
  }
}
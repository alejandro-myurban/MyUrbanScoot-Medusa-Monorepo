// backend/scripts/debug-shipping-option.js
export default async function debugShippingOption({ container }) {
  const optionId = "so_01JSP4QGQKEBFDVJGDVQV8T04T"
  
  try {
    console.log("🔍 Iniciando debug de shipping option...")
    
    // Usando el servicio de fulfillment
    const fulfillmentService = container.resolve("fulfillment")
    
    try {
      const option = await fulfillmentService.retrieveShippingOption(optionId)
      console.log("✅ Shipping option desde servicio:", {
        id: option.id,
        name: option.name,
        provider_id: option.provider_id,
        service_zone_id: option.service_zone_id
      })
    } catch (e) {
      console.log("❌ Error al obtener desde servicio:", e.message)
    }
    
    // Listar todos los providers disponibles
    try {
      const providers = await fulfillmentService.listFulfillmentProviders()
      console.log("📦 Providers registrados:")
      providers.forEach(provider => {
        console.log({
          id: provider.id,
          is_enabled: provider.is_enabled
        })
      })
    } catch (e) {
      console.log("❌ Error al listar providers:", e.message)
    }
    
    // Intentar listar shipping options disponibles
    try {
      const shippingOptions = await fulfillmentService.listShippingOptionsForContext({
        // Parámetros básicos para listar opciones
      })
      console.log("🚢 Shipping options disponibles:", shippingOptions.length)
      shippingOptions.forEach(option => {
        console.log({
          id: option.id,
          name: option.name,
          provider_id: option.provider_id
        })
      })
    } catch (e) {
      console.log("❌ Error al listar shipping options:", e.message)
    }
    
  } catch (error) {
    console.error("❌ Error general:", error.message)
  }
}

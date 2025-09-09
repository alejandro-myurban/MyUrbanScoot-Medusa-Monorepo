import { ExecArgs } from "@medusajs/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function debugCustomerPricelist(
  { container }: ExecArgs = {}
) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  
  // ID del customer que estás probando
  const customerId = "cus_01JSPJEHTGP7HWJ28P9Z7EVA8S"
  
  try {
    logger.info("🔍 Debugging customer price list configuration...")
    
    // 1. Buscar el customer con sus grupos usando GraphQL
    const customerQuery = await query.graph({
      entity: "customer",
      fields: ["id", "email", "groups.*"],
      filters: { id: customerId }
    })
    
    const customer = customerQuery.data[0]
    
    if (!customer) {
      logger.error("❌ Customer not found!")
      return
    }
    
    logger.info("👤 Customer details:", {
      id: customer.id,
      email: customer.email,
      groups: customer.groups?.map(g => ({
        id: g.id,
        name: g.name
      })) || []
    })
    
    if (!customer.groups || customer.groups.length === 0) {
      logger.warn("⚠️ Customer has no groups assigned!")
      return
    }
    
    // 2. Buscar price lists usando GraphQL
    const priceListsQuery = await query.graph({
      entity: "price_list",
      fields: [
        "id", 
        "title", 
        "description", 
        "type", 
        "status", 
        "starts_at", 
        "ends_at",
        "customer_groups.*",
        "prices.*"
      ],
      filters: { status: ["active"] }
    })
    
    const priceLists = priceListsQuery.data
    
    logger.info("📋 Active price lists found:", priceLists.length)
    
    // 3. Verificar cuáles price lists aplican al customer
    const customerGroupIds = customer.groups.map(g => g.id)
    
    for (const priceList of priceLists) {
      const hasMatchingGroup = priceList.customer_groups?.some(
        group => customerGroupIds.includes(group.id)
      )
      
      if (hasMatchingGroup) {
        logger.info("✅ Price list applies to customer:", {
          priceListId: priceList.id,
          title: priceList.title,
          type: priceList.type,
          status: priceList.status,
          startsAt: priceList.starts_at,
          endsAt: priceList.ends_at,
          customerGroups: priceList.customer_groups?.map(g => g.name),
          pricesCount: priceList.prices?.length
        })
        
        // Mostrar algunos precios de ejemplo
        if (priceList.prices?.length > 0) {
          logger.info("💰 Sample prices from this list:", 
            priceList.prices.slice(0, 3).map(p => ({
              id: p.id,
              amount: p.amount,
              currencyCode: p.currency_code,
              variantId: p.variant_id,
              minQuantity: p.min_quantity,
              maxQuantity: p.max_quantity
            }))
          )
        }
      } else {
        logger.info("❌ Price list does NOT apply to customer:", {
          priceListId: priceList.id,
          title: priceList.title,
          customerGroups: priceList.customer_groups?.map(g => g.name) || []
        })
      }
    }
    
    // 4. También revisar pricing module
    try {
      const pricingService = container.resolve(Modules.PRICING)
      
      if (pricingService) {
        logger.info("🏷️ Checking pricing module...")
        
        // Get a sample product variant to test pricing
        const productQuery = await query.graph({
          entity: "product_variant",
          fields: ["id", "title", "product.title"],
          pagination: { take: 1 }
        })
        
        if (productQuery.data?.[0]) {
          const variant = productQuery.data[0]
          
          // Try to calculate price for this variant with customer context
          const priceCalculation = await pricingService.calculatePrices(
            { variant_id: [variant.id] },
            {
              context: {
                currency_code: "eur",
                customer_id: customerId,
                region_id: "reg_01HRJBR3QJ9CGQMSZMD4P8S42E" // You might need to adjust this
              }
            }
          )
          
          logger.info("💲 Price calculation result:", {
            variantId: variant.id,
            productTitle: variant.product?.title,
            variantTitle: variant.title,
            priceCalculation: priceCalculation
          })
        }
      }
    } catch (pricingError) {
      logger.warn("⚠️ Could not access pricing module:", pricingError.message)
    }
    
    logger.info("🏁 Customer price list debug completed")
    
  } catch (error) {
    logger.error("❌ Error debugging customer price list:", error)
  }
}
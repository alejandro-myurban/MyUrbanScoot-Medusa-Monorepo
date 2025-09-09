import { ExecArgs } from "@medusajs/types"

export default async function verifyCustomerPricelistFinal(
  { container }: ExecArgs = {}
) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  
  // ID del customer que estás probando
  const customerId = "cus_01JSPJEHTGP7HWJ28P9Z7EVA8S"
  
  try {
    logger.info("🔍 Final verification of customer price list setup...")
    
    // 1. Buscar el customer
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
    
    logger.info("👤 Customer info:", {
      id: customer.id,
      email: customer.email,
      groupCount: customer.groups?.length || 0,
      groups: customer.groups?.map(g => ({ id: g.id, name: g.name })) || []
    })
    
    if (!customer.groups?.length) {
      logger.error("❌ Customer has no groups! Add customer to a customer group first.")
      return
    }
    
    // 2. Buscar price lists
    const priceListsQuery = await query.graph({
      entity: "price_list", 
      fields: ["id", "title", "status", "type", "starts_at", "ends_at"]
    })
    
    logger.info("📋 All price lists:", priceListsQuery.data.map(pl => ({
      id: pl.id,
      title: pl.title,
      status: pl.status,
      type: pl.type,
      active: pl.status === 'active',
      dateValid: !pl.starts_at || new Date(pl.starts_at) <= new Date(),
      notExpired: !pl.ends_at || new Date(pl.ends_at) >= new Date()
    })))
    
    // 3. Buscar customer group price list relations (tabla de union)
    const cgplQuery = await query.graph({
      entity: "customer_group_price_list",
      fields: ["customer_group_id", "price_list_id"]
    })
    
    logger.info("🔗 Customer Group <-> Price List relations:", cgplQuery.data)
    
    // 4. Check if customer's groups are linked to any price list
    const customerGroupIds = customer.groups.map(g => g.id)
    const applicableRelations = cgplQuery.data.filter(rel => 
      customerGroupIds.includes(rel.customer_group_id)
    )
    
    logger.info("✅ Applicable price list relations for customer:", applicableRelations)
    
    if (!applicableRelations.length) {
      logger.error("❌ No price lists linked to customer's groups!")
      logger.error("💡 Solution: In Medusa Admin, go to Settings > Customer Groups")
      logger.error("💡 Edit the customer group and assign a price list to it")
      return
    }
    
    // 5. Get a sample product variant to test pricing
    const variantQuery = await query.graph({
      entity: "product_variant",
      fields: ["id", "title", "product.title"],
      pagination: { take: 1 }
    })
    
    if (variantQuery.data?.[0]) {
      const variant = variantQuery.data[0]
      
      // 6. Check if there are prices for this variant in applicable price lists
      const priceListIds = applicableRelations.map(rel => rel.price_list_id)
      
      const pricesQuery = await query.graph({
        entity: "price",
        fields: ["id", "amount", "currency_code", "price_list_id", "variant_id"],
        filters: {
          price_list_id: priceListIds,
          variant_id: variant.id
        }
      })
      
      logger.info("💰 Prices found for test variant:", {
        variantId: variant.id,
        variantTitle: variant.title,
        productTitle: variant.product?.title,
        pricesFound: pricesQuery.data.length,
        prices: pricesQuery.data.map(p => ({
          amount: p.amount,
          currency: p.currency_code,
          priceListId: p.price_list_id
        }))
      })
      
      if (!pricesQuery.data.length) {
        logger.warn("⚠️ No special prices found for test variant in customer's price lists")
        logger.warn("💡 Add some products with special prices to the customer's price list")
      }
    }
    
    logger.info("🏁 Final verification completed")
    
  } catch (error) {
    logger.error("❌ Error in final verification:", error)
  }
}
import { ExecArgs } from "@medusajs/types"

export default async function debugCustomerPricelistSimple(
  { container }: ExecArgs = {}
) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  
  // ID del customer que estás probando
  const customerId = "cus_01JSPJEHTGP7HWJ28P9Z7EVA8S"
  
  try {
    logger.info("🔍 Debugging customer price list configuration...")
    
    // 1. Buscar el customer con sus grupos
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
    }
    
    // 2. Buscar todas las price lists
    const priceListsQuery = await query.graph({
      entity: "price_list",
      fields: [
        "id", 
        "title", 
        "description", 
        "type", 
        "status", 
        "starts_at", 
        "ends_at"
      ],
      filters: { status: ["active"] }
    })
    
    const priceLists = priceListsQuery.data
    
    logger.info("📋 Active price lists found:", priceLists.length)
    
    for (const priceList of priceLists) {
      logger.info("📄 Price list details:", {
        id: priceList.id,
        title: priceList.title,
        type: priceList.type,
        status: priceList.status,
        startsAt: priceList.starts_at,
        endsAt: priceList.ends_at
      })
    }
    
    // 3. Buscar customer groups disponibles
    const customerGroupsQuery = await query.graph({
      entity: "customer_group",
      fields: ["id", "name"]
    })
    
    logger.info("👥 All customer groups:", customerGroupsQuery.data)
    
    // 4. Buscar precios específicos
    const pricesQuery = await query.graph({
      entity: "price",
      fields: ["id", "amount", "currency_code", "price_list_id"],
      pagination: { take: 5 }
    })
    
    logger.info("💰 Sample prices:", pricesQuery.data)
    
    logger.info("🏁 Simple debug completed")
    
  } catch (error) {
    logger.error("❌ Error debugging customer price list:", error)
  }
}
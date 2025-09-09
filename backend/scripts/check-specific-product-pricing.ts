import { ExecArgs } from "@medusajs/types"

export default async function checkSpecificProductPricing(
  { container }: ExecArgs = {}
) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  
  // IDs from your logs
  const productId = "prod_01JWDPFC9ARCBQ5V48AR6MMN92"
  const customerId = "cus_01JSPJEHTGP7HWJ28P9Z7EVA8S"
  const regionId = "reg_01JSP4QGE8SADHTVCS3M91T6B2"
  
  try {
    logger.info("🔍 Checking specific product pricing configuration...")
    
    // 1. Get the specific product and its variants
    const productQuery = await query.graph({
      entity: "product",
      fields: ["id", "title", "variants.*"],
      filters: { id: productId }
    })
    
    const product = productQuery.data[0]
    
    if (!product) {
      logger.error("❌ Product not found!")
      return
    }
    
    logger.info("📦 Product details:", {
      id: product.id,
      title: product.title,
      variantCount: product.variants?.length
    })
    
    // 2. Get customer and their groups
    const customerQuery = await query.graph({
      entity: "customer",
      fields: ["id", "email", "groups.*"],
      filters: { id: customerId }
    })
    
    const customer = customerQuery.data[0]
    logger.info("👤 Customer groups:", customer.groups?.map(g => ({ id: g.id, name: g.name })))
    
    // 3. Get all prices for this product's variants
    const pricesQuery = await query.graph({
      entity: "price",
      fields: ["id", "amount", "currency_code", "price_list_id", "variant_id"],
      filters: {
        variant_id: product.variants?.map(v => v.id) || []
      }
    })
    
    logger.info("💰 All prices for this product:", pricesQuery.data.map(p => ({
      variantId: p.variant_id,
      amount: p.amount,
      currency: p.currency_code,
      priceListId: p.price_list_id,
      isRegularPrice: !p.price_list_id,
      isPriceListPrice: !!p.price_list_id
    })))
    
    // 4. Get region info
    const regionQuery = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
      filters: { id: regionId }
    })
    
    logger.info("🌍 Region details:", regionQuery.data[0])
    
    // 5. Get all price lists with active status
    const priceListsQuery = await query.graph({
      entity: "price_list",
      fields: ["id", "title", "status", "type"]
    })
    
    logger.info("📋 All price lists:", priceListsQuery.data)
    
    // 6. Check which price lists have prices for this product
    const priceListPrices = pricesQuery.data.filter(p => p.price_list_id)
    const priceListIds = [...new Set(priceListPrices.map(p => p.price_list_id))]
    
    if (priceListIds.length > 0) {
      logger.info("✅ This product HAS special prices in price lists:", priceListIds)
      
      for (const priceListId of priceListIds) {
        const prices = priceListPrices.filter(p => p.price_list_id === priceListId)
        logger.info(`💲 Price List ${priceListId} prices:`, prices.map(p => ({
          amount: p.amount,
          currency: p.currency_code,
          variantId: p.variant_id
        })))
      }
    } else {
      logger.warn("⚠️ This product has NO special prices in any price list!")
      logger.warn("💡 Add this product to your price list in Admin with a special price")
    }
    
    logger.info("🏁 Specific product pricing check completed")
    
  } catch (error) {
    logger.error("❌ Error checking specific product pricing:", error)
  }
}
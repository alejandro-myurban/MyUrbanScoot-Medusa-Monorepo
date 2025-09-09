import { ExecArgs } from "@medusajs/types"

export default async function adminConfigGuide(
  { container }: ExecArgs = {}
) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  
  // ID del customer que estás probando
  const customerId = "cus_01JSPJEHTGP7HWJ28P9Z7EVA8S"
  
  try {
    logger.info("📋 ADMIN CONFIGURATION GUIDE")
    logger.info("=" .repeat(50))
    
    // 1. Get customer info
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
    
    logger.info("👤 CUSTOMER INFO:")
    logger.info(`   Email: ${customer.email}`)
    logger.info(`   ID: ${customer.id}`)
    
    if (!customer.groups?.length) {
      logger.error("❌ PROBLEM: Customer has no groups!")
      logger.info("🔧 FIX: Go to Medusa Admin → Customers → Find your customer → Edit → Add to a Customer Group")
      return
    }
    
    logger.info(`   Groups: ${customer.groups.map(g => g.name).join(", ")}`)
    
    // 2. Get all price lists
    const priceListsQuery = await query.graph({
      entity: "price_list",
      fields: ["id", "title", "status", "type", "starts_at", "ends_at"]
    })
    
    logger.info("\n📋 PRICE LISTS:")
    for (const pl of priceListsQuery.data) {
      const isActive = pl.status === 'active'
      const isDateValid = !pl.starts_at || new Date(pl.starts_at) <= new Date()
      const isNotExpired = !pl.ends_at || new Date(pl.ends_at) >= new Date()
      const isValid = isActive && isDateValid && isNotExpired
      
      logger.info(`   ${isValid ? '✅' : '❌'} ${pl.title} (${pl.status})`)
      if (!isActive) logger.info(`      ⚠️  Status is not 'active'`)
      if (!isDateValid) logger.info(`      ⚠️  Start date is in the future`)
      if (!isNotExpired) logger.info(`      ⚠️  End date has passed`)
    }
    
    // 3. Get sample products
    const productsQuery = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      pagination: { take: 3 }
    })
    
    logger.info("\n🛍️  SAMPLE PRODUCTS:")
    for (const product of productsQuery.data) {
      logger.info(`   ${product.title} (${product.id})`)
    }
    
    logger.info("\n🔧 STEPS TO FIX IN MEDUSA ADMIN:")
    logger.info("1. Go to http://localhost:9000 (Medusa Admin)")
    logger.info("2. Settings → Customer Groups")
    logger.info(`3. Find group: ${customer.groups.map(g => g.name).join(" or ")}`)
    logger.info("4. Edit the group → Assign a Price List")
    logger.info("5. Settings → Price Lists")
    logger.info("6. Edit your Price List:")
    logger.info("   - Status: Active ✅")
    logger.info("   - Start Date: Empty or past date ✅") 
    logger.info("   - End Date: Empty or future date ✅")
    logger.info("   - Customer Groups: Include your customer group ✅")
    logger.info("7. Add Products to Price List:")
    logger.info("   - Click 'Edit Prices'")
    logger.info("   - Add products with special prices")
    logger.info("   - Make sure to select EUR currency")
    
    logger.info("\n🧪 TESTING:")
    logger.info("1. Reload storefront")
    logger.info("2. Login with your customer")
    logger.info("3. View a product that has a price in the price list")
    logger.info("4. Check logs for priceListType !== null")
    
  } catch (error) {
    logger.error("❌ Error in admin config guide:", error)
  }
}
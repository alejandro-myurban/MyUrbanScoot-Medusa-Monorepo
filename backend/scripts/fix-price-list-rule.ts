import { DataSource } from "typeorm"

const dataSourceConfig = {
  type: "postgres" as const,
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  username: process.env.DATABASE_USERNAME || "postgres",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "medusa-starter-default",
  url: process.env.DATABASE_URL,
  logging: false,
  synchronize: false,
  entities: [],
}

export default async function fixPriceListRule() {
  const dataSource = new DataSource(dataSourceConfig)
  
  try {
    await dataSource.initialize()
    console.log("✅ Connected to database")

    const priceListId = 'plist_01K0XWBAMXMGRRF1N6JHTPZ95S'
    const customerGroupId = 'cusgroup_01JYGX09SAM1HPQM369DBC6J77' // B2C group

    // 1. Verificar reglas existentes
    console.log("\n🔍 1. EXISTING PRICE RULES FOR THIS PRICE LIST:")
    const existingRules = await dataSource.query(`
      SELECT * FROM price_rule 
      WHERE price_list_id = $1
    `, [priceListId])
    console.table(existingRules)

    // 2. Verificar si ya existe una regla para customer_group_id
    const existingCustomerGroupRule = existingRules.find(rule => rule.attribute === 'customer_group_id')
    
    if (existingCustomerGroupRule) {
      console.log(`\n✅ Customer group rule already exists with value: ${existingCustomerGroupRule.value}`)
      
      if (existingCustomerGroupRule.value !== customerGroupId) {
        console.log(`\n⚠️  Rule exists but points to different group. Updating...`)
        await dataSource.query(`
          UPDATE price_rule 
          SET value = $1, updated_at = NOW()
          WHERE id = $2
        `, [customerGroupId, existingCustomerGroupRule.id])
        console.log("✅ Updated customer group rule")
      }
    } else {
      console.log("\n❌ No customer group rule found. Creating one...")
      
      // Generar ID único para la regla
      const ruleId = `rule_${Date.now().toString(36)}`
      
      await dataSource.query(`
        INSERT INTO price_rule (id, value, priority, price_list_id, attribute, operator, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [
        ruleId,
        customerGroupId,
        0,  // priority
        priceListId,
        'customer_group_id',
        'eq'  // operator equals
      ])
      
      console.log("✅ Created customer group rule")
    }

    // 3. Verificar reglas después del cambio
    console.log("\n🔍 3. RULES AFTER CHANGES:")
    const updatedRules = await dataSource.query(`
      SELECT * FROM price_rule 
      WHERE price_list_id = $1
    `, [priceListId])
    console.table(updatedRules)

    // 4. Actualizar rules_count en price_list
    const rulesCount = updatedRules.length
    await dataSource.query(`
      UPDATE price_list 
      SET rules_count = $1, updated_at = NOW()
      WHERE id = $2
    `, [rulesCount, priceListId])
    
    console.log(`✅ Updated price_list rules_count to ${rulesCount}`)

    console.log("\n🎉 Price list rule configuration completed!")
    console.log("\n🔧 Next steps:")
    console.log("1. Test the storefront to see if prices now apply correctly")
    console.log("2. Check the logs to verify price_list_type is no longer null")
    
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}
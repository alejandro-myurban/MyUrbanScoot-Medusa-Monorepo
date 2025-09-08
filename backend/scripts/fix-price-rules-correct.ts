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

export default async function fixPriceRulesCorrect() {
  const dataSource = new DataSource(dataSourceConfig)
  
  try {
    await dataSource.initialize()
    console.log("✅ Connected to database")

    const priceListId = 'plist_01K0XWBAMXMGRRF1N6JHTPZ95S'
    const customerGroupId = 'cusgroup_01JYGX09SAM1HPQM369DBC6J77' // B2C group

    // 1. Obtener todos los precios de esta price list
    console.log("\n🔍 1. PRICES IN PRICE LIST:")
    const pricesInList = await dataSource.query(`
      SELECT id, amount, currency_code, rules_count 
      FROM price 
      WHERE price_list_id = $1
    `, [priceListId])
    console.table(pricesInList)

    // 2. Verificar reglas existentes para estos precios
    console.log("\n🔍 2. EXISTING RULES FOR THESE PRICES:")
    for (const price of pricesInList) {
      const rules = await dataSource.query(`
        SELECT * FROM price_rule WHERE price_id = $1
      `, [price.id])
      
      if (rules.length > 0) {
        console.log(`\n💰 Price ${price.id} (${price.amount} ${price.currency_code}) rules:`)
        console.table(rules)
      } else {
        console.log(`\n❌ Price ${price.id} (${price.amount} ${price.currency_code}) has NO RULES`)
      }
    }

    // 3. Agregar customer_group_id rules a todos los precios que no la tengan
    console.log("\n🔧 3. ADDING CUSTOMER GROUP RULES:")
    
    for (const price of pricesInList) {
      // Verificar si ya tiene una regla de customer_group_id
      const existingRule = await dataSource.query(`
        SELECT * FROM price_rule 
        WHERE price_id = $1 AND attribute = 'customer_group_id'
      `, [price.id])
      
      if (existingRule.length === 0) {
        console.log(`\n➕ Adding customer_group_id rule to price ${price.id}...`)
        
        // Generar ID único
        const ruleId = `rule_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`
        
        await dataSource.query(`
          INSERT INTO price_rule (id, value, priority, price_id, attribute, operator, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [
          ruleId,
          customerGroupId,
          0,  // priority
          price.id,
          'customer_group_id',
          'eq'
        ])
        
        // Actualizar rules_count del price
        const newRulesCount = price.rules_count + 1
        await dataSource.query(`
          UPDATE price 
          SET rules_count = $1, updated_at = NOW()
          WHERE id = $2
        `, [newRulesCount, price.id])
        
        console.log(`✅ Added rule to price ${price.id}`)
      } else {
        console.log(`\n✅ Price ${price.id} already has customer_group_id rule`)
      }
    }

    // 4. Verificar el resultado final
    console.log("\n🔍 4. FINAL VERIFICATION:")
    for (const price of pricesInList) {
      const allRules = await dataSource.query(`
        SELECT attribute, operator, value 
        FROM price_rule 
        WHERE price_id = $1
      `, [price.id])
      
      console.log(`\n💰 Price ${price.id} final rules:`)
      console.table(allRules)
    }

    console.log("\n🎉 Price rules configuration completed!")
    console.log("\n🔧 Next steps:")
    console.log("1. Test the storefront - prices should now apply to B2C customers")
    console.log("2. Check the debug logs to verify price_list_type shows 'override'")
    
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}
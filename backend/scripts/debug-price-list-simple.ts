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

export default async function debugPriceListSimple() {
  const dataSource = new DataSource(dataSourceConfig)
  
  try {
    await dataSource.initialize()
    console.log("✅ Connected to database")

    const customerId = 'cus_01JSPJEHTGP7HWJ28P9Z7EVA8S'
    const priceListId = 'plist_01K0XWBAMXMGRRF1N6JHTPZ95S'
    
    // 1. Buscar todas las tablas relacionadas con price_list
    console.log("\n🔍 1. PRICE LIST RELATED TABLES:")
    const priceListTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%price%list%' OR table_name LIKE '%rule%'
      ORDER BY table_name
    `)
    console.table(priceListTables)

    // 2. Ver la estructura de price_list_rule si existe
    console.log("\n🔍 2. PRICE LIST RULE STRUCTURE:")
    try {
      const priceListRuleColumns = await dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'price_list_rule'
        ORDER BY ordinal_position
      `)
      console.table(priceListRuleColumns)
    } catch (error) {
      console.log("Table price_list_rule does not exist")
    }

    // 3. Buscar precios asociados a la price list
    console.log("\n🔍 3. PRICES IN THIS PRICE LIST:")
    const priceListPrices = await dataSource.query(`
      SELECT 
        p.id,
        p.amount,
        p.currency_code,
        p.variant_id,
        pv.title as variant_title,
        pv.sku,
        pr.title as product_title
      FROM price p
      LEFT JOIN product_variant pv ON p.variant_id = pv.id
      LEFT JOIN product pr ON pv.product_id = pr.id
      WHERE p.price_list_id = $1
      ORDER BY pr.title, pv.title
      LIMIT 10
    `, [priceListId])
    
    console.table(priceListPrices)

    // 4. Verificar si existe price_rule o similar
    console.log("\n🔍 4. CHECKING FOR PRICE RULES:")
    try {
      const priceRules = await dataSource.query(`
        SELECT * FROM price_rule WHERE price_list_id = $1
      `, [priceListId])
      console.table(priceRules)
    } catch (error) {
      console.log("Table price_rule does not exist or has different structure")
    }

    // 5. Búsqueda más amplia de reglas
    console.log("\n🔍 5. SEARCHING FOR CUSTOMER GROUP RULES:")
    const customerGroupId = 'cusgroup_01JYGX09SAM1HPQM369DBC6J77'
    
    try {
      // Buscar cualquier tabla que contenga tanto price_list_id como customer_group_id
      const ruleTables = await dataSource.query(`
        SELECT table_name, column_name
        FROM information_schema.columns 
        WHERE column_name IN ('price_list_id', 'customer_group_id')
        ORDER BY table_name, column_name
      `)
      console.table(ruleTables)
    } catch (error) {
      console.log("Error searching for rule tables:", error.message)
    }

    console.log("\n✅ Simple debugging completed")
    
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}
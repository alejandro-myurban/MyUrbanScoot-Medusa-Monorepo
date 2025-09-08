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

export default async function explorePricingTables() {
  const dataSource = new DataSource(dataSourceConfig)
  
  try {
    await dataSource.initialize()
    console.log("✅ Connected to database")

    // 1. Explorar estructura de la tabla price
    console.log("\n🔍 1. PRICE TABLE STRUCTURE:")
    const priceColumns = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'price'
      ORDER BY ordinal_position
    `)
    console.table(priceColumns)

    // 2. Ver algunos registros de la tabla price
    console.log("\n🔍 2. SAMPLE PRICE RECORDS:")
    const samplePrices = await dataSource.query(`
      SELECT * FROM price 
      WHERE price_list_id = $1
      LIMIT 3
    `, ['plist_01K0XWBAMXMGRRF1N6JHTPZ95S'])
    console.table(samplePrices)

    // 3. Buscar todas las tablas que contengan 'rule' en el nombre
    console.log("\n🔍 3. ALL RULE-RELATED TABLES:")
    const ruleTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%rule%'
      ORDER BY table_name
    `)
    console.table(ruleTables)

    // 4. Explorar la tabla price_rule si existe
    console.log("\n🔍 4. PRICE RULE TABLE (if exists):")
    try {
      const priceRuleColumns = await dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'price_rule'
        ORDER BY ordinal_position
      `)
      if (priceRuleColumns.length > 0) {
        console.table(priceRuleColumns)
        
        // Ver registros de price_rule
        const priceRuleRecords = await dataSource.query(`
          SELECT * FROM price_rule 
          WHERE price_list_id = $1
        `, ['plist_01K0XWBAMXMGRRF1N6JHTPZ95S'])
        console.log("\n🔍 4b. PRICE RULE RECORDS:")
        console.table(priceRuleRecords)
      }
    } catch (error) {
      console.log("price_rule table does not exist")
    }

    // 5. Verificar si hay una tabla price_list_customer_group o similar
    console.log("\n🔍 5. CUSTOMER GROUP ASSOCIATION TABLES:")
    const customerGroupTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%customer%group%' OR table_name LIKE '%price%list%'
      ORDER BY table_name
    `)
    console.table(customerGroupTables)

    // 6. Verificar directamente si existe la asociación
    console.log("\n🔍 6. DIRECT ASSOCIATION CHECK:")
    try {
      const association = await dataSource.query(`
        SELECT table_name, column_name
        FROM information_schema.columns 
        WHERE column_name = 'price_list_id' OR column_name = 'customer_group_id'
        ORDER BY table_name, column_name
      `)
      console.table(association)
    } catch (error) {
      console.log("Error checking associations:", error.message)
    }

    console.log("\n✅ Exploration completed")
    
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}
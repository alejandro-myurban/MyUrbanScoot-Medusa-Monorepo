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

export default async function debugPriceListDetailed() {
  const dataSource = new DataSource(dataSourceConfig)
  
  try {
    await dataSource.initialize()
    console.log("✅ Connected to database")

    const customerId = 'cus_01JSPJEHTGP7HWJ28P9Z7EVA8S'
    const priceListId = 'plist_01K0XWBAMXMGRRF1N6JHTPZ95S'
    
    // 1. Verificar customer y su grupo
    console.log("\n🔍 1. CUSTOMER AND GROUP INFO:")
    const customerInfo = await dataSource.query(`
      SELECT 
        c.id as customer_id,
        c.email,
        cg.id as group_id,
        cg.name as group_name
      FROM customer c
      LEFT JOIN customer_group_customer cgc ON c.id = cgc.customer_id
      LEFT JOIN customer_group cg ON cgc.customer_group_id = cg.id
      WHERE c.id = $1
    `, [customerId])
    
    console.table(customerInfo)

    // 2. Verificar estructura de price_list primero
    console.log("\n🔍 2. PRICE LIST TABLE STRUCTURE:")
    const priceListColumns = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'price_list'
      ORDER BY ordinal_position
    `)
    console.table(priceListColumns)
    
    // 3. Verificar price list básico
    console.log("\n🔍 3. PRICE LIST BASIC INFO:")
    const priceListInfo = await dataSource.query(`
      SELECT *
      FROM price_list pl
      WHERE pl.id = $1
    `, [priceListId])
    
    console.table(priceListInfo)

    // 4. Verificar reglas de la price list
    console.log("\n🔍 4. PRICE LIST RULES:")
    const priceListRules = await dataSource.query(`
      SELECT 
        plr.id,
        plr.rule_type_id,
        rt.rule_attribute,
        rt.name as rule_type_name,
        plrv.value
      FROM price_list_rule plr
      JOIN rule_type rt ON plr.rule_type_id = rt.id
      LEFT JOIN price_list_rule_value plrv ON plr.id = plrv.price_list_rule_id
      WHERE plr.price_list_id = $1
    `, [priceListId])
    
    console.table(priceListRules)

    // 5. Verificar precios específicos en la price list
    console.log("\n🔍 5. PRICE LIST PRICES:")
    const priceListPrices = await dataSource.query(`
      SELECT 
        pp.id,
        pp.variant_id,
        pp.amount,
        pp.currency_code,
        p.title as product_title,
        pv.title as variant_title
      FROM price p
      LEFT JOIN product_variant pv ON p.variant_id = pv.id
      LEFT JOIN product pr ON pv.product_id = pr.id
      WHERE p.price_list_id = $1
      ORDER BY pr.title, pv.title
      LIMIT 10
    `, [priceListId])
    
    console.table(priceListPrices)

    // 6. Verificar si hay conflictos de fechas
    console.log("\n🔍 6. PRICE LIST DATE CHECK:")
    const now = new Date().toISOString()
    const dateCheck = await dataSource.query(`
      SELECT 
        pl.*,
        CASE 
          WHEN pl.starts_at IS NULL OR pl.starts_at <= $2 THEN 'VALID_START'
          ELSE 'NOT_STARTED'
        END as start_status,
        CASE 
          WHEN pl.ends_at IS NULL OR pl.ends_at >= $2 THEN 'VALID_END'
          ELSE 'EXPIRED'
        END as end_status
      FROM price_list pl
      WHERE pl.id = $1
    `, [priceListId, now])
    
    console.table(dateCheck)

    // 7. Verificar customer groups asociados a la price list
    console.log("\n🔍 7. CUSTOMER GROUPS FOR PRICE LIST:")
    const priceListGroups = await dataSource.query(`
      SELECT 
        cg.id as group_id,
        cg.name as group_name,
        COUNT(cgc.customer_id) as customer_count
      FROM price_list_rule plr
      JOIN rule_type rt ON plr.rule_type_id = rt.id
      JOIN price_list_rule_value plrv ON plr.id = plrv.price_list_rule_id
      JOIN customer_group cg ON plrv.value = cg.id
      LEFT JOIN customer_group_customer cgc ON cg.id = cgc.customer_group_id
      WHERE plr.price_list_id = $1 AND rt.rule_attribute = 'customer_group_id'
      GROUP BY cg.id, cg.name
    `, [priceListId])
    
    console.table(priceListGroups)

    console.log("\n✅ Price list debugging completed")
    
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

debugPriceListDetailed().catch(console.error)
// Script de diagnóstico con TypeORM para Medusa 2.0
// Ejecutar con: npx medusa exec scripts/debug-pricing-orm.ts

import { DataSource } from "typeorm"

const DEBUG_CONFIG = {
  CUSTOMER_EMAIL: "alejandro@myurbanscoot.com",
}

export default async () => {
  console.log("🔍 Iniciando diagnóstico de pricing...\n")
  
  try {
    // Crear conexión directa a PostgreSQL usando variables de entorno
    const dataSource = new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
    
    await dataSource.initialize()
    console.log("✅ Base de datos conectada directamente\n")
    
    const queryRunner = dataSource.createQueryRunner()
    
    // === 1. VERIFICAR CUSTOMER ===
    console.log("👤 === VERIFICANDO CUSTOMER ===")
    
    const customerQuery = `
      SELECT id, email, first_name, last_name
      FROM customer 
      WHERE email = $1
    `
    
    const customers = await queryRunner.query(customerQuery, [DEBUG_CONFIG.CUSTOMER_EMAIL])
    
    if (customers.length === 0) {
      console.log(`❌ Customer no encontrado: ${DEBUG_CONFIG.CUSTOMER_EMAIL}`)
      await dataSource.destroy()
      return
    }
    
    const customer = customers[0]
    console.log(`✅ Customer encontrado: ${customer.email} (ID: ${customer.id})`)
    console.log(`   Nombre: ${customer.first_name || ''} ${customer.last_name || ''}`)
    
    // === 2. VERIFICAR CUSTOMER GROUPS ===
    console.log("\n👥 === VERIFICANDO CUSTOMER GROUPS ===")
    
    const customerGroupQuery = `
      SELECT cg.id, cg.name
      FROM customer_group cg
      JOIN customer_group_customers cgc ON cg.id = cgc.customer_group_id
      WHERE cgc.customer_id = $1
    `
    
    const customerGroups = await queryRunner.query(customerGroupQuery, [customer.id])
    
    if (customerGroups.length === 0) {
      console.log("⚠️  Customer NO pertenece a ningún grupo")
      
      // Mostrar todos los customer groups disponibles
      const allGroupsQuery = `SELECT id, name FROM customer_group ORDER BY name`
      const allGroups = await queryRunner.query(allGroupsQuery)
      
      console.log("\n📋 Customer Groups disponibles:")
      allGroups.forEach(group => {
        console.log(`  - ${group.name} (ID: ${group.id})`)
      })
      
    } else {
      console.log("📋 Customer Groups del usuario:")
      customerGroups.forEach(group => {
        console.log(`  - ${group.name} (ID: ${group.id})`)
      })
    }
    
    // === 3. VERIFICAR PRICE LISTS ===
    console.log("\n💰 === VERIFICANDO PRICE LISTS ===")
    
    // Todas las price lists
    const allPriceListsQuery = `
      SELECT 
        pl.id, 
        pl.name, 
        pl.status, 
        pl.type, 
        pl.starts_at, 
        pl.ends_at,
        pl.created_at,
        COUNT(DISTINCT ma.id) as price_count
      FROM price_list pl
      LEFT JOIN money_amount ma ON pl.id = ma.price_list_id
      GROUP BY pl.id, pl.name, pl.status, pl.type, pl.starts_at, pl.ends_at, pl.created_at
      ORDER BY pl.created_at DESC
    `
    
    const allPriceLists = await queryRunner.query(allPriceListsQuery)
    console.log(`📋 Total price lists en el sistema: ${allPriceLists.length}`)
    
    if (allPriceLists.length > 0) {
      console.log("\n🔍 Todas las Price Lists:")
      allPriceLists.forEach(pl => {
        const now = new Date()
        const isActive = pl.status === 'active' &&
          (!pl.starts_at || new Date(pl.starts_at) <= now) &&
          (!pl.ends_at || new Date(pl.ends_at) >= now)
        
        console.log(`  ${isActive ? '✅' : '❌'} ${pl.name}`)
        console.log(`     Status: ${pl.status}`)
        console.log(`     Type: ${pl.type}`)
        console.log(`     Fechas: ${pl.starts_at || 'Sin inicio'} - ${pl.ends_at || 'Sin fin'}`)
        console.log(`     Precios: ${pl.price_count}`)
        console.log()
      })
    }
    
    // === 4. PRICE LISTS CON CUSTOMER GROUPS ===
    console.log("🎯 === PRICE LISTS Y CUSTOMER GROUPS ===")
    
    const priceListGroupsQuery = `
      SELECT 
        pl.id as price_list_id,
        pl.name as price_list_name,
        pl.status,
        pl.type,
        cg.id as group_id,
        cg.name as group_name,
        COUNT(DISTINCT ma.id) as price_count
      FROM price_list pl
      LEFT JOIN price_list_customer_groups plcg ON pl.id = plcg.price_list_id
      LEFT JOIN customer_group cg ON plcg.customer_group_id = cg.id
      LEFT JOIN money_amount ma ON pl.id = ma.price_list_id
      GROUP BY pl.id, pl.name, pl.status, pl.type, cg.id, cg.name
      ORDER BY pl.name
    `
    
    const priceListGroups = await queryRunner.query(priceListGroupsQuery)
    
    if (priceListGroups.length > 0) {
      console.log("🔗 Asociaciones Price List ↔ Customer Group:")
      priceListGroups.forEach(row => {
        const groupName = row.group_name || '❌ Sin grupo asignado'
        console.log(`  📋 ${row.price_list_name} (${row.status})`)
        console.log(`     → ${groupName}`)
        console.log(`     → ${row.price_count} precios`)
        console.log()
      })
    }
    
    // === 5. PRICE LISTS PARA ESTE CUSTOMER ===
    if (customerGroups.length > 0) {
      console.log("🎯 === PRICE LISTS ESPECÍFICAS PARA ESTE CUSTOMER ===")
      
      const customerGroupIds = customerGroups.map(g => g.id)
      const customerPriceListQuery = `
        SELECT 
          pl.id,
          pl.name,
          pl.status,
          pl.type,
          pl.starts_at,
          pl.ends_at,
          cg.name as group_name,
          COUNT(DISTINCT ma.id) as price_count
        FROM price_list pl
        JOIN price_list_customer_groups plcg ON pl.id = plcg.price_list_id
        JOIN customer_group cg ON plcg.customer_group_id = cg.id
        LEFT JOIN money_amount ma ON pl.id = ma.price_list_id
        WHERE cg.id = ANY($1)
        GROUP BY pl.id, pl.name, pl.status, pl.type, pl.starts_at, pl.ends_at, cg.name
        ORDER BY pl.status DESC, pl.name
      `
      
      const customerPriceLists = await queryRunner.query(customerPriceListQuery, [customerGroupIds])
      
      if (customerPriceLists.length === 0) {
        console.log("❌ No hay price lists asociadas a los customer groups de este usuario")
      } else {
        console.log(`✅ Encontradas ${customerPriceLists.length} price lists para este customer:`)
        
        for (const pl of customerPriceLists) {
          const now = new Date()
          const isActive = pl.status === 'active' &&
            (!pl.starts_at || new Date(pl.starts_at) <= now) &&
            (!pl.ends_at || new Date(pl.ends_at) >= now)
          
          console.log(`\n  📋 ${pl.name}`)
          console.log(`     Status: ${pl.status} ${isActive ? '✅' : '❌'}`)
          console.log(`     Type: ${pl.type}`)
          console.log(`     Customer Group: ${pl.group_name}`)
          console.log(`     Fechas: ${pl.starts_at || 'Sin inicio'} - ${pl.ends_at || 'Sin fin'}`)
          console.log(`     Precios definidos: ${pl.price_count}`)
          
          if (!isActive) {
            if (pl.status !== 'active') {
              console.log(`     ⚠️  PROBLEMA: Status no es 'active'`)
            }
            if (pl.starts_at && new Date(pl.starts_at) > now) {
              console.log(`     ⚠️  PROBLEMA: Fecha inicio es en el futuro`)
            }
            if (pl.ends_at && new Date(pl.ends_at) < now) {
              console.log(`     ⚠️  PROBLEMA: Fecha fin ya pasó`)
            }
          }
          
          if (pl.price_count === 0) {
            console.log(`     ⚠️  PROBLEMA: No hay precios definidos`)
          }
          
          // Mostrar algunos precios de esta price list
          if (pl.price_count > 0) {
            const pricesQuery = `
              SELECT 
                ma.amount,
                ma.currency_code,
                pv.title as variant_title,
                pv.sku,
                p.title as product_title
              FROM money_amount ma
              LEFT JOIN product_variant pv ON ma.variant_id = pv.id
              LEFT JOIN product p ON pv.product_id = p.id
              WHERE ma.price_list_id = $1
              ORDER BY p.title
              LIMIT 5
            `
            
            const prices = await queryRunner.query(pricesQuery, [pl.id])
            console.log(`     💰 Ejemplos de precios:`)
            prices.forEach(price => {
              const productName = price.product_title || 'Producto sin nombre'
              const variantName = price.variant_title || price.sku || 'Variante sin nombre'
              console.log(`       - ${productName} - ${variantName}: ${price.amount/100} ${price.currency_code}`)
            })
          }
        }
      }
    }
    
    // === 6. REGIONES ===
    console.log("\n🌍 === VERIFICANDO REGIONES ===")
    
    const regionsQuery = `SELECT id, name, currency_code FROM region ORDER BY name`
    const regions = await queryRunner.query(regionsQuery)
    
    console.log(`📍 Regiones disponibles: ${regions.length}`)
    regions.forEach(region => {
      console.log(`  - ${region.name} (${region.currency_code}) - ID: ${region.id}`)
    })
    
    // === 7. DIAGNÓSTICO FINAL ===
    console.log("\n🔧 === DIAGNÓSTICO Y RECOMENDACIONES ===")
    
    if (customerGroups.length === 0) {
      console.log("❌ PROBLEMA PRINCIPAL: Customer no está en ningún grupo")
      console.log("   → Solución: Añadir customer a un customer group desde el admin")
      console.log("   → Después asociar ese customer group a una price list")
    } else {
      console.log("✅ Customer está en grupos correctamente")
      
      const customerGroupIds = customerGroups.map(g => g.id)
      const customerPriceLists = await queryRunner.query(`
        SELECT 
          pl.id, pl.name, pl.status, pl.starts_at, pl.ends_at,
          COUNT(DISTINCT ma.id) as price_count
        FROM price_list pl
        JOIN price_list_customer_groups plcg ON pl.id = plcg.price_list_id
        LEFT JOIN money_amount ma ON pl.id = ma.price_list_id
        WHERE plcg.customer_group_id = ANY($1)
        GROUP BY pl.id, pl.name, pl.status, pl.starts_at, pl.ends_at
      `, [customerGroupIds])
      
      const hasActivePriceList = customerPriceLists?.some(pl => {
        const now = new Date()
        return pl.status === 'active' &&
          (!pl.starts_at || new Date(pl.starts_at) <= now) &&
          (!pl.ends_at || new Date(pl.ends_at) >= now) &&
          pl.price_count > 0
      })
      
      if (!hasActivePriceList) {
        console.log("❌ PROBLEMA: No hay price lists activas con precios para este customer")
        console.log("   → Verificar que la price list tenga status 'active'")
        console.log("   → Verificar fechas de vigencia (starts_at / ends_at)")
        console.log("   → Verificar que tenga precios definidos (money_amount)")
      } else {
        console.log("✅ Price lists configuradas correctamente")
        console.log("\n💡 Si aún no se aplican los precios, verificar:")
        console.log("   → Frontend: Contexto incluye customer_id al hacer pricing requests")
        console.log("   → Región: Usar la región correcta en pricing context")
        console.log("   → Cache: Limpiar cache del pricing engine si es necesario")
        console.log("   → API: Verificar que el customer esté logueado correctamente")
      }
    }
    
    await queryRunner.release()
    await dataSource.destroy()
    
  } catch (error) {
    console.error("❌ Error en diagnóstico:", error)
  }
  
  console.log("\n🏁 Diagnóstico completado")
}
// Script de diagnóstico para price lists en Medusa 2.0
// Ejecutar con: npm run exec scripts/debug-pricing.js

const DEBUG_CONFIG = {
  // Cambia estos valores por los reales que quieres debuggear
  CUSTOMER_EMAIL: "customer@example.com", // 👈 CAMBIAR POR EMAIL REAL
  REGION_ID: null,   // Se detectará automáticamente si es null
}



export default async ({ container }) => {
  console.log("🔍 Iniciando diagnóstico de pricing...\n")
  
  try {
    // Resolver servicios
    const query = container.resolve("query")
    const manager = container.resolve("manager")
    
    console.log("✅ Servicios inicializados correctamente\n")
    
    // === 1. VERIFICAR CUSTOMER Y CUSTOMER GROUPS ===
    console.log("👤 === VERIFICANDO CUSTOMER Y GRUPOS ===")
    
    let customer = null
    try {
      const customerResult = await query.graph({
        entity: "customer",
        filters: { email: DEBUG_CONFIG.CUSTOMER_EMAIL },
        fields: ["id", "email", "groups.id", "groups.name"]
      })
      
      if (customerResult.data.length === 0) {
        console.log(`❌ Customer no encontrado: ${DEBUG_CONFIG.CUSTOMER_EMAIL}`)
        return
      }
      
      customer = customerResult.data[0]
      console.log(`✅ Customer encontrado: ${customer.email} (ID: ${customer.id})`)
      
      if (customer.groups && customer.groups.length > 0) {
        console.log("📋 Customer Groups:")
        customer.groups.forEach(group => {
          console.log(`  - ${group.name} (ID: ${group.id})`)
        })
      } else {
        console.log("⚠️  Customer NO pertenece a ningún grupo")
      }
    } catch (error) {
      console.log(`❌ Error buscando customer: ${error.message}`)
      return
    }
    
    // === 2. VERIFICAR PRICE LISTS ===
    console.log("\n💰 === VERIFICANDO PRICE LISTS ===")
    
    try {
      // Obtener todas las price lists
      const priceListsResult = await query.graph({
        entity: "price_list",
        fields: [
          "id", "name", "status", "type", "starts_at", "ends_at",
          "customer_groups.id", "customer_groups.name",
          "prices.id", "prices.amount", "prices.currency_code", 
          "prices.variant_id"
        ]
      })
      
      console.log(`📋 Total price lists encontradas: ${priceListsResult.data.length}`)
      
      // Filtrar price lists que aplican a este customer
      const customerGroupIds = customer.groups?.map(g => g.id) || []
      const applicablePriceLists = priceListsResult.data.filter(pl => 
        pl.customer_groups?.some(cg => customerGroupIds.includes(cg.id))
      )
      
      if (applicablePriceLists.length === 0) {
        console.log("❌ No hay price lists asociadas a los customer groups del usuario\n")
        
        // Mostrar todas las price lists para referencia
        console.log("📝 Todas las Price Lists disponibles:")
        priceListsResult.data.forEach(pl => {
          console.log(`\n  📋 ${pl.name} (ID: ${pl.id})`)
          console.log(`     Status: ${pl.status}`)
          console.log(`     Type: ${pl.type}`)
          console.log(`     Customer Groups: ${pl.customer_groups?.map(cg => cg.name).join(', ') || 'Ninguno'}`)
          console.log(`     Precios definidos: ${pl.prices?.length || 0}`)
        })
        
        return
      }
      
      console.log(`✅ Encontradas ${applicablePriceLists.length} price lists para este customer:\n`)
      
      applicablePriceLists.forEach(pl => {
        console.log(`📋 ${pl.name} (ID: ${pl.id})`)
        console.log(`   Status: ${pl.status}`)
        console.log(`   Type: ${pl.type}`)
        console.log(`   Fechas: ${pl.starts_at || 'Sin fecha inicio'} - ${pl.ends_at || 'Sin fecha fin'}`)
        
        // Verificar si está activa
        const now = new Date()
        const isActive = pl.status === 'active' &&
          (!pl.starts_at || new Date(pl.starts_at) <= now) &&
          (!pl.ends_at || new Date(pl.ends_at) >= now)
        
        console.log(`   ¿Activa?: ${isActive ? '✅ SÍ' : '❌ NO'}`)
        console.log(`   Customer Groups: ${pl.customer_groups?.map(cg => cg.name).join(', ')}`)
        console.log(`   Precios definidos: ${pl.prices?.length || 0}`)
        
        if (pl.prices && pl.prices.length > 0) {
          console.log(`   💰 Ejemplos de precios:`)
          pl.prices.slice(0, 3).forEach(price => {
            console.log(`     - Variant ${price.variant_id}: ${price.amount/100} ${price.currency_code}`)
          })
          if (pl.prices.length > 3) {
            console.log(`     ... y ${pl.prices.length - 3} más`)
          }
        }
        console.log()
      })
      
    } catch (error) {
      console.log(`❌ Error obteniendo price lists: ${error.message}`)
    }
    
    // === 3. VERIFICAR REGIONES ===
    console.log("🌍 === VERIFICANDO REGIONES ===")
    
    try {
      const regionsResult = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code"]
      })
      
      console.log(`📍 Regiones disponibles: ${regionsResult.data.length}`)
      regionsResult.data.forEach(region => {
        console.log(`  - ${region.name} (${region.currency_code}) - ID: ${region.id}`)
      })
      
      const targetRegion = DEBUG_CONFIG.REGION_ID 
        ? regionsResult.data.find(r => r.id === DEBUG_CONFIG.REGION_ID)
        : regionsResult.data[0]
      
      console.log(`\n🎯 Region seleccionada: ${targetRegion?.name} (${targetRegion?.currency_code})`)
      
    } catch (error) {
      console.log(`❌ Error obteniendo regiones: ${error.message}`)
    }
    
    // === 4. VERIFICAR PRODUCTOS Y VARIANTES ===
    console.log("\n📦 === VERIFICANDO PRODUCTOS ===")
    
    try {
      const variantsResult = await query.graph({
        entity: "product_variant",
        fields: ["id", "title", "sku", "prices.amount", "prices.currency_code"],
        pagination: { take: 10 }
      })
      
      console.log(`📦 Variantes encontradas: ${variantsResult.data.length}`)
      
      if (variantsResult.data.length > 0) {
        console.log("🔍 Ejemplos de productos con precios:")
        variantsResult.data.slice(0, 5).forEach(variant => {
          console.log(`\n  📦 ${variant.title || variant.sku} (ID: ${variant.id})`)
          if (variant.prices && variant.prices.length > 0) {
            variant.prices.forEach(price => {
              console.log(`    💰 ${price.amount/100} ${price.currency_code}`)
            })
          } else {
            console.log(`    ❌ Sin precios definidos`)
          }
        })
      }
      
    } catch (error) {
      console.log(`❌ Error obteniendo productos: ${error.message}`)
    }
    
    // === 5. CONSULTAS DB DIRECTAS ===
    console.log("\n🔍 === VERIFICACIÓN DB DIRECTA ===")
    
    try {
      // Query para customer groups
      const customerGroupQuery = `
        SELECT c.email, cg.name as group_name, cg.id as group_id
        FROM customer c
        JOIN customer_group_customers cgc ON c.id = cgc.customer_id
        JOIN customer_group cg ON cgc.customer_group_id = cg.id
        WHERE c.email = $1
      `
      
      const customerGroups = await manager.query(customerGroupQuery, [DEBUG_CONFIG.CUSTOMER_EMAIL])
      console.log("👥 Customer Groups (DB directa):")
      if (customerGroups.length > 0) {
        customerGroups.forEach(row => {
          console.log(`  - ${row.group_name} (ID: ${row.group_id})`)
        })
      } else {
        console.log("  ❌ Customer no está en ningún grupo")
      }
      
      // Query para price lists
      const priceListQuery = `
        SELECT 
          pl.name, 
          pl.status, 
          pl.type, 
          pl.starts_at, 
          pl.ends_at,
          cg.name as customer_group_name,
          COUNT(DISTINCT ma.id) as price_count
        FROM price_list pl
        LEFT JOIN price_list_customer_groups plcg ON pl.id = plcg.price_list_id
        LEFT JOIN customer_group cg ON plcg.customer_group_id = cg.id
        LEFT JOIN money_amount ma ON pl.id = ma.price_list_id
        GROUP BY pl.id, pl.name, pl.status, pl.type, pl.starts_at, pl.ends_at, cg.name
        ORDER BY pl.created_at DESC
      `
      
      const priceLists = await manager.query(priceListQuery)
      console.log("\n💰 Price Lists (DB directa):")
      priceLists.forEach(row => {
        const status = row.status
        const isActive = status === 'active'
        const groupName = row.customer_group_name || 'Sin grupo'
        const priceCount = row.price_count || 0
        
        console.log(`  ${isActive ? '✅' : '❌'} ${row.name} | ${status} | ${groupName} | ${priceCount} precios`)
      })
      
      // Query específica para verificar si hay price lists para este customer
      if (customerGroups.length > 0) {
        const groupIds = customerGroups.map(cg => cg.group_id)
        const customerPriceListQuery = `
          SELECT pl.name, pl.status, COUNT(ma.id) as price_count
          FROM price_list pl
          JOIN price_list_customer_groups plcg ON pl.id = plcg.price_list_id
          LEFT JOIN money_amount ma ON pl.id = ma.price_list_id
          WHERE plcg.customer_group_id = ANY($1)
          GROUP BY pl.id, pl.name, pl.status
        `
        
        const customerPriceLists = await manager.query(customerPriceListQuery, [groupIds])
        console.log(`\n🎯 Price Lists específicas para este customer:`)
        if (customerPriceLists.length > 0) {
          customerPriceLists.forEach(row => {
            console.log(`  - ${row.name} (${row.status}) - ${row.price_count} precios`)
          })
        } else {
          console.log(`  ❌ No hay price lists activas para los grupos de este customer`)
        }
      }
      
    } catch (error) {
      console.log(`❌ Error en consultas DB: ${error.message}`)
    }
    
    // === 6. RECOMENDACIONES ===
    console.log("\n💡 === RECOMENDACIONES ===")
    
    if (customer.groups?.length === 0) {
      console.log("🔧 1. Añadir el customer a un customer group")
    }
    
    console.log("🔧 2. Verificar que la price list esté 'active'")
    console.log("🔧 3. Verificar que las fechas de la price list sean correctas")
    console.log("🔧 4. Asegurar que la price list tenga precios definidos")
    console.log("🔧 5. Verificar que el contexto de pricing incluya customer_id")
    
  } catch (error) {
    console.error("❌ Error general en diagnóstico:", error)
  }
  
  console.log("\n🏁 Diagnóstico completado")
}
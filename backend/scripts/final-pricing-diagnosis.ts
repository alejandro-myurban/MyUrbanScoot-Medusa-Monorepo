// Script de diagnóstico final con estructura real de Medusa 2.0
// Ejecutar con: npx medusa exec scripts/final-pricing-diagnosis.ts

import { DataSource } from "typeorm"

const DEBUG_CONFIG = {
  CUSTOMER_EMAIL: "alejandro@myurbanscoot.com",
}

export default async () => {
  console.log("🔍 DIAGNÓSTICO FINAL DE PRICING...\n")
  
  try {
    const dataSource = new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
    
    await dataSource.initialize()
    console.log("✅ Base de datos conectada\n")
    
    const queryRunner = dataSource.createQueryRunner()
    
    // === 1. CUSTOMER INFO ===
    console.log("👤 === VERIFICANDO CUSTOMER ===")
    
    const customer = await queryRunner.query(
      `SELECT id, email, first_name, last_name, has_account FROM customer WHERE email = $1`,
      [DEBUG_CONFIG.CUSTOMER_EMAIL]
    )
    
    if (customer.length === 0) {
      console.log(`❌ Customer no encontrado: ${DEBUG_CONFIG.CUSTOMER_EMAIL}`)
      return
    }
    
    const customerData = customer[0]
    console.log(`✅ Customer: ${customerData.email}`)
    console.log(`   ID: ${customerData.id}`)
    console.log(`   Nombre: ${customerData.first_name || ''} ${customerData.last_name || ''}`)
    console.log(`   Tiene cuenta: ${customerData.has_account}`)
    
    // === 2. CUSTOMER GROUPS ===
    console.log("\n👥 === VERIFICANDO CUSTOMER GROUPS ===")
    
    const customerGroups = await queryRunner.query(`
      SELECT cg.id, cg.name, cg.created_at
      FROM customer_group cg
      JOIN customer_group_customer cgc ON cg.id = cgc.customer_group_id
      WHERE cgc.customer_id = $1 AND cgc.deleted_at IS NULL AND cg.deleted_at IS NULL
    `, [customerData.id])
    
    if (customerGroups.length === 0) {
      console.log("❌ PROBLEMA PRINCIPAL: Customer NO está en ningún grupo")
      
      // Mostrar grupos disponibles
      const availableGroups = await queryRunner.query(`
        SELECT id, name FROM customer_group WHERE deleted_at IS NULL ORDER BY name
      `)
      
      console.log("\n📋 Customer Groups disponibles:")
      availableGroups.forEach(group => {
        console.log(`  - ${group.name} (ID: ${group.id})`)
      })
      
    } else {
      console.log("✅ Customer pertenece a grupos:")
      customerGroups.forEach(group => {
        console.log(`  - ${group.name} (ID: ${group.id})`)
      })
    }
    
    // === 3. PRICE LISTS ===
    console.log("\n💰 === VERIFICANDO PRICE LISTS ===")
    
    // Todas las price lists (incluyendo eliminadas para mostrar el problema)
    const allPriceLists = await queryRunner.query(`
      SELECT 
        id, title, description, status, type, starts_at, ends_at, 
        deleted_at, created_at, rules_count
      FROM price_list
      ORDER BY created_at DESC
    `)
    
    console.log(`📋 Total price lists: ${allPriceLists.length}`)
    
    allPriceLists.forEach(pl => {
      const isDeleted = pl.deleted_at !== null
      const now = new Date()
      const isActive = !isDeleted && pl.status === 'active' &&
        (!pl.starts_at || new Date(pl.starts_at) <= now) &&
        (!pl.ends_at || new Date(pl.ends_at) >= now)
      
      console.log(`\n${isActive ? '✅' : '❌'} ${pl.title} (${pl.type})`)
      console.log(`   Status: ${pl.status}`)
      console.log(`   Rules: ${pl.rules_count}`)
      if (isDeleted) {
        console.log(`   🗑️  ELIMINADA: ${pl.deleted_at}`)
      }
      console.log(`   Fechas: ${pl.starts_at || 'Sin inicio'} - ${pl.ends_at || 'Sin fin'}`)
    })
    
    // === 4. PRICE LIST RULES (para customer groups) ===
    console.log("\n🎯 === VERIFICANDO PRICE LIST RULES ===")
    
    const priceListRules = await queryRunner.query(`
      SELECT 
        plr.id, plr.price_list_id, plr.rule_type, plr.value,
        pl.title as price_list_title, pl.status, pl.deleted_at
      FROM price_list_rule plr
      JOIN price_list pl ON plr.price_list_id = pl.id
      WHERE plr.rule_type = 'customer_group_id'
      ORDER BY pl.created_at DESC
    `)
    
    if (priceListRules.length === 0) {
      console.log("❌ No hay price list rules para customer groups")
    } else {
      console.log("🔗 Price List Rules encontradas:")
      
      for (const rule of priceListRules) {
        const isDeleted = rule.deleted_at !== null
        
        // Obtener nombre del customer group
        const groupName = await queryRunner.query(`
          SELECT name FROM customer_group WHERE id = $1
        `, [rule.value])
        
        console.log(`\n  📋 ${rule.price_list_title} ${isDeleted ? '(🗑️ ELIMINADA)' : ''}`)
        console.log(`     → Customer Group: ${groupName[0]?.name || 'Grupo no encontrado'} (${rule.value})`)
        console.log(`     → Rule ID: ${rule.id}`)
      }
    }
    
    // === 5. PRICE LIST ESPECÍFICAS PARA ESTE CUSTOMER ===
    if (customerGroups.length > 0) {
      console.log("\n🎯 === PRICE LISTS PARA ESTE CUSTOMER ===")
      
      const customerGroupIds = customerGroups.map(g => g.id)
      
      const customerPriceLists = await queryRunner.query(`
        SELECT DISTINCT
          pl.id, pl.title, pl.status, pl.type, pl.starts_at, pl.ends_at, 
          pl.deleted_at, cg.name as group_name
        FROM price_list pl
        JOIN price_list_rule plr ON pl.id = plr.price_list_id
        JOIN customer_group cg ON plr.value = cg.id
        WHERE plr.rule_type = 'customer_group_id' 
        AND cg.id = ANY($1)
        ORDER BY pl.status DESC, pl.created_at DESC
      `, [customerGroupIds])
      
      if (customerPriceLists.length === 0) {
        console.log("❌ No hay price lists asociadas a los grupos de este customer")
      } else {
        console.log(`✅ Price lists para este customer: ${customerPriceLists.length}`)
        
        customerPriceLists.forEach(pl => {
          const isDeleted = pl.deleted_at !== null
          const now = new Date()
          const isActive = !isDeleted && pl.status === 'active' &&
            (!pl.starts_at || new Date(pl.starts_at) <= now) &&
            (!pl.ends_at || new Date(pl.ends_at) >= now)
          
          console.log(`\n  📋 ${pl.title} - Para grupo: ${pl.group_name}`)
          console.log(`     Status: ${pl.status} ${isActive ? '✅' : '❌'}`)
          console.log(`     Type: ${pl.type}`)
          
          if (isDeleted) {
            console.log(`     🗑️  PROBLEMA: Price list eliminada (${pl.deleted_at})`)
          }
          
          if (!isDeleted && pl.status !== 'active') {
            console.log(`     ⚠️  PROBLEMA: Status no es 'active'`)
          }
        })
      }
      
      // === 6. VERIFICAR PRECIOS EN PRICE LISTS ===
      console.log("\n💰 === VERIFICANDO PRECIOS EN PRICE LISTS ===")
      
      const activePriceListIds = customerPriceLists
        .filter(pl => pl.deleted_at === null && pl.status === 'active')
        .map(pl => pl.id)
      
      if (activePriceListIds.length > 0) {
        const prices = await queryRunner.query(`
          SELECT 
            p.amount, p.currency_code, p.min_quantity, p.max_quantity,
            pl.title as price_list_title,
            ps.id as price_set_id
          FROM price p
          JOIN price_list pl ON p.price_list_id = pl.id
          LEFT JOIN price_set ps ON p.price_set_id = ps.id
          WHERE pl.id = ANY($1)
          ORDER BY pl.title
          LIMIT 10
        `, [activePriceListIds])
        
        if (prices.length === 0) {
          console.log("❌ PROBLEMA: Price lists activas no tienen precios definidos")
        } else {
          console.log(`✅ Encontrados ${prices.length} precios en price lists activas:`)
          prices.forEach(price => {
            console.log(`  💰 ${price.price_list_title}: ${price.amount/100} ${price.currency_code}`)
            console.log(`     Price Set: ${price.price_set_id || 'Sin price set'}`)
          })
        }
      }
    }
    
    // === 7. DIAGNÓSTICO FINAL ===
    console.log("\n🔧 === DIAGNÓSTICO FINAL Y SOLUCIONES ===")
    
    const problems = []
    const solutions = []
    
    if (customerGroups.length === 0) {
      problems.push("Customer no está en ningún grupo")
      solutions.push("Añadir customer al grupo apropiado desde el admin")
    }
    
    const deletedPriceLists = allPriceLists.filter(pl => pl.deleted_at !== null)
    if (deletedPriceLists.length > 0) {
      problems.push(`${deletedPriceLists.length} price list(s) eliminada(s)`)
      solutions.push("Restaurar price lists eliminadas o crear nuevas")
    }
    
    const activePriceLists = allPriceLists.filter(pl => 
      pl.deleted_at === null && pl.status === 'active'
    )
    
    if (activePriceLists.length === 0) {
      problems.push("No hay price lists activas")
      solutions.push("Crear o activar price lists")
    }
    
    if (problems.length > 0) {
      console.log("❌ PROBLEMAS ENCONTRADOS:")
      problems.forEach((problem, idx) => {
        console.log(`   ${idx + 1}. ${problem}`)
      })
      
      console.log("\n💡 SOLUCIONES:")
      solutions.forEach((solution, idx) => {
        console.log(`   ${idx + 1}. ${solution}`)
      })
    } else {
      console.log("✅ Configuración parece correcta")
      console.log("\n💡 Si los precios aún no se aplican, verificar:")
      console.log("   - Frontend pasa customer_id en el contexto de pricing")
      console.log("   - Región correcta en requests")
      console.log("   - Customer está logueado correctamente")
    }
    
    // === RESUMEN EJECUTIVO ===
    console.log("\n📊 === RESUMEN EJECUTIVO ===")
    console.log(`👤 Customer: ${customerData.email}`)
    console.log(`👥 Customer Groups: ${customerGroups.length}`)
    console.log(`💰 Price Lists Total: ${allPriceLists.length}`)
    console.log(`🗑️  Price Lists Eliminadas: ${deletedPriceLists.length}`)
    console.log(`✅ Price Lists Activas: ${activePriceLists.length}`)
    
    await queryRunner.release()
    await dataSource.destroy()
    
  } catch (error) {
    console.error("❌ Error en diagnóstico:", error)
  }
  
  console.log("\n🏁 Diagnóstico completado")
}
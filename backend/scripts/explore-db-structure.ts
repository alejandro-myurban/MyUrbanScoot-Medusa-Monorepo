// Script para explorar estructura de DB en Medusa 2.0
// Ejecutar con: npx medusa exec scripts/explore-db-structure.ts

import { DataSource } from "typeorm"

export default async () => {
  console.log("🔍 Explorando estructura de base de datos...\n")
  
  try {
    const dataSource = new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
    
    await dataSource.initialize()
    console.log("✅ Base de datos conectada\n")
    
    const queryRunner = dataSource.createQueryRunner()
    
    // === 1. LISTAR TODAS LAS TABLAS ===
    console.log("📋 === LISTANDO TODAS LAS TABLAS ===")
    
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `
    
    const tables = await queryRunner.query(tablesQuery)
    console.log(`📊 Total tablas encontradas: ${tables.length}\n`)
    
    // Buscar tablas relacionadas con customer y price
    const customerTables = tables.filter(t => t.tablename.includes('customer'))
    const priceTables = tables.filter(t => t.tablename.includes('price'))
    const groupTables = tables.filter(t => t.tablename.includes('group'))
    
    console.log("👤 Tablas relacionadas con CUSTOMER:")
    customerTables.forEach(t => console.log(`  - ${t.tablename}`))
    
    console.log("\n💰 Tablas relacionadas con PRICE:")
    priceTables.forEach(t => console.log(`  - ${t.tablename}`))
    
    console.log("\n👥 Tablas relacionadas con GROUP:")
    groupTables.forEach(t => console.log(`  - ${t.tablename}`))
    
    // === 2. EXAMINAR TABLA CUSTOMER ===
    console.log("\n👤 === ESTRUCTURA DE TABLA CUSTOMER ===")
    
    const customerColumnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'customer' 
      ORDER BY ordinal_position
    `
    
    const customerColumns = await queryRunner.query(customerColumnsQuery)
    console.log("📋 Columnas de la tabla 'customer':")
    customerColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
    // === 3. BUSCAR TABLA DE CUSTOMER GROUPS ===
    console.log("\n👥 === BUSCANDO TABLA DE CUSTOMER GROUPS ===")
    
    // Intentar diferentes nombres posibles
    const possibleGroupTables = [
      'customer_group',
      'customer_groups', 
      'customer_group_customer',
      'customer_customer_group',
      'customer_group_customers'
    ]
    
    for (const tableName of possibleGroupTables) {
      try {
        const exists = await queryRunner.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
          [tableName]
        )
        
        if (exists[0].exists) {
          console.log(`✅ Tabla encontrada: ${tableName}`)
          
          // Mostrar estructura
          const columns = await queryRunner.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
          `, [tableName])
          
          console.log(`   Columnas de '${tableName}':`)
          columns.forEach(col => {
            console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
          })
          console.log()
        }
      } catch (error) {
        // Tabla no existe, continuar
      }
    }
    
    // === 4. BUSCAR PRICE LISTS ===
    console.log("💰 === ESTRUCTURA DE PRICE LIST ===")
    
    const possiblePriceTables = [
      'price_list',
      'price_lists',
      'money_amount'
    ]
    
    for (const tableName of possiblePriceTables) {
      try {
        const exists = await queryRunner.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
          [tableName]
        )
        
        if (exists[0].exists) {
          console.log(`✅ Tabla encontrada: ${tableName}`)
          
          const columns = await queryRunner.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
          `, [tableName])
          
          console.log(`   Columnas de '${tableName}':`)
          columns.forEach(col => {
            console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
          })
          
          // Mostrar algunos datos de ejemplo
          const sampleData = await queryRunner.query(`SELECT * FROM ${tableName} LIMIT 3`)
          if (sampleData.length > 0) {
            console.log(`   📊 Datos de ejemplo:`)
            sampleData.forEach((row, idx) => {
              console.log(`     Fila ${idx + 1}:`, JSON.stringify(row, null, 2))
            })
          }
          console.log()
        }
      } catch (error) {
        // Tabla no existe, continuar
      }
    }
    
    // === 5. BUSCAR RELACIONES CON FOREIGN KEYS ===
    console.log("🔗 === BUSCANDO FOREIGN KEYS RELACIONADAS ===")
    
    const foreignKeysQuery = `
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name LIKE '%customer%' OR tc.table_name LIKE '%price%' OR tc.table_name LIKE '%group%')
      ORDER BY tc.table_name, kcu.column_name
    `
    
    const foreignKeys = await queryRunner.query(foreignKeysQuery)
    console.log("🔗 Foreign Keys encontradas:")
    foreignKeys.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`)
    })
    
    await queryRunner.release()
    await dataSource.destroy()
    
  } catch (error) {
    console.error("❌ Error explorando base de datos:", error)
  }
  
  console.log("\n🏁 Exploración completada")
}
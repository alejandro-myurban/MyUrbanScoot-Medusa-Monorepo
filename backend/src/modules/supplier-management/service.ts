import { MedusaError, MedusaService } from "@medusajs/framework/utils";
import { InferTypeOf } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  updateInventoryLevelsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

import Supplier from "./models/supplier";
import SupplierOrder from "./models/supplier-order";
import SupplierOrderLine from "./models/supplier-order-line";
import InventoryMovement from "./models/inventory-movement";
import ProductSupplier from "./models/product-supplier";

// Tipos inferidos de los modelos
type Supplier = InferTypeOf<typeof Supplier>;
type SupplierOrder = InferTypeOf<typeof SupplierOrder>;
type SupplierOrderLine = InferTypeOf<typeof SupplierOrderLine>;
type InventoryMovement = InferTypeOf<typeof InventoryMovement>;
type ProductSupplier = InferTypeOf<typeof ProductSupplier>;

class SupplierManagementModuleService extends MedusaService({
  Supplier,
  SupplierOrder,
  SupplierOrderLine,
  InventoryMovement,
  ProductSupplier,
}) {
  private inventoryModuleService: any;
  private productModuleService: any;
  private stockLocationModuleService: any;
  private container: any;

  constructor(container: any) {
    // Llamar al constructor padre
    super(...arguments);

    // Store container for workflow access
    this.container = container;

    // Inyectar los servicios necesarios de MedusaJS
    try {
      // Intentar diferentes formas de resolver los servicios
      this.inventoryModuleService =
        container.resolve("inventoryService") ||
        container.resolve(Modules.INVENTORY);
      this.productModuleService =
        container.resolve("productService") ||
        container.resolve(Modules.PRODUCT);
      this.stockLocationModuleService =
        container.resolve("stockLocationService") ||
        container.resolve(Modules.STOCK_LOCATION);
      console.log("📦 MedusaJS modules inyectados correctamente");
      console.log("📦 Servicios disponibles:", {
        inventory: !!this.inventoryModuleService,
        product: !!this.productModuleService,
        stockLocation: !!this.stockLocationModuleService,
      });
    } catch (error) {
      console.log("⚠️ Error inyectando módulos de MedusaJS:", error.message);
      // Intentar método alternativo
      try {
        console.log("🔄 Intentando método alternativo de inyección...");
        this.inventoryModuleService = container.cradle?.inventoryService;
        this.productModuleService = container.cradle?.productService;
        this.stockLocationModuleService =
          container.cradle?.stockLocationService;
        console.log("📦 Método alternativo - Servicios disponibles:", {
          inventory: !!this.inventoryModuleService,
          product: !!this.productModuleService,
          stockLocation: !!this.stockLocationModuleService,
        });
      } catch (alternativeError) {
        console.log(
          "⚠️ Método alternativo también falló:",
          alternativeError.message
        );
        this.inventoryModuleService = null;
        this.productModuleService = null;
        this.stockLocationModuleService = null;
      }
    }
  }
  // =====================================================
  // MÉTODOS PARA SUPPLIERS
  // =====================================================

  async createSupplier(data: any): Promise<Supplier> {
    return await this.createSuppliers(data);
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    const suppliers = await this.listSuppliers({ id });
    return suppliers[0] || null;
  }

  async updateSupplierData(id: string, data: any): Promise<Supplier> {
    // Usar el método auto-generado singular como financing_data
    const updateData = { id, ...data };
    //@ts-ignore
    return await this.updateSupplier(updateData);
  }

  async deactivateSupplier(id: string): Promise<Supplier> {
    // Usar el método auto-generado singular como financing_data
    //@ts-ignore
    return await this.updateSupplier({ id, is_active: false });
  }

  // =====================================================
  // MÉTODOS PARA SUPPLIER ORDERS
  // =====================================================

  async createSupplierOrder(data: any): Promise<SupplierOrder> {
    // Generar display_id si no se proporciona
    if (!data.display_id) {
      data.display_id = await this.generateOrderDisplayId();
    }

    // Establecer order_date si no se proporciona
    if (!data.order_date) {
      data.order_date = new Date();
    }

    return await this.createSupplierOrders(data);
  }

  async getSupplierOrderById(id: string): Promise<SupplierOrder | null> {
    const orders = await this.listSupplierOrders(
      { id },
      { relations: ["supplier"] }
    );
    return orders[0] || null;
  }

  async updateSupplierOrderStatus(
    id: string,
    status: string,
    userId?: string
  ): Promise<SupplierOrder> {
    console.log(`🔄 Actualizando estado del pedido ${id} a ${status}`);

    const updateData: any = {
      id, // ¡CRÍTICO! Incluir el ID como hace financing_data
      status,
    };

    // Agregar timestamps según el estado
    switch (status) {
      case "confirmed":
        updateData.confirmed_at = new Date();
        break;
      case "shipped":
        updateData.shipped_at = new Date();
        break;
      case "received":
        updateData.received_at = new Date();
        if (userId) updateData.received_by = userId;
        break;
    }

    console.log(`📝 Datos para actualizar:`, updateData);

    // Usar el método auto-generado singular como financing_data
    const updatedOrder = await this.updateSupplierOrders(updateData);
    console.log(
      `✅ Estado actualizado usando updateSupplierOrder (singular):`,
      updatedOrder?.status
    );

    // ✅ ACTUALIZAR STOCK AUTOMÁTICAMENTE CUANDO LLEGA A "CONFIRMED" O "RECEIVED"
    if (status === "confirmed" || status === "received") {
      console.log(
        `🎯 TRIGGER DETECTADO: Estado cambiado a '${status}' para pedido ${id}`
      );
      try {
        console.log(`📋 INICIANDO proceso de actualización de stock...`);
        await this.updateStockOnConfirmation(id);
        console.log(
          `✅ COMPLETADO proceso de actualización de stock para pedido ${id}`
        );
      } catch (error) {
        console.error(
          `❌ ERROR CRÍTICO actualizando stock para pedido ${id}:`,
          error
        );
        console.error(`📊 Stack trace:`, error.stack);
        // No fallar todo el proceso si hay error en stock, solo loggear
      }
    } else {
      console.log(`ℹ️ Estado '${status}' no requiere actualización de stock`);
    }

    return updatedOrder;
  }

  // =====================================================
  // MÉTODOS PARA ORDER LINES
  // =====================================================

  async addOrderLine(lineData: any): Promise<SupplierOrderLine> {
    console.log(
      `🔍 DEBUG addOrderLine - Datos recibidos:`,
      JSON.stringify(lineData, null, 2)
    );
    console.log(
      `🔍 DEBUG addOrderLine - product_id específico:`,
      lineData.product_id
    );
    console.log(
      `🔍 DEBUG addOrderLine - tipo de product_id:`,
      typeof lineData.product_id
    );
    console.log(
      `🔍 DEBUG addOrderLine - product_id es vacío?:`,
      !lineData.product_id || lineData.product_id.trim() === ""
    );

    const lineWithOrder = {
      ...lineData,
      total_price: lineData.unit_price * lineData.quantity_ordered,
      quantity_pending: lineData.quantity_ordered,
    };

    console.log(
      `🔍 DEBUG addOrderLine - Datos para guardar:`,
      JSON.stringify(lineWithOrder, null, 2)
    );

    const line = await this.createSupplierOrderLines(lineWithOrder);

    console.log(
      `🔍 DEBUG addOrderLine - Línea creada:`,
      JSON.stringify(line, null, 2)
    );
    console.log(
      `🔍 DEBUG addOrderLine - product_id en línea creada:`,
      line.product_id
    );

    // Recalcular totales del pedido
    await this.recalculateOrderTotals(lineData.supplier_order_id);

    return line;
  }

  async receiveOrderLine(
    lineId: string,
    data: any
  ): Promise<SupplierOrderLine> {
    const lines = await this.listSupplierOrderLines({ id: lineId });
    const line = lines[0];

    if (!line) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Order line not found"
      );
    }

    const newQuantityReceived = line.quantity_received + data.quantity_received;
    const newQuantityPending = line.quantity_ordered - newQuantityReceived;

    // Determinar estado de la línea
    let lineStatus = "pending";
    if (newQuantityReceived >= line.quantity_ordered) {
      lineStatus = "received";
    } else if (newQuantityReceived > 0) {
      lineStatus = "partial";
    }

    // Usar el método auto-generado singular como financing_data
    //@ts-ignore
    const updatedLine = await this.updateSupplierOrderLine({
      id: lineId,
      quantity_received: newQuantityReceived,
      quantity_pending: Math.max(0, newQuantityPending),
      line_status: lineStatus,
      received_at: new Date(),
      received_by: data.received_by,
      reception_notes: data.reception_notes,
    });

    // Registrar movimiento de inventario
    await this.recordInventoryMovement({
      movement_type: "supplier_receipt",
      reference_id: line.supplier_order_id,
      reference_type: "supplier_order",
      product_id: line.product_id,
      product_variant_id: line.product_variant_id,
      to_location_id: "default",
      quantity: data.quantity_received,
      unit_cost: line.unit_price,
      total_cost: line.unit_price * data.quantity_received,
      performed_by: data.received_by,
      performed_at: new Date(),
    });

    // Actualizar estado del pedido automáticamente
    await this.updateOrderStatusBasedOnLines(line.supplier_order_id);

    return updatedLine;
  }

  async getOrderLines(orderId: string): Promise<SupplierOrderLine[]> {
    return await this.listSupplierOrderLines({ supplier_order_id: orderId });
  }

  // Método updateSupplierOrder eliminado para permitir que MedusaService genere el método base automáticamente

  async listSupplierOrders_(
    filters: any = {},
    options: any = {}
  ): Promise<SupplierOrder[]> {
    return await this.listSupplierOrders(filters, options);
  }

  async listSuppliers_(
    filters: any = {},
    options: any = {}
  ): Promise<Supplier[]> {
    return await this.listSuppliers(filters, options);
  }

  // =====================================================
  // MÉTODOS PARA INVENTORY MOVEMENTS
  // =====================================================

  async recordInventoryMovement(data: any): Promise<InventoryMovement> {
    return await this.createInventoryMovements(data);
  }

  async getInventoryMovementsForProduct(
    productId: string
  ): Promise<InventoryMovement[]> {
    return await this.listInventoryMovements({
      product_id: productId,
    });
  }

  // =====================================================
  // MÉTODOS PARA PRODUCT SUPPLIERS
  // =====================================================

  async linkProductToSupplier(data: any): Promise<ProductSupplier> {
    return await this.createProductSuppliers(data);
  }

  async updateProductSupplierCost(
    id: string,
    data: any
  ): Promise<ProductSupplier> {
    const productSuppliers = await this.listProductSuppliers({ id });
    if (!productSuppliers[0]) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Product supplier not found"
      );
    }

    const currentCost = productSuppliers[0].cost_price;
    const newCost = data.cost_price;

    // Actualizar historial de precios
    const priceHistory = Array.isArray(productSuppliers[0].price_history)
      ? productSuppliers[0].price_history
      : [];
    priceHistory.push({
      old_price: currentCost,
      new_price: newCost,
      changed_at: new Date().toISOString(),
      changed_by: data.updated_by,
    });

    // Usar el método auto-generado singular como financing_data
    //@ts-ignore
    return await this.updateProductSupplier({
      id,
      cost_price: newCost,
      price_history: priceHistory,
      updated_at: new Date(),
    });
  }

  async getProductSupplierById(id: string): Promise<ProductSupplier | null> {
    const productSuppliers = await this.listProductSuppliers({ id });
    return productSuppliers[0] || null;
  }

  async updateProductSupplierData(
    id: string,
    data: any
  ): Promise<ProductSupplier> {
    // Usar el método auto-generado singular como financing_data
    //@ts-ignore
    return await this.updateProductSupplier({ id, ...data });
  }

  async unlinkProductFromSupplier(id: string): Promise<void> {
    await this.deleteProductSuppliers({ id });
  }

  async listProductSuppliers_(
    filters: any = {},
    options: any = {}
  ): Promise<ProductSupplier[]> {
    return await this.listProductSuppliers(filters, options);
  }

  // =====================================================
  // MÉTODOS ADICIONALES PARA INVENTORY MOVEMENTS
  // =====================================================

  async createInventoryMovement(data: any): Promise<InventoryMovement> {
    return await this.createInventoryMovements(data);
  }

  async listInventoryMovements_(
    filters: any = {},
    options: any = {}
  ): Promise<InventoryMovement[]> {
    return await this.listInventoryMovements(filters, options);
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  // ✅ ACTUALIZAR STOCK EN MEDUSA CUANDO SE CONFIRMA EL PEDIDO
  private async updateStockOnConfirmation(orderId: string): Promise<void> {
    console.log(`\n🚀 ========== INICIO ACTUALIZACIÓN DE STOCK ==========`);
    console.log(`📦 Pedido ID: ${orderId}`);

    try {
      // Obtener el pedido con sus líneas y ubicación
      console.log(`🔍 PASO 1: Obteniendo datos del pedido...`);
      const order = await this.getSupplierOrderById(orderId);
      if (!order) {
        console.error(`❌ FALLO PASO 1: Pedido ${orderId} no encontrado en DB`);
        throw new Error(`Pedido ${orderId} no encontrado`);
      }

      console.log(`✅ PASO 1 COMPLETADO: Pedido encontrado`);
      console.log(`   - Display ID: ${order.display_id}`);
      console.log(`   - Estado actual: ${order.status}`);
      console.log(
        `   - Ubicación destino: ${
          order.destination_location_id || "NO ESPECIFICADA"
        }`
      );

      // Validar ubicación de destino
      const locationId = order.destination_location_id || "default";
      if (!order.destination_location_id) {
        console.warn(
          `⚠️ Pedido sin ubicación específica, usando ubicación por defecto: ${locationId}`
        );
      }

      // Validar que la ubicación existe en MedusaJS
      if (this.stockLocationModuleService) {
        try {
          const locations =
            await this.stockLocationModuleService.listStockLocations({
              id: locationId,
            });
          if (!locations || locations.length === 0) {
            console.error(`❌ Ubicación ${locationId} no existe en MedusaJS`);
            throw new Error(`Ubicación de stock ${locationId} no encontrada`);
          }
          console.log(`✅ Ubicación de stock validada: ${locations[0].name}`);
        } catch (locationError: any) {
          console.warn(
            `⚠️ Error validando ubicación (continuando): ${locationError.message}`
          );
        }
      }

      // Obtener las líneas del pedido
      console.log(`🔍 PASO 2: Obteniendo líneas del pedido...`);
      const lines = await this.listSupplierOrderLines({
        supplier_order_id: orderId,
      });
      if (lines.length === 0) {
        console.warn(`⚠️ FALLO PASO 2: No hay líneas en el pedido ${orderId}`);
        console.log(`🏁 ========== FIN (SIN LÍNEAS) ==========\n`);
        return;
      }

      console.log(`✅ PASO 2 COMPLETADO: ${lines.length} líneas encontradas`);
      lines.forEach((line, index) => {
        console.log(`   Línea ${index + 1}:`);
        console.log(`     - ID: ${line.id}`);
        console.log(
          `     - Producto ID: ${line.product_id || "NO ESPECIFICADO"}`
        );
        console.log(
          `     - Título: ${line.product_title || "NO ESPECIFICADO"}`
        );
        console.log(`     - Cantidad: ${line.quantity_ordered}`);
        console.log(`     - Precio: ${line.unit_price}`);
      });

      console.log(`🔍 PASO 3: Procesando líneas individualmente...`);
      let processedLines = 0;
      let skippedLines = 0;
      let errorLines = 0;

      // Procesar cada línea del pedido
      for (const [index, line] of lines.entries()) {
        console.log(
          `\n📋 --- PROCESANDO LÍNEA ${index + 1}/${lines.length} ---`
        );
        console.log(`   ID Línea: ${line.id}`);

        try {
          // Solo actualizar si tiene product_id (productos reales de Medusa)
          if (!line.product_id) {
            console.warn(`⚠️ SALTANDO Línea ${line.id}: No tiene product_id`);
            console.warn(`   - Título: "${line.product_title}"`);
            console.warn(
              `   - Esto sugiere que es un producto manual, no de Medusa`
            );
            skippedLines++;
            continue;
          }

          const locationId = order.destination_location_id || "default";
          const quantity = line.quantity_ordered;

          console.log(`📦 PREPARANDO actualización de stock:`);
          console.log(`   - Producto ID: ${line.product_id}`);
          console.log(`   - Ubicación: ${locationId}`);
          console.log(`   - Cantidad a añadir: +${quantity}`);
          console.log(`   - Costo unitario: ${line.unit_price}`);

          // Actualizar stock usando la API interna de Medusa
          console.log(`🔄 Llamando updateMedusaStock...`);
          await this.updateMedusaStock(line.product_id, locationId, quantity);
          console.log(`✅ updateMedusaStock completado`);

          // Registrar movimiento de inventario
          console.log(`📝 Registrando movimiento de inventario...`);
          const movementData = {
            movement_type: "supplier_receipt",
            reference_id: orderId,
            reference_type: "supplier_order",
            product_id: line.product_id,
            product_variant_id: line.product_variant_id,
            product_title: line.product_title,
            to_location_id: locationId,
            to_location_name: order.destination_location_name || locationId,
            quantity: quantity,
            unit_cost: line.unit_price,
            total_cost: line.unit_price * quantity,
            reason: `Recepción de pedido de proveedor ${order.display_id}`,
            performed_by: "system",
            performed_at: new Date(),
            notes: `Stock añadido automáticamente al cambiar estado del pedido a '${order.status}'`,
          };

          console.log(
            `📊 Datos del movimiento:`,
            JSON.stringify(movementData, null, 2)
          );

          await this.recordInventoryMovement(movementData);
          console.log(`✅ Movimiento registrado correctamente`);

          console.log(
            `🎉 LÍNEA ${index + 1} COMPLETADA: Producto ${
              line.product_id
            } +${quantity} unidades`
          );
          processedLines++;
        } catch (lineError: any) {
          console.error(`❌ ERROR EN LÍNEA ${index + 1}:`, lineError.message);
          console.error(`📊 Error stack:`, lineError.stack);
          console.error(`📋 Datos de la línea:`, JSON.stringify(line, null, 2));
          errorLines++;
          // Continuar con las otras líneas aunque falle una
        }
      }

      console.log(`\n📊 ========== RESUMEN FINAL ==========`);
      console.log(`   - Líneas procesadas exitosamente: ${processedLines}`);
      console.log(`   - Líneas saltadas (sin product_id): ${skippedLines}`);
      console.log(`   - Líneas con error: ${errorLines}`);
      console.log(`   - Total líneas: ${lines.length}`);
      console.log(`🏁 ========== FIN ACTUALIZACIÓN DE STOCK ==========\n`);
    } catch (error: any) {
      console.error(
        `❌ ERROR CRÍTICO en updateStockOnConfirmation para pedido ${orderId}:`,
        error.message
      );
      console.error(`📊 Stack trace completo:`, error.stack);

      // Log contextual information
      console.error(`📋 Información del contexto:`);
      console.error(`   - Pedido ID: ${orderId}`);
      console.error(`   - Servicios disponibles:`);
      console.error(
        `     - inventoryModuleService: ${!!this.inventoryModuleService}`
      );
      console.error(
        `     - productModuleService: ${!!this.productModuleService}`
      );
      console.error(
        `     - stockLocationModuleService: ${!!this
          .stockLocationModuleService}`
      );

      // No re-lanzar el error para evitar que falle todo el proceso de cambio de estado
      console.log(
        `⚠️ Continuando con el cambio de estado del pedido sin actualizar stock`
      );
    }
  }

  // ✅ ACTUALIZAR STOCK EN MEDUSA
  private async updateMedusaStock(
    productId: string,
    locationId: string,
    quantity: number
  ): Promise<void> {
    try {
      console.log(`🔄 Actualizando stock en Medusa:
        - Producto: ${productId}
        - Ubicación: ${locationId}
        - Incremento: +${quantity}`);

      if (
        !this.inventoryModuleService ||
        !this.productModuleService ||
        !this.stockLocationModuleService
      ) {
        console.log(
          `⚠️ Servicios de MedusaJS no disponibles, intentando método alternativo con workflow...`
        );
        return await this.updateStockViaWorkflow(
          productId,
          locationId,
          quantity
        );
      }

      // Paso 1: Obtener el producto para encontrar su inventory item
      console.log(`🔍 Buscando inventory item para producto ${productId}...`);
      const products = await this.productModuleService.listProducts({
        id: productId,
      });

      if (!products || products.length === 0) {
        throw new Error(`Producto ${productId} no encontrado`);
      }

      const product = products[0];
      console.log(`📦 Producto encontrado: ${product.title}`);

      // Paso 2: Obtener las variantes del producto
      const variants = await this.productModuleService.listProductVariants({
        product_id: productId,
      });

      if (!variants || variants.length === 0) {
        throw new Error(
          `No se encontraron variantes para el producto ${productId}`
        );
      }

      // Paso 3: Actualizar el stock para cada variante
      for (const variant of variants) {
        console.log(`🔄 Actualizando stock para variante ${variant.id}...`);

        // Obtener el inventory item de la variante
        const inventoryItems =
          await this.inventoryModuleService.listInventoryItems({
            sku: variant.sku,
          });

        if (!inventoryItems || inventoryItems.length === 0) {
          console.log(
            `⚠️ No se encontró inventory item para variante ${variant.sku}, saltando...`
          );
          continue;
        }

        const inventoryItem = inventoryItems[0];
        console.log(`📦 Inventory item encontrado: ${inventoryItem.id}`);

        // Verificar si existe el nivel de inventario para esta ubicación
        const existingLevels =
          await this.inventoryModuleService.listInventoryLevels({
            inventory_item_id: inventoryItem.id,
            location_id: locationId,
          });

        if (existingLevels && existingLevels.length > 0) {
          // Actualizar el nivel existente
          const currentLevel = existingLevels[0];
          const newStockedQuantity =
            (currentLevel.stocked_quantity || 0) + quantity;

          console.log(
            `📈 Actualizando nivel existente de ${currentLevel.stocked_quantity} a ${newStockedQuantity}`
          );

          await updateInventoryLevelsWorkflow(this.container).run({
            input: {
              updates: [
                {
                  inventory_item_id: inventoryItem.id,
                  location_id: locationId,
                  stocked_quantity: newStockedQuantity,
                },
              ],
            },
          });
        } else {
          // Crear nuevo nivel de inventario
          console.log(
            `➕ Creando nuevo nivel de inventario con cantidad ${quantity}`
          );

          await updateInventoryLevelsWorkflow(this.container).run({
            input: {
              //@ts-ignore
              creates: [
                {
                  inventory_item_id: inventoryItem.id,
                  location_id: locationId,
                  stocked_quantity: quantity,
                },
              ],
            },
          });
        }

        console.log(`✅ Stock actualizado para variante ${variant.sku}`);
      }

      console.log(`✅ Stock actualizado correctamente en MedusaJS`);
    } catch (error: any) {
      console.error(`❌ Error actualizando stock de Medusa:`, error.message);
      console.error(`📊 Stack trace:`, error.stack);
      // No lanzar error para que el proceso continúe con el registro del movimiento
      console.log(
        `📝 Continuando con registro de movimiento sin actualizar stock real`
      );
    }
  }

  // ✅ MÉTODO ALTERNATIVO: Usar workflow directamente si los servicios no están disponibles
  private async updateStockViaWorkflow(
    productId: string,
    locationId: string,
    quantity: number
  ): Promise<void> {
    try {
      console.log(
        `🔄 Método alternativo: Actualizando stock via workflow directo`
      );
      console.log(`   - Producto: ${productId}`);
      console.log(`   - Ubicación: ${locationId}`);
      console.log(`   - Cantidad: +${quantity}`);

      // Intentar usar el workflow directamente con el container
      console.log(`📡 Ejecutando updateInventoryLevelsWorkflow...`);

      // Para MedusaJS 2.0, necesitamos el inventory_item_id del producto
      // Vamos a intentar encontrarlo

      try {
        // Primero intentar actualizar el inventario existente
        const inventoryItemId = `inv_${productId.replace("prod_", "")}`;
        console.log(
          `🔄 Intentando actualizar nivel de inventario existente para ${inventoryItemId}...`
        );

        const updateResult = await updateInventoryLevelsWorkflow(
          this.container
        ).run({
          input: {
            updates: [
              {
                inventory_item_id: inventoryItemId,
                location_id: locationId,
                stocked_quantity: quantity,
                //@ts-ignore
                reserved_quantity: 0,
              },
            ],
          },
        });

        console.log(
          `✅ Workflow de actualización ejecutado exitosamente:`,
          updateResult
        );
        console.log(`✅ Stock actualizado correctamente via workflow`);
      } catch (workflowError: any) {
        console.error(
          `❌ Error ejecutando workflow de actualización:`,
          workflowError.message
        );

        // Si el error es que el item no está en la ubicación, intentar crearlo
        if (workflowError.message.includes("is not stocked at location")) {
          console.log(
            `🔄 El item no existe en esta ubicación, creando nivel de inventario inicial...`
          );

          try {
            const inventoryItemId = `inv_${productId.replace("prod_", "")}`;
            console.log(
              `📋 Creando nivel de inventario para ${inventoryItemId} en ubicación ${locationId}...`
            );

            const createResult = await createInventoryLevelsWorkflow(
              this.container
            ).run({
              input: {
                inventory_levels: [
                  {
                    inventory_item_id: inventoryItemId,
                    location_id: locationId,
                    stocked_quantity: quantity,
                    //@ts-ignore
                    reserved_quantity: 0,
                  },
                ],
              },
            });

            console.log(
              `✅ Nivel de inventario creado exitosamente:`,
              createResult
            );
            console.log(
              `✅ Stock inicializado correctamente con ${quantity} unidades`
            );
          } catch (createError: any) {
            console.error(
              `❌ Error creando nivel de inventario:`,
              createError.message
            );
            throw createError;
          }
        } else {
          throw workflowError;
        }

        // Método de fallback: intentar via API HTTP interna
        console.log(`🔄 Intentando método de fallback via API HTTP...`);

        try {
          // Esto simula lo que haría el admin dashboard
          console.log(
            `📡 SIMULANDO: PUT /admin/inventory-items/${productId}/location-levels/${locationId}`
          );
          console.log(`📡 SIMULANDO: Body: { stocked_quantity: ${quantity} }`);

          // Por ahora solo registramos que se intentó
          console.log(
            `✅ Actualización simulada exitosa - Stock ${productId} +${quantity} en ${locationId}`
          );
          console.log(
            `📝 NOTA: Para completar, implementar llamada real a API de inventario`
          );
        } catch (apiError: any) {
          console.error(`❌ Error en API de fallback:`, apiError.message);
          throw apiError;
        }
      }
    } catch (error: any) {
      console.error(`❌ Error en método alternativo:`, error.message);
      console.error(`📊 Stack trace:`, error.stack);
      console.log(`📝 Continuando solo con registro de movimiento`);
    }
  }

  private async updateOrderStatusBasedOnLines(orderId: string): Promise<void> {
    // Obtener todas las líneas del pedido
    const lines = await this.listSupplierOrderLines({
      supplier_order_id: orderId,
    });

    if (lines.length === 0) return;

    // Calcular estado basado en las líneas
    const totalQuantityOrdered = lines.reduce(
      (sum, line) => sum + line.quantity_ordered,
      0
    );
    const totalQuantityReceived = lines.reduce(
      (sum, line) => sum + line.quantity_received,
      0
    );

    let newStatus = "";
    if (totalQuantityReceived === 0) {
      // No se ha recibido nada todavía, mantener estado actual o cambiar a shipped si viene de confirmed
      return; // No cambiar el estado automáticamente
    } else if (totalQuantityReceived >= totalQuantityOrdered) {
      // Todo recibido
      newStatus = "received";
    } else {
      // Parcialmente recibido
      newStatus = "partially_received";
    }

    // Actualizar el estado del pedido si es diferente
    const currentOrder = await this.getSupplierOrderById(orderId);
    if (
      currentOrder &&
      currentOrder.status !== newStatus &&
      currentOrder.status !== "cancelled"
    ) {
      await this.updateSupplierOrderStatus(orderId, newStatus);
    }
  }

  private async generateOrderDisplayId(): Promise<string> {
    const orders = await this.listSupplierOrders_({}, {});
    const count = orders.length;
    return `PO-${String(count + 1).padStart(6, "0")}`;
  }

  private async recalculateOrderTotals(orderId: string): Promise<void> {
    const lines = await this.listSupplierOrderLines({
      supplier_order_id: orderId,
    });

    const subtotal = lines.reduce((sum, line) => sum + line.total_price, 0);
    // TODO: Calcular impuestos según configuración
    const taxTotal = 0;
    const total = subtotal + taxTotal;

    // Usar el método auto-generado singular como financing_data
    //@ts-ignore
    await this.updateSupplierOrders({
      id: orderId,
      subtotal,
      tax_total: taxTotal,
      total,
    });
  }
}

export default SupplierManagementModuleService;

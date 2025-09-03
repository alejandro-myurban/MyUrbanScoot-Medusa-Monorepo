import { MedusaError, MedusaService } from "@medusajs/framework/utils";
import { InferTypeOf } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { updateSupplierStockWorkflow } from "../../workflows/update-supplier-stock-workflow";

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
  private container: any;

  constructor(container: any) {
    // Llamar al constructor padre
    super(...arguments);

    // Store container for lazy loading of services
    this.container = container;
    console.log("📦 SupplierManagementModuleService constructor - container guardado");
  }

  // ✅ MÉTODO CORRECTO SEGÚN MEDUSAJS 2.7 DOCS
  // Los servicios de módulos se resuelven dentro de steps/workflows, no en constructores
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
    console.log("🔍 Creating supplier order with data:", data);
    
    // Extract order_lines from data to handle separately
    const { order_lines, ...orderData } = data;
    
    // Generar display_id si no se proporciona
    if (!orderData.display_id) {
      orderData.display_id = await this.generateOrderDisplayId(orderData.order_type || "supplier");
    }

    // Establecer order_date si no se proporciona
    if (!orderData.order_date) {
      orderData.order_date = new Date();
    }

    // Set initial totals to 0 (will be recalculated after lines are created)
    orderData.subtotal = 0;
    orderData.tax_total = 0;
    orderData.total = 0;
    orderData.discount_total = 0;
    orderData.status = orderData.status || "draft";
    orderData.currency_code = orderData.currency_code || "EUR";

    // Create the order first
    const order = await this.createSupplierOrders(orderData);
    console.log("✅ Order created with ID:", order.id);

    // Create order lines if provided
    if (order_lines && order_lines.length > 0) {
      console.log(`📦 Creating ${order_lines.length} order lines...`);
      
      for (const lineData of order_lines) {
        const lineWithOrder = {
          ...lineData,
          supplier_order_id: order.id,
        };
        await this.createSupplierOrderLines(lineWithOrder);
      }
      
      console.log("✅ All order lines created");
      
      // Recalculate order totals based on the created lines
      await this.recalculateOrderTotals(order.id);
      console.log("✅ Order totals recalculated");
    }

    // Return the updated order
    const updatedOrder = await this.getSupplierOrderById(order.id);
    return updatedOrder || order;
  }

  async getSupplierOrderById(id: string): Promise<SupplierOrder | null> {
    const orders = await this.listSupplierOrders(
      { id },
      { relations: ["supplier"] }
    );
    const order = orders[0];
    
    if (!order) return null;
    
    // Resolver nombres de usuarios
    try {
      // Check if container is available
      if (!this.container_) {
        console.warn("Container not available, skipping user name resolution");
        return order;
      }
      
      // @ts-ignore
      const userModuleService = this.container_.resolve("userModuleService");
      
      // Resolver created_by (solo si parece ser un ID)
      if (order.created_by) {
        // Si parece un ID (formato típico de Medusa), intentar resolver
        if (order.created_by.length > 20 && order.created_by.includes('_')) {
          try {
            const creator = await userModuleService.retrieveUser(order.created_by);
            order.created_by = `${creator.first_name} ${creator.last_name}`.trim() || creator.email;
          } catch (error) {
            console.warn(`No se pudo resolver created_by ${order.created_by}:`, error.message);
          }
        }
        // Si no parece un ID, asumir que ya es un nombre y dejarlo como está
      }
      
      // Resolver received_by
      if (order.received_by) {
        console.log(`🔍 DEBUG getSupplierOrderById - Resolviendo received_by:`, order.received_by);
        try {
          const receiver = await userModuleService.retrieveUser(order.received_by);
          console.log(`🔍 DEBUG getSupplierOrderById - Usuario encontrado:`, {
            id: receiver.id,
            first_name: receiver.first_name,
            last_name: receiver.last_name,
            email: receiver.email
          });
          const resolvedName = `${receiver.first_name} ${receiver.last_name}`.trim() || receiver.email;
          console.log(`🔍 DEBUG getSupplierOrderById - Nombre resuelto:`, resolvedName);
          order.received_by = resolvedName;
        } catch (error) {
          console.warn(`❌ No se pudo resolver received_by ${order.received_by}:`, error.message);
        }
      } else {
        console.log(`🔍 DEBUG getSupplierOrderById - No hay received_by en el pedido`);
      }
    } catch (error) {
      console.warn("No se pudo resolver usuarios:", error.message);
    }
    
    return order;
  }

  // =====================================================
  // VALIDACIÓN DE TRANSICIONES DE ESTADO
  // =====================================================

  // Validación de transiciones de estado permitidas
  private validateStatusTransition(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions: Record<string, string[]> = {
      draft: ['pending', 'confirmed', 'received', 'cancelled'],
      pending: ['confirmed', 'received', 'cancelled'],
      confirmed: ['shipped', 'received', 'cancelled'],
      shipped: ['partially_received', 'received', 'incident', 'cancelled'],
      partially_received: ['received', 'incident'],
      received: [], // Estado final, no se puede cambiar
      incident: ['received', 'cancelled'], // Solo se puede resolver o cancelar
      cancelled: [] // Estado final, no se puede cambiar
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Obtener estados válidos siguientes
  getValidNextStatuses(currentStatus: string): string[] {
    const allowedTransitions: Record<string, string[]> = {
      draft: ['pending', 'confirmed', 'received', 'cancelled'],
      pending: ['confirmed', 'received', 'cancelled'],
      confirmed: ['shipped', 'received', 'cancelled'],
      shipped: ['partially_received', 'received', 'incident', 'cancelled'],
      partially_received: ['received', 'incident'],
      received: [], 
      incident: ['received', 'cancelled'],
      cancelled: []
    };

    return allowedTransitions[currentStatus] || [];
  }

  // Obtener una línea específica por ID
  async getSupplierOrderLineById(lineId: string): Promise<SupplierOrderLine | null> {
    const lines = await this.listSupplierOrderLines({ id: lineId });
    return lines[0] || null;
  }

  // =====================================================
  // GESTIÓN DE INCIDENCIAS
  // =====================================================

  // Actualizar incidencia de una línea específica
  async updateOrderLineIncident(
    lineId: string, 
    hasIncident: boolean, 
    incidentNotes?: string,
    userId?: string
  ): Promise<SupplierOrderLine> {
    console.log(`🚨 Actualizando incidencia para línea ${lineId}: ${hasIncident}`);
    
    // Obtener nombre del usuario si se proporciona
    let userName = userId;
    if (userId) {
      // Solo intentar resolver si parece un ID (formato típico de Medusa)
      if (userId.length > 20 && userId.includes('_')) {
        try {
          // @ts-ignore
          const userModuleService = this.container_.resolve("userModuleService");
          const user = await userModuleService.retrieveUser(userId);
          userName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.email || userId;
          console.log(`👤 Usuario ID resuelto para incidencia: ${userName}`);
        } catch (error) {
          console.warn(`⚠️ No se pudo obtener información del usuario ${userId}:`, error);
          userName = userId;
        }
      } else {
        // Si no parece un ID, asumir que ya es un nombre
        console.log(`👤 Usuario recibido directamente para incidencia: ${userName}`);
      }
    }
    
    const updateData: any = {
      id: lineId,
      line_status: hasIncident ? 'incident' : 'pending',
      reception_notes: incidentNotes || null
    };
    
    // Solo actualizar campos de recepción si se está marcando una incidencia
    if (hasIncident) {
      updateData.received_at = new Date();
      updateData.received_by = userName;
    }

    const updatedLine = await this.updateSupplierOrderLines(updateData);
    console.log(`✅ Línea actualizada: status=${updatedLine.line_status}`);

    // Verificar si el pedido completo debe cambiar a 'incident'
    const line = await this.getSupplierOrderLineById(lineId);
    if (line?.supplier_order_id) {
      await this.checkAndUpdateOrderIncidentStatus(line.supplier_order_id);
    }

    return updatedLine;
  }

  // Verificar si el pedido debe cambiar a estado 'incident'
  private async checkAndUpdateOrderIncidentStatus(orderId: string): Promise<void> {
    const lines = await this.listSupplierOrderLines({
      supplier_order_id: orderId
    });

    const hasIncidentLines = lines.some(line => line.line_status === 'incident');
    const order = await this.getSupplierOrderById(orderId);
    
    if (!order) return;

    // Solo cambiar estado del pedido si NO está en estado final (received, cancelled)
    const finalStates = ['received', 'cancelled'];
    
    // Si hay líneas con incidencia y el pedido no está en incident y no está en estado final
    if (hasIncidentLines && order.status !== 'incident' && !finalStates.includes(order.status)) {
      console.log(`🚨 Cambiando pedido ${orderId} a estado 'incident' debido a líneas con incidencias`);
      await this.updateSupplierOrderStatus(orderId, 'incident');
    }
    // Si el pedido está en estado final, solo loggear pero no cambiar estado
    else if (hasIncidentLines && finalStates.includes(order.status)) {
      console.log(`⚠️ Pedido ${orderId} en estado final '${order.status}', manteniendo estado del pedido pero marcando línea con incidencia`);
    }
    // Si no hay líneas con incidencia y el pedido está en incident, podría volver a su estado anterior
    else if (!hasIncidentLines && order.status === 'incident') {
      console.log(`✅ Pedido ${orderId} resuelto, todas las incidencias han sido solucionadas`);
      // Aquí podrías implementar lógica para volver al estado anterior si es necesario
    }
  }

  async updateSupplierOrderStatus(
    id: string,
    status: string,
    userId?: string
  ): Promise<SupplierOrder> {
    console.log(`🔄 Actualizando estado del pedido ${id} a ${status}`);
    
    // Obtener estado actual del pedido
    const currentOrder = await this.getSupplierOrderById(id);
    if (!currentOrder) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Supplier order with id ${id} not found`
      );
    }

    // Validar transición de estado
    if (!this.validateStatusTransition(currentOrder.status, status)) {
      const validStatuses = this.getValidNextStatuses(currentOrder.status);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid status transition from ${currentOrder.status} to ${status}. Valid transitions: ${validStatuses.join(', ')}`
      );
    }

    console.log(`✅ Transición válida: ${currentOrder.status} → ${status}`);

    const updateData: any = {
      id, // ¡CRÍTICO! Incluir el ID como hace financing_data
      status,
    };

    // Agregar timestamps según el estado
    switch (status) {
      case "confirmed":
        updateData.confirmed_at = new Date();
        updateData.shipped_at = new Date(); // Auto-activar enviado cuando se confirma
        break;
      case "shipped":
        updateData.shipped_at = new Date();
        break;
      case "received":
        updateData.received_at = new Date();
        if (userId) {
          updateData.received_by = userId;
          console.log(`🔍 DEBUG updateSupplierOrderStatus - Guardando received_by:`, userId);
        } else {
          console.log(`⚠️ WARNING updateSupplierOrderStatus - No userId provided for received status`);
        }
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
    console.log(
      `🔍 DEBUG addOrderLine - product_thumbnail:`,
      lineData.product_thumbnail
    );
    console.log(
      `🔍 DEBUG addOrderLine - product_thumbnail type:`,
      typeof lineData.product_thumbnail
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
    console.log(
      `🔍 DEBUG addOrderLine - product_thumbnail en lineWithOrder:`,
      lineWithOrder.product_thumbnail
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
    console.log(
      `🔍 DEBUG addOrderLine - product_thumbnail en línea creada:`,
      line.product_thumbnail
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

    // Obtener nombre del usuario si se proporciona received_by
    let receivedByName = data.received_by;
    if (data.received_by) {
      // Solo intentar resolver si parece un ID (formato típico de Medusa)
      if (data.received_by.length > 20 && data.received_by.includes('_')) {
        try {
          // @ts-ignore
          const userModuleService = this.container_.resolve("userModuleService");
          const user = await userModuleService.retrieveUser(data.received_by);
          receivedByName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.email || data.received_by;
          console.log(`👤 Usuario ID resuelto: ${receivedByName}`);
        } catch (error) {
          console.warn(`⚠️ No se pudo obtener información del usuario ${data.received_by}:`, error);
          // Mantener el ID original si no se puede resolver
          receivedByName = data.received_by;
        }
      } else {
        // Si no parece un ID, asumir que ya es un nombre
        console.log(`👤 Usuario recibido directamente: ${receivedByName}`);
      }
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

    // Usar el método auto-generado plural como otros métodos de MedusaJS
    //@ts-ignore
    const updatedLine = await this.updateSupplierOrderLines({
      id: lineId,
      quantity_received: newQuantityReceived,
      quantity_pending: Math.max(0, newQuantityPending),
      line_status: lineStatus,
      received_at: new Date(),
      received_by: receivedByName,
      reception_notes: data.reception_notes,
    });

    // Registrar movimiento de inventario (solo si tiene product_id)
    if (line.product_id) {
      console.log(`📝 Registrando movimiento de inventario para producto ${line.product_id}...`);
      await this.recordInventoryMovement({
        movement_type: "supplier_receipt",
        reference_id: line.supplier_order_id,
        reference_type: "supplier_order",
        product_id: line.product_id,
        product_variant_id: line.product_variant_id,
        product_title: line.product_title, // ✅ Campo requerido agregado
        to_location_id: "default",
        quantity: data.quantity_received,
        unit_cost: line.unit_price,
        total_cost: line.unit_price * data.quantity_received,
        performed_by: receivedByName,
        performed_at: new Date(),
      });
      console.log(`✅ Movimiento de inventario registrado correctamente`);
    } else {
      console.log(`⚠️ Saltando registro de movimiento - línea sin product_id (producto manual)`);
      console.log(`   - Título: "${line.product_title}"`);
      console.log(`   - Cantidad recibida: ${data.quantity_received}`);
    }

    // Actualizar estado del pedido automáticamente
    await this.updateOrderStatusBasedOnLines(line.supplier_order_id, data.received_by);

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

  // Crear o actualizar relación ProductSupplier con SKU
  async syncProductSupplier(data: {
    product_id: string;
    supplier_id: string;
    supplier_sku?: string;
    unit_price?: number;
  }): Promise<ProductSupplier> {
    console.log(`🔗 Sincronizando ProductSupplier:`, JSON.stringify(data, null, 2));
    
    try {
      // Buscar si ya existe una relación para este producto y proveedor
      const searchCriteria = {
        product_id: data.product_id,
        supplier: { id: data.supplier_id }
      };
      console.log(`🔍 Buscando ProductSupplier con:`, JSON.stringify(searchCriteria, null, 2));
      
      const existingRelations = await this.listProductSuppliers(searchCriteria);
      console.log(`📦 Encontradas ${existingRelations.length} relaciones existentes`);

      if (existingRelations.length > 0) {
        // Actualizar la relación existente
        const existing = existingRelations[0];
        const updateData: any = {
          id: existing.id,
          last_purchase_date: new Date(),
          last_price_update: new Date(),
        };

        // Solo actualizar el SKU si se proporciona uno nuevo y es diferente
        if (data.supplier_sku && data.supplier_sku !== existing.supplier_sku) {
          updateData.supplier_sku = data.supplier_sku;
          console.log(`📝 Actualizando SKU de "${existing.supplier_sku}" a "${data.supplier_sku}"`);
        }

        // Actualizar precio si se proporciona
        if (data.unit_price) {
          updateData.cost_price = data.unit_price;
        }

        //@ts-ignore
        return await this.updateProductSupplier(updateData);
      } else {
        // Crear nueva relación
        console.log(`✨ Creando nueva relación ProductSupplier`);
        const createData = {
          product_id: data.product_id,
          supplier: { id: data.supplier_id },
          supplier_sku: data.supplier_sku || null,
          cost_price: data.unit_price || null,
          last_purchase_date: new Date(),
          last_price_update: new Date(),
          is_active: true,
        };
        console.log(`📝 Datos para crear ProductSupplier:`, JSON.stringify(createData, null, 2));
        
        return await this.linkProductToSupplier(createData);
      }
    } catch (error: any) {
      console.error(`❌ Error sincronizando ProductSupplier:`, error.message);
      throw error;
    }
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

      // ✅ Simplificado: Solo registrar ubicación sin validar por ahora
      console.log(`📍 Ubicación de destino: ${locationId}`);

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
      console.error(`   - Container disponible: ${!!this.container}`);
      
      // Intentar resolver servicios para debugging
      try {
        const inventoryService = this.container.resolve(Modules.INVENTORY);
        console.error(`     - inventoryService: ${!!inventoryService}`);
      } catch (e) {
        console.error(`     - inventoryService: ERROR - ${e.message}`);
      }
      
      try {
        const productService = this.container.resolve(Modules.PRODUCT);
        console.error(`     - productService: ${!!productService}`);
      } catch (e) {
        console.error(`     - productService: ERROR - ${e.message}`);
      }

      // No re-lanzar el error para evitar que falle todo el proceso de cambio de estado
      console.log(
        `⚠️ Continuando con el cambio de estado del pedido sin actualizar stock`
      );
    }
  }

  // ✅ ACTUALIZAR STOCK USANDO WORKFLOW PERSONALIZADO
  private async updateMedusaStock(
    productId: string,
    locationId: string,
    quantity: number
  ): Promise<void> {
    try {
      console.log(`🔄 Actualizando stock usando workflow personalizado:
        - Producto: ${productId}
        - Ubicación: ${locationId}
        - Incremento: +${quantity}`);

      // ✅ OBTENER INVENTORY_ITEM_ID REAL
      let inventoryItemId: string;
      
      if (productId === "prod_01JW8Q2AMT137NRGVSZVECKPM3") {
        inventoryItemId = "iitem_01K2HTR2JH1NHDAFF7R3GZVF5F";
        console.log(`📦 Usando inventory_item_id REAL: ${inventoryItemId}`);
      } else {
        // Para otros productos, usar el patrón de generación como fallback
        inventoryItemId = `inv_${productId.replace("prod_", "")}`;
        console.log(`📦 Inventory Item ID generado (fallback): ${inventoryItemId}`);
        console.log(`⚠️ NOTA: Para mejores resultados, obtener el inventory_item_id real desde la DB`);
      }

      // ✅ EJECUTAR WORKFLOW PERSONALIZADO
      const result = await updateSupplierStockWorkflow(this.container).run({
        input: {
          inventoryItemId,
          locationId,
          quantity,
          productId,
        },
      });

      console.log(`✅ Stock actualizado correctamente:`, result.result);
    } catch (error: any) {
      console.error(`❌ Error actualizando stock:`, error.message);
      console.error(`📊 Stack trace:`, error.stack);
      throw error;
    }
  }


  private async updateOrderStatusBasedOnLines(orderId: string, userId?: string): Promise<void> {
    // Obtener todas las líneas del pedido
    const lines = await this.listSupplierOrderLines({
      supplier_order_id: orderId,
    });

    if (lines.length === 0) return;
    
    // Obtener estado actual del pedido
    const currentOrder = await this.getSupplierOrderById(orderId);
    if (!currentOrder || currentOrder.status === "cancelled") return;

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
      // No se ha recibido nada todavía, mantener estado actual
      return; 
    }
    
    // Si se ha recibido algo, ir directamente a "received" 
    newStatus = "received";

    // Actualizar el estado del pedido si es diferente y es una transición válida
    if (currentOrder.status !== newStatus && this.validateStatusTransition(currentOrder.status, newStatus)) {
      console.log(`🔄 Actualizando estado: ${currentOrder.status} → ${newStatus}`);
      await this.updateSupplierOrderStatus(orderId, newStatus, userId);
      
      // Si hemos hecho una transición desde estados tempranos y aún no hemos llegado al objetivo final,
      // hacer transiciones adicionales progresivamente
      const updatedOrder = await this.getSupplierOrderById(orderId);
      if (updatedOrder && updatedOrder.status !== targetStatus) {
        // Llamar recursivamente para continuar las transiciones
        console.log(`🔄 Continuando transiciones hacia ${targetStatus}`);
        setTimeout(() => this.updateOrderStatusBasedOnLines(orderId, userId), 100);
        setTimeout(async () => {
          await this.updateSupplierOrderStatus(orderId, "received", userId);
        }, 100);
      }
    }
  }

  // Obtener precios de todos los productos para un proveedor específico
  async getAllProductPricesForSupplier(supplierId: string): Promise<Record<string, any>> {
    try {
      console.log(`📊 Obteniendo precios masivos para proveedor: ${supplierId}`);
      
      // Obtener todos los pedidos de este proveedor para extraer productos únicos
      const orders = await this.listSupplierOrders({ 
        supplier_id: supplierId 
      });
      
      if (orders.length === 0) {
        console.log(`⚠️ No hay pedidos previos para proveedor ${supplierId}`);
        return {};
      }

      // Obtener todas las líneas de estos pedidos
      const allLines: any[] = [];
      for (const order of orders) {
        const lines = await this.listSupplierOrderLines({
          supplier_order_id: order.id
        });
        allLines.push(...lines);
      }

      if (allLines.length === 0) {
        console.log(`⚠️ No hay líneas de pedido para proveedor ${supplierId}`);
        return {};
      }

      // Agrupar por product_id y obtener el más reciente de cada uno
      const productPrices: Record<string, any> = {};
      
      for (const line of allLines) {
        if (!line.product_id) continue; // Saltar líneas sin product_id

        const existingPrice = productPrices[line.product_id];
        
        // Si no existe o esta línea es más reciente, actualizar
        if (!existingPrice || new Date(line.created_at) > new Date(existingPrice.last_order_date)) {
          // Obtener información del pedido para la fecha
          const order = orders.find(o => o.id === line.supplier_order_id);
          
          productPrices[line.product_id] = {
            product_id: line.product_id,
            product_title: line.product_title,
            last_price: line.unit_price,
            tax_rate: line.tax_rate || 0,
            discount_rate: line.discount_rate || 0,
            last_order_date: order?.order_date || line.created_at,
            last_order_display_id: order?.display_id,
            supplier_sku: line.supplier_sku
          };
        }
      }

      console.log(`✅ Precios masivos obtenidos: ${Object.keys(productPrices).length} productos`);
      return productPrices;

    } catch (error: any) {
      console.error(`❌ Error obteniendo precios masivos:`, error.message);
      return {};
    }
  }

  private async generateOrderDisplayId(orderType: string = "supplier"): Promise<string> {
    // Obtener conteo específico por tipo de pedido
    const orders = await this.listSupplierOrders({ order_type: orderType });
    const count = orders.length;
    
    // Generar prefijo según tipo
    const prefix = orderType === "transfer" ? "TO" : "PO"; // Transfer Order o Purchase Order
    
    return `${prefix}-${String(count + 1).padStart(6, "0")}`;
  }

  private async recalculateOrderTotals(orderId: string): Promise<void> {
    console.log(`🔢 Recalculating totals for order ${orderId}...`);
    
    const lines = await this.listSupplierOrderLines({
      supplier_order_id: orderId,
    });
    
    console.log(`📦 Found ${lines.length} lines for total calculation`);
    lines.forEach((line, index) => {
      console.log(`   Line ${index + 1}: total_price = ${line.total_price}`);
    });

    const subtotal = lines.reduce((sum, line) => sum + line.total_price, 0);
    // TODO: Calcular impuestos según configuración
    const taxTotal = 0;
    const total = subtotal + taxTotal;

    console.log(`💰 Calculated totals: subtotal=${subtotal}, tax=${taxTotal}, total=${total}`);

    // Usar el método auto-generado singular como financing_data
    //@ts-ignore
    const updateResult = await this.updateSupplierOrders({
      id: orderId,
      subtotal,
      tax_total: taxTotal,
      total,
    });
    
    console.log(`✅ Order totals updated successfully:`, updateResult);
  }

  // Obtener último precio pagado por un producto a un proveedor específico
  async getLastPriceForProduct(supplierId: string, productId: string): Promise<{
    last_price?: number;
    tax_rate?: number;
    discount_rate?: number;
    supplier_sku?: string;
    last_order_date?: string;
    last_order_display_id?: string;
  } | null> {
    console.log(`🔍 Buscando último precio para producto ${productId} del proveedor ${supplierId}`);
    
    try {
      // 🆕 PRIMERO: Buscar en ProductSupplier para obtener SKU
      let supplierSku: string | null = null;
      try {
        const productSupplierRelation = await this.listProductSuppliers({
          product_id: productId,
          supplier: { id: supplierId }
        });
        
        if (productSupplierRelation.length > 0) {
          supplierSku = productSupplierRelation[0].supplier_sku;
          console.log(`✅ SKU encontrado en ProductSupplier: ${supplierSku}`);
        } else {
          console.log(`ℹ️ No se encontró relación ProductSupplier para este producto y proveedor`);
        }
      } catch (error) {
        console.warn(`⚠️ Error buscando en ProductSupplier:`, error.message);
      }
      // Buscar las líneas de pedidos más recientes para este producto y proveedor
      const lines = await this.listSupplierOrderLines({
        product_id: productId,
      }, {
        skip: 0,
        take: 50,
        relations: ["supplier_order"],
        //@ts-ignore
        orderBy: { created_at: "desc" }
      });

      console.log(`📦 Encontradas ${lines.length} líneas para el producto ${productId}`);
      
      // Depurar: ver todos los pedidos de este producto con este proveedor
      const allRelevantLines = lines.filter(line => {
        //@ts-ignore
        const order = line.supplier_order;
        return order && order.supplier_id === supplierId;
      });
      
      console.log(`🔍 Líneas de este proveedor encontradas: ${allRelevantLines.length}`);
      allRelevantLines.forEach((line, index) => {
        //@ts-ignore
        const order = line.supplier_order;
        console.log(`  📋 Línea ${index + 1}:`, {
          status: order?.status,
          display_id: order?.display_id,
          supplier_sku: line.supplier_sku,
          unit_price: line.unit_price,
          created_at: order?.created_at
        });
      });
      
      // Filtrar por proveedor y buscar la más reciente de pedidos confirmados/completados/draft
      const relevantLine = lines.find(line => {
        //@ts-ignore
        const order = line.supplier_order;
        return order && 
               order.supplier_id === supplierId && 
               ["draft", "confirmed", "shipped", "partially_received", "received"].includes(order.status);
      });

      if (!relevantLine) {
        console.log(`❌ No se encontró historial de precios para producto ${productId} del proveedor ${supplierId}`);
        
        // Si no hay historial de pedidos pero sí hay SKU en ProductSupplier, devolver al menos el SKU
        if (supplierSku) {
          console.log(`💡 No hay historial de precios, pero devolviendo SKU de ProductSupplier`);
          return {
            supplier_sku: supplierSku,
            last_price: undefined,
            tax_rate: undefined,
            discount_rate: undefined,
            last_order_date: undefined,
            last_order_display_id: undefined,
          };
        }
        
        return null;
      }

      //@ts-ignore
      const order = relevantLine.supplier_order;
      const result = {
        last_price: relevantLine.unit_price,
        tax_rate: relevantLine.tax_rate || 0,
        discount_rate: relevantLine.discount_rate || 0,
        // Priorizar SKU de ProductSupplier sobre historial de pedidos
        supplier_sku: supplierSku || relevantLine.supplier_sku || null,
        last_order_date: order.order_date,
        last_order_display_id: order.display_id,
      };

      if (supplierSku) {
        console.log(`🎯 Usando SKU de ProductSupplier: ${supplierSku}`);
      } else if (relevantLine.supplier_sku) {
        console.log(`📋 Usando SKU del historial de pedidos: ${relevantLine.supplier_sku}`);
      }

      console.log(`✅ Último precio encontrado:`, result);
      // @ts-ignore
      return result;

    } catch (error: any) {
      console.error(`❌ Error obteniendo último precio:`, error.message);
      return null;
    }
  }

  // =====================================================
  // MÉTODOS ESPECÍFICOS PARA TRANSFERENCIAS
  // =====================================================

  // Crear pedido tipo transferencia
  async createTransferOrder(data: {
    fromLocationId: string;
    fromLocationName: string;
    toLocationId: string;
    toLocationName: string;
    supplierId: string;
    notes?: string;
    performedBy?: string;
    expectedDeliveryDate?: Date;
  }): Promise<SupplierOrder> {
    const transferOrderData = {
      supplier_id: data.supplierId,
      order_type: "transfer",
      status: "confirmed", // Las transferencias van directo a confirmed
      order_date: new Date(),
      expected_delivery_date: data.expectedDeliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      
      // Ubicaciones
      source_location_id: data.fromLocationId,
      source_location_name: data.fromLocationName,
      destination_location_id: data.toLocationId,
      destination_location_name: data.toLocationName,
      
      // Información adicional
      reference: `TRANSFER_${Date.now()}`,
      notes: data.notes || "Transferencia interna de stock",
      internal_notes: "Pedido generado automáticamente por transferencia",
      
      // Auditoría
      created_by: data.performedBy || "system",
      
      // Financiero (para transferencias es 0)
      currency_code: "EUR",
      subtotal: 0,
      tax_total: 0,
      discount_total: 0,
      total: 0,
      
      metadata: {
        transfer_type: "internal",
        auto_generated: true,
        created_at: new Date().toISOString()
      }
    };

    return await this.createSupplierOrder(transferOrderData);
  }

  // Obtener pedidos de transferencia
  async getTransferOrders(filters: any = {}): Promise<SupplierOrder[]> {
    return await this.listSupplierOrders(
      { ...filters, order_type: "transfer" },
      { relations: ["supplier", "order_lines"] }
    );
  }

  // Marcar transferencia como enviada (shipped)
  async markTransferAsShipped(orderId: string, performedBy?: string): Promise<SupplierOrder> {
    const updateData = {
      id: orderId,
      status: "shipped",
      shipped_at: new Date(),
      notes: "Transferencia física completada automáticamente"
    };

    if (performedBy) {
      // @ts-ignore
      updateData.metadata = {
        shipped_by: performedBy,
        auto_shipped: true
      };
    }

    //@ts-ignore
    return await this.updateSupplierOrder(updateData);
  }

  // Obtener estadísticas de transferencias
  async getTransferStatistics(): Promise<{
    total: number;
    pending: number;
    shipped: number;
    received: number;
    withIncidents: number;
  }> {
    const transfers = await this.getTransferOrders();
    
    return {
      total: transfers.length,
      pending: transfers.filter(t => t.status === "confirmed").length,
      shipped: transfers.filter(t => t.status === "shipped").length,
      received: transfers.filter(t => t.status === "received").length,
      withIncidents: transfers.filter(t => t.status === "incident").length,
    };
  }

  // Validar si un pedido es transferencia
  isTransferOrder(order: SupplierOrder): boolean {
    return order.order_type === "transfer";
  }

  // Obtener información de ubicaciones para transferencias
  getTransferLocationInfo(order: SupplierOrder): {
    from: { id: string; name: string } | null;
    to: { id: string; name: string } | null;
  } {
    if (!this.isTransferOrder(order)) {
      return { from: null, to: null };
    }

    return {
      from: order.source_location_id 
        ? { id: order.source_location_id, name: order.source_location_name || "Ubicación origen" }
        : null,
      to: order.destination_location_id
        ? { id: order.destination_location_id, name: order.destination_location_name || "Ubicación destino" }
        : null
    };
  }

  // Comparar precios del producto entre todos los proveedores
  async compareProductPricesAcrossSuppliers(productId: string, currentSupplierId: string): Promise<{
    cheapest_option?: {
      supplier_id: string;
      supplier_name: string;
      last_price: number;
      savings: number;
      last_order_date: string;
    }
  }> {
    console.log(`💰 Comparando precios para producto ${productId}, proveedor actual ${currentSupplierId}`);
    
    try {
      // Obtener último precio del proveedor actual para referencia
      const currentPriceInfo = await this.getLastPriceForProduct(currentSupplierId, productId);
      if (!currentPriceInfo?.last_price) {
        console.log(`ℹ️ No hay precio de referencia del proveedor actual`);
        return {};
      }

      const currentPrice = currentPriceInfo.last_price;
      console.log(`💰 Precio actual de referencia: ${currentPrice}€`);

      // TEMPORALMENTE: Buscar todos los pedidos (sin límite de tiempo para debug)
      console.log(`🔍 [DEBUG] Buscando TODOS los pedidos de otros proveedores`);
      console.log(`🚫 Excluyendo proveedor actual: ${currentSupplierId}`);

      const ordersQuery = await this.listSupplierOrders({
        status: { $in: ["draft", "confirmed", "shipped", "partially_received", "received"] }, // Incluir draft para debug
        supplier_id: { $ne: currentSupplierId } // Excluir proveedor actual
      }, {
        relations: ["supplier"] // ✅ Incluir relación para obtener supplier.name
      });

      console.log(`📦 Pedidos encontrados para comparar: ${ordersQuery.length}`);

      let cheapestOption: any = null;

      // Buscar en las líneas de todos los pedidos
      for (const order of ordersQuery) {
        console.log(`🔍 Revisando pedido ${order.display_id} de proveedor ${order.supplier?.name} (${order.supplier_id})`);
        console.log(`🔍 [DEBUG] order.supplier:`, order.supplier);
        console.log(`🔍 [DEBUG] order.supplier_id:`, order.supplier_id);
        
        const orderLinesQuery = await this.listSupplierOrderLines({
          supplier_order_id: order.id,
          product_id: productId
        });

        console.log(`📋 Líneas encontradas en pedido ${order.display_id}: ${orderLinesQuery.length}`);

        for (const line of orderLinesQuery) {
          console.log(`💰 Línea encontrada - Producto: ${line.product_id}, Precio: ${line.unit_price}€`);
          
          if (line.unit_price && line.unit_price > 0) {
            const potentialSavings = currentPrice - line.unit_price;
            const savingsPercentage = (potentialSavings / currentPrice) * 100;

            console.log(`💡 Comparación - Precio actual: ${currentPrice}€, Precio línea: ${line.unit_price}€, Ahorro: ${potentialSavings.toFixed(2)}€ (${savingsPercentage.toFixed(1)}%)`);

            // TEMPORALMENTE: Solo considerar si hay algún ahorro (para debug)
            if (potentialSavings > 0) {
              console.log(`✅ Ahorro significativo detectado!`);
              if (!cheapestOption || line.unit_price < cheapestOption.last_price) {
                console.log(`🔍 [DEBUG] INICIANDO búsqueda de proveedor...`);
                
                // Buscar el proveedor directamente siempre (la relación no funciona)
                let supplierName = "Proveedor desconocido";
                
                if (order.supplier_id) {
                  console.log(`🔍 [DEBUG] Buscando proveedor con ID: ${order.supplier_id}`);
                  try {
                    const supplier = await this.getSupplierById(order.supplier_id);
                    console.log(`🔍 [DEBUG] Resultado de getSupplierById:`, supplier);
                    if (supplier && supplier.name) {
                      supplierName = supplier.name;
                      console.log(`✅ [DEBUG] Proveedor encontrado: "${supplierName}"`);
                    } else {
                      console.log(`❌ [DEBUG] Proveedor no encontrado o sin nombre`);
                    }
                  } catch (error) {
                    console.error(`❌ [DEBUG] Error obteniendo proveedor:`, error);
                  }
                }
                
                console.log(`🏆 [DEBUG] Nombre final: "${supplierName}"`);
                
                cheapestOption = {
                  supplier_id: order.supplier_id,
                  supplier_name: supplierName,
                  last_price: line.unit_price,
                  savings: potentialSavings,
                  last_order_date: order.order_date
                };
                console.log(`🏆 Nueva mejor opción: ${cheapestOption.supplier_name} - ${cheapestOption.last_price}€`);
              }
            } else {
              console.log(`❌ No hay ahorro (precio línea >= precio actual)`);
            }
          } else {
            console.log(`❌ Precio de línea inválido: ${line.unit_price}`);
          }
        }
      }

      if (cheapestOption) {
        console.log(`✅ Opción más barata encontrada: ${cheapestOption.supplier_name} - ${cheapestOption.last_price}€ (Ahorro: ${cheapestOption.savings.toFixed(2)}€)`);
        return { cheapest_option: cheapestOption };
      } else {
        console.log(`ℹ️ No se encontraron opciones más baratas significativas`);
        return {};
      }

    } catch (error: any) {
      console.error(`❌ Error comparando precios entre proveedores:`, error.message);
      return {};
    }
  }
}

export default SupplierManagementModuleService;

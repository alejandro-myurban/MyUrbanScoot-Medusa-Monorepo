import { MedusaError, MedusaService } from "@medusajs/framework/utils";
import { InferTypeOf } from "@medusajs/framework/types";

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
    const orders = await this.listSupplierOrders({ id });
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

    return updatedOrder;
  }

  // =====================================================
  // MÉTODOS PARA ORDER LINES
  // =====================================================

  async addOrderLine(lineData: any): Promise<SupplierOrderLine> {
    const lineWithOrder = {
      ...lineData,
      total_price: lineData.unit_price * lineData.quantity_ordered,
      quantity_pending: lineData.quantity_ordered,
    };

    const line = await this.createSupplierOrderLines(lineWithOrder);

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
    await this.updateSupplierOrder({
      id: orderId,
      subtotal,
      tax_total: taxTotal,
      total,
    });
  }
}

export default SupplierManagementModuleService;

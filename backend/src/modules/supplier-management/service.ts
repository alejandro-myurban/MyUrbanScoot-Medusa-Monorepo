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

  async updateSupplier(id: string, data: any): Promise<Supplier> {
    return await this.updateSuppliers({ id }, data);
  }

  async deactivateSupplier(id: string): Promise<Supplier> {
    return await this.updateSuppliers({ id }, { is_active: false });
  }

  // =====================================================
  // MÉTODOS PARA SUPPLIER ORDERS
  // =====================================================
  
  async createSupplierOrder(data: any): Promise<SupplierOrder> {
    // Generar display_id si no se proporciona
    if (!data.display_id) {
      data.display_id = await this.generateOrderDisplayId();
    }
    
    return await this.createSupplierOrders(data);
  }

  async getSupplierOrderById(id: string): Promise<SupplierOrder | null> {
    const orders = await this.listSupplierOrders({ 
      id,
      relations: ["supplier", "order_lines"]
    });
    return orders[0] || null;
  }

  async updateSupplierOrderStatus(id: string, status: string, userId?: string): Promise<SupplierOrder> {
    const updateData: any = { status };
    
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
    
    return await this.updateSupplierOrders({ id }, updateData);
  }

  // =====================================================
  // MÉTODOS PARA ORDER LINES
  // =====================================================

  async addOrderLine(supplierOrderId: string, lineData: any): Promise<SupplierOrderLine> {
    const lineWithOrder = {
      ...lineData,
      supplier_order_id: supplierOrderId,
      total_price: lineData.unit_price * lineData.quantity_ordered,
      quantity_pending: lineData.quantity_ordered
    };
    
    const line = await this.createSupplierOrderLines(lineWithOrder);
    
    // Recalcular totales del pedido
    await this.recalculateOrderTotals(supplierOrderId);
    
    return line;
  }

  async receiveOrderLine(lineId: string, quantityReceived: number, userId?: string, notes?: string): Promise<SupplierOrderLine> {
    const line = await this.listSupplierOrderLines({ id: lineId })[0];
    
    if (!line) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order line not found");
    }

    const newQuantityReceived = line.quantity_received + quantityReceived;
    const newQuantityPending = line.quantity_ordered - newQuantityReceived;

    // Determinar estado de la línea
    let lineStatus = "pending";
    if (newQuantityReceived >= line.quantity_ordered) {
      lineStatus = "received";
    } else if (newQuantityReceived > 0) {
      lineStatus = "partial";
    }

    const updatedLine = await this.updateSupplierOrderLines({ id: lineId }, {
      quantity_received: newQuantityReceived,
      quantity_pending: Math.max(0, newQuantityPending),
      line_status: lineStatus,
      received_at: new Date(),
      received_by: userId,
      reception_notes: notes
    });

    // Registrar movimiento de inventario
    await this.recordInventoryMovement({
      movement_type: "supplier_receipt",
      reference_id: line.supplier_order_id,
      reference_type: "supplier_order",
      product_id: line.product_id,
      product_variant_id: line.product_variant_id,
      product_title: line.product_title,
      to_location_id: "default", // TODO: obtener del pedido
      quantity: quantityReceived,
      unit_cost: line.unit_price,
      total_cost: line.unit_price * quantityReceived,
      performed_by: userId,
      performed_at: new Date(),
      reason: `Receipt from supplier order ${line.supplier_order.display_id}`
    });

    return updatedLine;
  }

  // =====================================================
  // MÉTODOS PARA INVENTORY MOVEMENTS
  // =====================================================

  async recordInventoryMovement(data: any): Promise<InventoryMovement> {
    return await this.createInventoryMovements(data);
  }

  async getInventoryMovementsForProduct(productId: string): Promise<InventoryMovement[]> {
    return await this.listInventoryMovements({
      product_id: productId
    });
  }

  // =====================================================
  // MÉTODOS PARA PRODUCT SUPPLIERS
  // =====================================================

  async linkProductToSupplier(productId: string, supplierId: string, data: any): Promise<ProductSupplier> {
    return await this.createProductSuppliers({
      product_id: productId,
      supplier_id: supplierId,
      ...data
    });
  }

  async updateProductSupplierCost(productId: string, supplierId: string, newCost: number, currency = "EUR"): Promise<ProductSupplier> {
    // Obtener relación existente
    const existing = await this.listProductSuppliers({
      product_id: productId,
      supplier_id: supplierId
    });

    if (!existing.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product-supplier relationship not found");
    }

    const productSupplier = existing[0];
    
    // Actualizar historial de precios
    const priceHistory = productSupplier.price_history || [];
    priceHistory.push({
      date: new Date().toISOString(),
      price: productSupplier.cost_price,
      currency: productSupplier.currency_code
    });

    return await this.updateProductSuppliers(
      { product_id: productId, supplier_id: supplierId },
      {
        cost_price: newCost,
        currency_code: currency,
        price_history: priceHistory,
        last_price_update: new Date()
      }
    );
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private async generateOrderDisplayId(): Promise<string> {
    const count = await this.listSupplierOrders().length;
    return `PO-${String(count + 1).padStart(6, '0')}`;
  }

  private async recalculateOrderTotals(orderId: string): Promise<void> {
    const lines = await this.listSupplierOrderLines({
      supplier_order_id: orderId
    });

    const subtotal = lines.reduce((sum, line) => sum + line.total_price, 0);
    // TODO: Calcular impuestos según configuración
    const taxTotal = 0;
    const total = subtotal + taxTotal;

    await this.updateSupplierOrders({ id: orderId }, {
      subtotal,
      tax_total: taxTotal,
      total
    });
  }
}

export default SupplierManagementModuleService;
import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { SUPPLIER_MODULE } from "../modules/supplier-management";

// Tipo para el input del workflow híbrido
type TransferAsOrderInput = {
  inventoryItemId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  productId: string;
  productTitle: string;
  performedBy?: string;
  reason?: string;
  notes?: string;
  expected_delivery_date?: Date;
};

// Step para crear el proveedor virtual de transferencias si no existe
const ensureTransferSupplierStep = createStep(
  "ensure-transfer-supplier-step",
  async (input: {}, { container }) => {
    console.log("🏭 SUPPLIER: Verificando proveedor virtual de transferencias...");
    
    try {
      const supplierService = container.resolve(SUPPLIER_MODULE);
      
      // Buscar proveedor de transferencias existente
      const existingSuppliers = await supplierService.listSuppliers({
        code: "TRANSFER"
      });
      
      if (existingSuppliers.length > 0) {
        const existingSupplierId = existingSuppliers[0].id;
        console.log("✅ SUPPLIER: Proveedor de transferencias ya existe, ID:", existingSupplierId);
        return new StepResponse({
          supplierId: existingSupplierId,
          created: false
        });
      }
      
      // Crear proveedor virtual
      const transferSupplier = await supplierService.createSupplier({
        name: "Transferencia Interna",
        legal_name: "Sistema de Transferencias Internas", // Campo obligatorio
        code: "TRANSFER",
        tax_id: "TRANSFER-SYSTEM", // Campo obligatorio único
        email: "transfers@internal.system",
        phone: "000-000-000",
        is_active: true,
        supplier_type: "internal_transfer",
        notes: "Proveedor virtual para transferencias internas de stock",
        metadata: {
          virtual: true,
          system_created: true,
          created_at: new Date().toISOString()
        }
      });
      
      console.log("✅ SUPPLIER: Proveedor de transferencias creado:", transferSupplier.id);
      
      return new StepResponse({
        supplierId: transferSupplier.id,
        created: true
      }, {
        supplierId: transferSupplier.id
      });
      
    } catch (error: any) {
      console.error("❌ SUPPLIER ERROR:", error.message);
      throw error;
    }
  },
  async (stepInput, { container }) => {
    // Rollback: eliminar proveedor si fue creado en este step
    if (stepInput.created) {
      try {
        const supplierService = container.resolve(SUPPLIER_MODULE);
        await supplierService.deactivateSupplier(stepInput.supplierId);
        console.log("🔄 ROLLBACK: Proveedor de transferencias desactivado");
      } catch (error: any) {
        console.error("❌ ROLLBACK ERROR:", error.message);
      }
    }
  }
);

// Step para crear el pedido tipo transferencia
const createTransferOrderStep = createStep(
  "create-transfer-order-step",
  async (input: TransferAsOrderInput & { supplierId: string }, { container }) => {
    const { 
      supplierId,
      fromLocationId,
      toLocationId,
      productId,
      productTitle,
      quantity,
      performedBy,
      reason,
      notes,
      expected_delivery_date
    } = input;
    
    console.log("📋 ORDER: Creando pedido tipo transferencia...");
    console.log("🔍 ORDER: Supplier ID recibido:", supplierId);
    
    try {
      const supplierService = container.resolve(SUPPLIER_MODULE);
      const stockLocationService = container.resolve(Modules.STOCK_LOCATION);
      
      // Obtener nombres de las ubicaciones
      const [sourceLocation, destLocation] = await Promise.all([
        stockLocationService.retrieveStockLocation(fromLocationId),
        stockLocationService.retrieveStockLocation(toLocationId)
      ]);
      
      // Generar display_id específico para transferencias  
      const transferOrderData = {
        supplier_id: supplierId,
        order_type: "transfer",
        status: "confirmed", // Las transferencias van directo a confirmed
        order_date: new Date(),
        expected_delivery_date: expected_delivery_date || new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 día por defecto
        
        // Ubicaciones
        source_location_id: fromLocationId,
        source_location_name: sourceLocation.name,
        destination_location_id: toLocationId,
        destination_location_name: destLocation.name,
        
        // Información adicional
        reference: `TRANSFER_${Date.now()}`,
        notes: notes || `Transferencia de ${quantity} unidades de ${productTitle}`,
        internal_notes: reason || "Transferencia interna de stock",
        
        // Auditoría
        created_by: performedBy || "system",
        
        // Financiero (para transferencias es 0)
        currency_code: "EUR",
        subtotal: 0,
        tax_total: 0,
        discount_total: 0,
        total: 0,
        
        metadata: {
          transfer_type: "internal",
          original_workflow: "transfer-as-order",
          created_at: new Date().toISOString()
        }
      };
      
      console.log("🔍 ORDER: Datos del pedido antes de crear:", {
        supplier_id: transferOrderData.supplier_id,
        order_type: transferOrderData.order_type,
        display_id_will_be_generated: true
      });
      
      const transferOrder = await supplierService.createSupplierOrder(transferOrderData);
      console.log("✅ ORDER: Pedido transferencia creado:", transferOrder.display_id);
      
      // Crear línea de pedido
      const orderLineData = {
        supplier_order_id: transferOrder.id,
        product_id: productId,
        product_title: productTitle,
        product_sku: productId, // Usar product_id como SKU por ahora
        quantity_ordered: quantity,
        quantity_received: 0,
        quantity_pending: quantity, // Inicialmente toda la cantidad está pendiente
        unit_price: 0, // Las transferencias no tienen precio
        total_price: 0,
        status: "pending_receipt",
        notes: `Transferencia desde ${sourceLocation.name} hacia ${destLocation.name}`,
        metadata: {
          transfer_line: true,
          inventory_item_id: input.inventoryItemId
        }
      };
      
      const orderLine = await supplierService.createSupplierOrderLines(orderLineData);
      console.log("✅ ORDER LINE: Línea de pedido creada para transferencia");
      
      return new StepResponse({
        orderId: transferOrder.id,
        orderDisplayId: transferOrder.display_id,
        orderLineId: orderLine.id,
        sourceLocationName: sourceLocation.name,
        destLocationName: destLocation.name
      }, {
        orderId: transferOrder.id,
        orderLineId: orderLine.id
      });
      
    } catch (error: any) {
      console.error("❌ ORDER ERROR:", error.message);
      throw error;
    }
  },
  async (stepInput, { container }) => {
    // Rollback: eliminar pedido y línea creados
    try {
      const supplierService = container.resolve(SUPPLIER_MODULE);
      
      // Eliminar línea de pedido si existe
      if (stepInput && stepInput.orderLineId) {
        try {
          await supplierService.deleteSupplierOrderLine(stepInput.orderLineId);
          console.log("🔄 ROLLBACK: Línea de pedido eliminada");
        } catch (lineError: any) {
          console.warn("⚠️ ROLLBACK: Error eliminando línea:", lineError.message);
        }
      }
      
      // Eliminar pedido si existe
      if (stepInput && stepInput.orderId) {
        try {
          await supplierService.deleteSupplierOrder(stepInput.orderId);
          console.log("🔄 ROLLBACK: Pedido transferencia eliminado");
        } catch (orderError: any) {
          console.warn("⚠️ ROLLBACK: Error eliminando pedido:", orderError.message);
        }
      }
    } catch (error: any) {
      console.error("❌ ROLLBACK ERROR:", error.message);
    }
  }
);

// Step para ejecutar la transferencia física de stock
const executeStockTransferStep = createStep(
  "execute-stock-transfer-step",
  async (input: TransferAsOrderInput, { container }) => {
    const {
      inventoryItemId,
      fromLocationId,
      toLocationId,
      quantity,
      productId,
      productTitle,
      performedBy = "system"
    } = input;

    console.log("🔄 TRANSFER: Ejecutando transferencia física de stock...");

    try {
      const inventoryService = container.resolve(Modules.INVENTORY);
      const supplierService = container.resolve(SUPPLIER_MODULE);

      // Validar stock disponible
      const originLevels = await inventoryService.listInventoryLevels({
        inventory_item_id: inventoryItemId,
        location_id: fromLocationId,
      });

      if (!originLevels || originLevels.length === 0) {
        throw new Error(`No hay stock del producto en la ubicación origen`);
      }

      const currentStock = originLevels[0].stocked_quantity || 0;
      if (currentStock < quantity) {
        throw new Error(
          `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${quantity}`
        );
      }

      // Obtener stock destino
      const destLevels = await inventoryService.listInventoryLevels({
        inventory_item_id: inventoryItemId,
        location_id: toLocationId,
      });

      const destCurrentStock = destLevels && destLevels.length > 0 
        ? destLevels[0].stocked_quantity || 0 
        : 0;

      // Calcular nuevas cantidades
      const newOriginStock = currentStock - quantity;
      const newDestStock = destCurrentStock + quantity;

      // Actualizar stock en origen
      await inventoryService.updateInventoryLevels([
        {
          inventory_item_id: inventoryItemId,
          location_id: fromLocationId,
          stocked_quantity: newOriginStock,
        },
      ]);

      // Actualizar/crear stock en destino
      if (destLevels && destLevels.length > 0) {
        await inventoryService.updateInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: toLocationId,
            stocked_quantity: newDestStock,
          },
        ]);
      } else {
        await inventoryService.createInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: toLocationId,
            stocked_quantity: quantity,
          },
        ]);
      }

      // Registrar movimientos de inventario
      const timestamp = new Date();
      const transferId = `transfer_${Date.now()}`;

      await Promise.all([
        // Movimiento de salida
        supplierService.recordInventoryMovement({
          movement_type: "transfer_out",
          reference_id: transferId,
          reference_type: "transfer_order",
          product_id: productId,
          product_title: productTitle,
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
          quantity: -quantity,
          reason: "Transfer order shipment",
          performed_by: performedBy,
          performed_at: timestamp,
          notes: `Stock enviado como pedido de transferencia`,
        }),

        // Movimiento de entrada pendiente
        supplierService.recordInventoryMovement({
          movement_type: "transfer_in",
          reference_id: transferId,
          reference_type: "transfer_order",
          product_id: productId,
          product_title: productTitle,
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
          quantity: quantity,
          reason: "Transfer order pending receipt",
          performed_by: performedBy,
          performed_at: timestamp,
          notes: `Stock enviado, pendiente de recepción manual`,
        }),
      ]);

      console.log("✅ TRANSFER: Transferencia física completada");

      return new StepResponse({
        transferId,
        originStockBefore: currentStock,
        originStockAfter: newOriginStock,
        destStockBefore: destCurrentStock,
        destStockAfter: newDestStock,
        quantityTransferred: quantity,
      }, {
        inventoryItemId,
        fromLocationId,
        toLocationId,
        originStockBefore: currentStock,
        destStockBefore: destCurrentStock,
        quantity,
        destLevelExisted: destLevels && destLevels.length > 0
      });
      
    } catch (error: any) {
      console.error("❌ TRANSFER ERROR:", error.message);
      throw error;
    }
  },
  async (stepInput, { container }) => {
    // Rollback de la transferencia física
    const {
      inventoryItemId,
      fromLocationId,
      toLocationId,
      originStockBefore,
      destStockBefore,
      destLevelExisted,
    } = stepInput;

    console.log("🔄 ROLLBACK: Revirtiendo transferencia física...");

    try {
      const inventoryService = container.resolve(Modules.INVENTORY);

      // Revertir stock en origen
      await inventoryService.updateInventoryLevels([
        {
          inventory_item_id: inventoryItemId,
          location_id: fromLocationId,
          stocked_quantity: originStockBefore,
        },
      ]);

      // Revertir stock en destino
      if (destLevelExisted) {
        await inventoryService.updateInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: toLocationId,
            stocked_quantity: destStockBefore,
          },
        ]);
      } else {
        await inventoryService.deleteInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: toLocationId,
          },
        ]);
      }

      console.log("✅ ROLLBACK: Transferencia física revertida");
    } catch (error: any) {
      console.error("❌ ROLLBACK ERROR:", error.message);
    }
  }
);

// Step para actualizar el estado del pedido a "shipped"
const updateOrderStatusStep = createStep(
  "update-order-status-step",
  async (input: { orderId: string }, { container }) => {
    console.log("📋 STATUS: Actualizando estado del pedido a 'shipped'...");
    
    try {
      const supplierService = container.resolve(SUPPLIER_MODULE);
      
      await supplierService.updateSupplierOrderStatus(input.orderId, "shipped", {
        shipped_at: new Date(),
        notes: "Transferencia física completada automáticamente"
      });
      
      console.log("✅ STATUS: Pedido marcado como 'shipped'");
      
      return new StepResponse({ updated: true });
    } catch (error: any) {
      console.error("❌ STATUS ERROR:", error.message);
      throw error;
    }
  }
);

// Step que combina crear proveedor y pedido para evitar problemas de paso de datos
const createTransferSupplierAndOrderStep = createStep(
  "create-transfer-supplier-and-order-step",
  async (input: TransferAsOrderInput, { container }) => {
    console.log("🏭 COMBINED: Creando proveedor (si no existe) y pedido...");
    
    try {
      const supplierService = container.resolve(SUPPLIER_MODULE);
      const stockLocationService = container.resolve(Modules.STOCK_LOCATION);
      
      // 1. Verificar/crear proveedor
      let supplierId: string;
      const existingSuppliers = await supplierService.listSuppliers({
        code: "TRANSFER"
      });
      
      if (existingSuppliers.length > 0) {
        supplierId = existingSuppliers[0].id;
        console.log("✅ COMBINED: Proveedor existe, ID:", supplierId);
      } else {
        const transferSupplier = await supplierService.createSupplier({
          name: "Transferencia Interna",
          legal_name: "Sistema de Transferencias Internas",
          code: "TRANSFER",
          tax_id: "TRANSFER-SYSTEM",
          email: "transfers@internal.system",
          phone: "000-000-000",
          is_active: true,
          supplier_type: "internal_transfer",
          notes: "Proveedor virtual para transferencias internas de stock",
          metadata: {
            virtual: true,
            system_created: true,
            created_at: new Date().toISOString()
          }
        });
        supplierId = transferSupplier.id;
        console.log("✅ COMBINED: Proveedor creado, ID:", supplierId);
      }

      // 2. Obtener nombres de ubicaciones
      const [sourceLocation, destLocation] = await Promise.all([
        stockLocationService.retrieveStockLocation(input.fromLocationId),
        stockLocationService.retrieveStockLocation(input.toLocationId)
      ]);

      // 3. Crear pedido
      const transferOrderData = {
        supplier_id: supplierId,
        order_type: "transfer",
        status: "confirmed",
        order_date: new Date(),
        expected_delivery_date: input.expected_delivery_date || new Date(Date.now() + 24 * 60 * 60 * 1000),
        source_location_id: input.fromLocationId,
        source_location_name: sourceLocation.name,
        destination_location_id: input.toLocationId,
        destination_location_name: destLocation.name,
        reference: `TRANSFER_${Date.now()}`,
        notes: input.notes || `Transferencia de ${input.quantity} unidades de ${input.productTitle}`,
        internal_notes: input.reason || "Transferencia interna de stock",
        created_by: input.performedBy || "system",
        currency_code: "EUR",
        subtotal: 0,
        tax_total: 0,
        discount_total: 0,
        total: 0,
        metadata: {
          transfer_type: "internal",
          original_workflow: "transfer-as-order",
          created_at: new Date().toISOString()
        }
      };

      console.log("🔍 COMBINED: Creando pedido con supplier_id:", supplierId);
      
      const transferOrder = await supplierService.createSupplierOrder(transferOrderData);
      console.log("✅ COMBINED: Pedido creado:", transferOrder.display_id);

      // 4. Crear línea de pedido
      const orderLineData = {
        supplier_order_id: transferOrder.id,
        product_id: input.productId,
        product_title: input.productTitle,
        product_sku: input.productId,
        quantity_ordered: input.quantity,
        quantity_received: 0,
        unit_price: 0,
        total_price: 0,
        status: "pending_receipt",
        notes: `Transferencia desde ${sourceLocation.name} hacia ${destLocation.name}`,
        metadata: {
          transfer_line: true,
          inventory_item_id: input.inventoryItemId
        }
      };
      
      const orderLine = await supplierService.createSupplierOrderLines(orderLineData);
      console.log("✅ COMBINED: Línea de pedido creada");

      return new StepResponse({
        supplierId,
        orderId: transferOrder.id,
        orderDisplayId: transferOrder.display_id,
        orderLineId: orderLine.id,
        sourceLocationName: sourceLocation.name,
        destLocationName: destLocation.name
      });
      
    } catch (error: any) {
      console.error("❌ COMBINED ERROR:", error.message);
      throw error;
    }
  }
);

// WORKFLOW PRINCIPAL HÍBRIDO SIMPLIFICADO
export const transferAsOrderWorkflow = createWorkflow(
  "transfer-as-order",
  function (input: TransferAsOrderInput) {
    // 1. Crear proveedor y pedido en un solo step
    const orderResult = createTransferSupplierAndOrderStep(input);
    
    // 2. Ejecutar transferencia física
    const transferResult = executeStockTransferStep(input);
    
    // 3. Actualizar estado a "shipped"
    const statusResult = updateOrderStatusStep({
      orderId: orderResult.orderId,
    });

    return new WorkflowResponse({
      order: orderResult,
      transfer: transferResult,
      status: statusResult,
      success: true,
      message: "Transferencia creada como pedido y ejecutada correctamente"
    });
  }
);
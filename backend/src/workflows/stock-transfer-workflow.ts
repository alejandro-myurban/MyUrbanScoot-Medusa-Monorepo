import { createWorkflow, createStep, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { SUPPLIER_MODULE } from "../modules/supplier-management";

// Tipo para el input del workflow
type StockTransferInput = {
  inventoryItemId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  productId: string;
  productTitle: string;
  performedBy?: string;
  reason?: string;
};

// Step para validar stock disponible en origen
const validateStockStep = createStep(
  "validate-stock-step",
  async (input: StockTransferInput, { container }) => {
    const { inventoryItemId, fromLocationId, quantity, productId } = input;
    
    console.log(`🔍 VALIDACIÓN: Verificando stock disponible...`);
    console.log(`   - Producto: ${productId}`);
    console.log(`   - Inventory Item: ${inventoryItemId}`);
    console.log(`   - Ubicación origen: ${fromLocationId}`);
    console.log(`   - Cantidad a transferir: ${quantity}`);

    try {
      // Resolver servicio de inventario
      const inventoryService = container.resolve(Modules.INVENTORY);
      
      // Obtener nivel actual en ubicación origen
      const existingLevels = await inventoryService.listInventoryLevels({
        inventory_item_id: inventoryItemId,
        location_id: fromLocationId,
      });

      if (!existingLevels || existingLevels.length === 0) {
        throw new Error(`No hay stock del producto en la ubicación origen ${fromLocationId}`);
      }

      const currentStock = existingLevels[0].stocked_quantity || 0;
      console.log(`📊 VALIDACIÓN: Stock actual en origen: ${currentStock}`);

      if (currentStock < quantity) {
        throw new Error(
          `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${quantity}`
        );
      }

      console.log(`✅ VALIDACIÓN: Stock suficiente para transferencia`);
      
      return new StepResponse({
        validated: true,
        currentStock,
        newOriginStock: currentStock - quantity,
      });
    } catch (error: any) {
      console.error(`❌ VALIDACIÓN ERROR: ${error.message}`);
      throw error;
    }
  }
);

// Step para transferir stock (operación atómica)
const transferStockStep = createStep(
  "transfer-stock-step",
  async (input: StockTransferInput, { container }) => {
    const { 
      inventoryItemId, 
      fromLocationId, 
      toLocationId, 
      quantity, 
      productId,
      productTitle,
      performedBy = "system",
      reason = "Stock transfer between locations"
    } = input;
    
    console.log(`🔄 TRANSFERENCIA: Ejecutando transferencia atómica...`);

    try {
      // Resolver servicios
      const inventoryService = container.resolve(Modules.INVENTORY);
      const supplierService = container.resolve(SUPPLIER_MODULE);

      // PASO 1: Obtener stocks actuales
      console.log(`📊 TRANSFERENCIA: Obteniendo stocks actuales...`);
      
      const [originLevels, destLevels] = await Promise.all([
        inventoryService.listInventoryLevels({
          inventory_item_id: inventoryItemId,
          location_id: fromLocationId,
        }),
        inventoryService.listInventoryLevels({
          inventory_item_id: inventoryItemId,
          location_id: toLocationId,
        }),
      ]);

      if (!originLevels || originLevels.length === 0) {
        throw new Error(`Stock origen no encontrado para transferencia`);
      }

      const originCurrentStock = originLevels[0].stocked_quantity || 0;
      const destCurrentStock = destLevels && destLevels.length > 0 
        ? destLevels[0].stocked_quantity || 0 
        : 0;

      console.log(`📊 TRANSFERENCIA: Origen actual: ${originCurrentStock}, Destino actual: ${destCurrentStock}`);

      // PASO 2: Calcular nuevas cantidades
      const newOriginStock = originCurrentStock - quantity;
      const newDestStock = destCurrentStock + quantity;

      console.log(`🔢 TRANSFERENCIA: Nuevas cantidades - Origen: ${newOriginStock}, Destino: ${newDestStock}`);

      // PASO 3: Actualizar stock en origen (restar)
      await inventoryService.updateInventoryLevels([
        {
          inventory_item_id: inventoryItemId,
          location_id: fromLocationId,
          stocked_quantity: newOriginStock,
        },
      ]);
      console.log(`✅ TRANSFERENCIA: Stock reducido en origen`);

      // PASO 4: Actualizar/crear stock en destino (sumar)
      if (destLevels && destLevels.length > 0) {
        // Actualizar existente
        await inventoryService.updateInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: toLocationId,
            stocked_quantity: newDestStock,
          },
        ]);
        console.log(`✅ TRANSFERENCIA: Stock actualizado en destino`);
      } else {
        // Crear nuevo nivel
        await inventoryService.createInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: toLocationId,
            stocked_quantity: quantity, // Solo la cantidad transferida
          },
        ]);
        console.log(`✅ TRANSFERENCIA: Nuevo nivel creado en destino`);
      }

      // PASO 5: Registrar movimientos de inventario
      const timestamp = new Date();
      
      await Promise.all([
        // Movimiento de salida (origen)
        supplierService.recordInventoryMovement({
          movement_type: "transfer_out",
          reference_id: `transfer_${Date.now()}`,
          reference_type: "stock_transfer",
          product_id: productId,
          product_title: productTitle,
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
          quantity: -quantity, // Negativo para salida
          reason: reason,
          performed_by: performedBy,
          performed_at: timestamp,
          notes: `Transferencia de stock hacia ubicación ${toLocationId}`,
        }),
        
        // Movimiento de entrada (destino)  
        supplierService.recordInventoryMovement({
          movement_type: "transfer_in",
          reference_id: `transfer_${Date.now()}`,
          reference_type: "stock_transfer",
          product_id: productId,
          product_title: productTitle,
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
          quantity: quantity, // Positivo para entrada
          reason: reason,
          performed_by: performedBy,
          performed_at: timestamp,
          notes: `Transferencia de stock desde ubicación ${fromLocationId}`,
        }),
      ]);
      
      console.log(`✅ TRANSFERENCIA: Movimientos de inventario registrados`);

      return new StepResponse(
        {
          success: true,
          transferId: `transfer_${Date.now()}`,
          originStockBefore: originCurrentStock,
          originStockAfter: newOriginStock,
          destStockBefore: destCurrentStock,
          destStockAfter: newDestStock,
          quantityTransferred: quantity,
        },
        {
          // Datos para rollback
          inventoryItemId,
          fromLocationId,
          toLocationId,
          originStockBefore: originCurrentStock,
          destStockBefore: destCurrentStock,
          quantity,
          destLevelExisted: destLevels && destLevels.length > 0,
        }
      );
    } catch (error: any) {
      console.error(`❌ TRANSFERENCIA ERROR: ${error.message}`);
      throw error;
    }
  },
  async (stepInput, { container }) => {
    // ✅ FUNCIÓN DE ROLLBACK
    const { 
      inventoryItemId, 
      fromLocationId, 
      toLocationId, 
      originStockBefore,
      destStockBefore,
      quantity,
      destLevelExisted
    } = stepInput;
    
    console.log(`🔄 ROLLBACK: Revirtiendo transferencia de stock...`);
    console.log(`   - Inventory Item: ${inventoryItemId}`);
    console.log(`   - Restaurando origen a: ${originStockBefore}`);
    console.log(`   - Restaurando destino a: ${destStockBefore}`);

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
        // Restaurar cantidad original
        await inventoryService.updateInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: toLocationId,
            stocked_quantity: destStockBefore,
          },
        ]);
      } else {
        // Eliminar el nivel que se creó
        await inventoryService.deleteInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: toLocationId,
          },
        ]);
      }

      console.log(`✅ ROLLBACK: Transferencia revertida exitosamente`);
    } catch (rollbackError: any) {
      console.error(`❌ ROLLBACK ERROR: ${rollbackError.message}`);
    }
  }
);

// ✅ WORKFLOW PRINCIPAL DE TRANSFERENCIA
export const stockTransferWorkflow = createWorkflow(
  "stock-transfer",
  function (input: StockTransferInput) {
    // Validar stock disponible
    const validation = validateStockStep(input);
    
    // Ejecutar transferencia
    const transferResult = transferStockStep(input);
    
    return new WorkflowResponse({
      validation: validation,
      transfer: transferResult,
    });
  }
);
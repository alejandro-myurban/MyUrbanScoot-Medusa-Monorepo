import { createWorkflow, createStep, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

// Tipo para el input del workflow
type UpdateSupplierStockInput = {
  inventoryItemId: string;
  locationId: string;
  quantity: number;
  productId: string;
};

// Step para actualizar el stock del supplier
const updateSupplierStockStep = createStep(
  "update-supplier-stock-step",
  async (input: UpdateSupplierStockInput, { container }) => {
    const { inventoryItemId, locationId, quantity, productId } = input;
    
    console.log(`🔄 STEP: Actualizando stock via workflow step:`);
    console.log(`   - Product ID: ${productId}`);
    console.log(`   - Inventory Item ID: ${inventoryItemId}`);
    console.log(`   - Location ID: ${locationId}`);
    console.log(`   - Cantidad a añadir: +${quantity}`);

    try {
      // ✅ RESOLVER SERVICIO DE INVENTARIO USANDO CONTAINER
      console.log(`🔍 STEP: Resolviendo servicio de inventario...`);
      const inventoryService = container.resolve(Modules.INVENTORY);
      console.log(`✅ STEP: Servicio de inventario resuelto correctamente`);

      // PASO 1: Obtener nivel de inventario actual
      console.log(`📊 STEP: Obteniendo nivel actual de inventario...`);
      const existingLevels = await inventoryService.listInventoryLevels({
        inventory_item_id: inventoryItemId,
        location_id: locationId,
      });

      let currentQuantity = 0;
      let levelExists = false;

      if (existingLevels && existingLevels.length > 0) {
        currentQuantity = existingLevels[0].stocked_quantity || 0;
        levelExists = true;
        console.log(`📊 STEP: Cantidad actual encontrada: ${currentQuantity}`);
      } else {
        console.log(`📊 STEP: No existe nivel de inventario, se creará nuevo`);
      }

      if (levelExists) {
        // ACTUALIZAR nivel existente
        const newTotalQuantity = currentQuantity + quantity;
        console.log(`🔢 STEP: Calculando nueva cantidad: ${currentQuantity} + ${quantity} = ${newTotalQuantity}`);

        await inventoryService.updateInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: newTotalQuantity,
          },
        ]);

        console.log(`✅ STEP: Nivel actualizado de ${currentQuantity} a ${newTotalQuantity}`);
        
        return new StepResponse(
          {
            success: true,
            action: "updated",
            previousQuantity: currentQuantity,
            newQuantity: newTotalQuantity,
            addedQuantity: quantity,
          },
          {
            // Datos para rollback si es necesario
            inventoryItemId,
            locationId,
            originalQuantity: currentQuantity,
            action: "updated",
          }
        );
      } else {
        // CREAR nivel nuevo
        console.log(`➕ STEP: Creando nivel inicial con cantidad ${quantity}`);

        await inventoryService.createInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: quantity,
          },
        ]);

        console.log(`✅ STEP: Nivel creado con ${quantity} unidades`);

        return new StepResponse(
          {
            success: true,
            action: "created",
            previousQuantity: 0,
            newQuantity: quantity,
            addedQuantity: quantity,
          },
          {
            // Datos para rollback si es necesario
            inventoryItemId,
            locationId,
            originalQuantity: 0,
            action: "created",
          }
        );
      }
    } catch (error: any) {
      console.error(`❌ STEP ERROR: ${error.message}`);
      console.error(`📊 STEP ERROR Stack:`, error.stack);
      throw new Error(`Error en step de actualización de stock: ${error.message}`);
    }
  },
  async (stepInput, { container }) => {
    // ✅ FUNCIÓN DE ROLLBACK/COMPENSACIÓN
    const { inventoryItemId, locationId, originalQuantity, action } = stepInput;
    
    console.log(`🔄 ROLLBACK: Revirtiendo cambios de stock...`);
    console.log(`   - Inventory Item ID: ${inventoryItemId}`);
    console.log(`   - Location ID: ${locationId}`);
    console.log(`   - Cantidad original: ${originalQuantity}`);
    console.log(`   - Acción a revertir: ${action}`);

    try {
      const inventoryService = container.resolve(Modules.INVENTORY);

      if (action === "updated") {
        // Revertir a la cantidad original
        await inventoryService.updateInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: originalQuantity,
          },
        ]);
        console.log(`✅ ROLLBACK: Cantidad revertida a ${originalQuantity}`);
      } else if (action === "created") {
        // Eliminar el nivel creado
        await inventoryService.deleteInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: locationId,
          },
        ]);
        console.log(`✅ ROLLBACK: Nivel de inventario eliminado`);
      }
    } catch (rollbackError: any) {
      console.error(`❌ ROLLBACK ERROR: ${rollbackError.message}`);
      // En caso de error en rollback, no fallar todo el proceso
    }
  }
);

// ✅ WORKFLOW PRINCIPAL
export const updateSupplierStockWorkflow = createWorkflow(
  "update-supplier-stock",
  function (input: UpdateSupplierStockInput) {
    console.log(`🚀 WORKFLOW: Iniciando actualización de stock de supplier`);
    
    const result = updateSupplierStockStep(input);
    
    console.log(`🏁 WORKFLOW: Finalizando actualización de stock de supplier`);
    
    return new WorkflowResponse(result);
  }
);
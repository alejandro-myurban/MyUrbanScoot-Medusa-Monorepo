import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import { ModuleRegistrationName } from "@medusajs/framework/utils";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  try {
    const orderModuleService = req.scope.resolve(ModuleRegistrationName.ORDER);

    // Verificar si el servicio se resolvió correctamente
    if (!orderModuleService) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Servicio de orden no encontrado"
      );
    }

    // Obtener la orden
    const order = await orderModuleService.retrieveOrder(id);

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Orden con ID ${id} no encontrada`
      );
    }

    // Actualizar los metadatos de la orden
    await orderModuleService.updateOrders([
      {
        id: id,
        metadata: {
          ...order.metadata,
          workshop_status: "en_taller",
          workshop_status_display: "En Taller",
          workshop_status_updated_at: new Date().toISOString(),
        },
      },
    ]);

    const eventModuleService = req.scope.resolve(Modules.EVENT_BUS);

    await eventModuleService.emit({
      name: "order.status_workshop",
      data: {
        id: order.id,
        status: "en_taller",
      },
    });

    res.status(200).json({
      success: true,
      message: "Estado de taller actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar el estado:", error);

    // Determinar el tipo de error para devolver el código de estado apropiado
    if (error instanceof MedusaError) {
      const statusCode = error.type === MedusaError.Types.NOT_FOUND ? 404 : 400;

      res.status(statusCode).json({
        type: error.type,
        message: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        type: "unknown_error",
        message: `Error inesperado: ${(error as Error).message}`,
        code: "api_error",
      });
    }
  }
};

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  console.log("ID de la orden:", id);

  try {
    // Resolver el servicio de órdenes
    const orderModuleService = req.scope.resolve(ModuleRegistrationName.ORDER);

    if (!orderModuleService) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Servicio de orden no encontrado"
      );
    }

    // Obtener la orden en función del ID
    const order = await orderModuleService.retrieveOrder(id);
    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Orden con ID ${id} no encontrada`
      );
    }
    console.log("Orden encontrada:", order);
    // Preparar la nueva metadata eliminando las claves de "workshop"
    // Preparar la nueva metadata dejando las claves "workshop" vacías
    const updatedMetadata = { ...(order.metadata || {}) };
    updatedMetadata.workshop_status = "";
    updatedMetadata.workshop_status_display = "";
    updatedMetadata.workshop_status_updated_at = "";
    console.log("Metadata actualizada:", updatedMetadata);

    // Actualizar la orden con la metadata actualizada
    console.log("Metadata actualizada:", updatedMetadata);
    await orderModuleService.updateOrders([
      {
        id,
        metadata: updatedMetadata,
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Estado de taller eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar el estado:", error);
    if (error instanceof MedusaError) {
      const statusCode = error.type === MedusaError.Types.NOT_FOUND ? 404 : 400;
      return res.status(statusCode).json({
        type: error.type,
        message: error.message,
        code: error.code,
      });
    }
    return res.status(500).json({
      type: "unknown_error",
      message: `Error inesperado: ${(error as Error).message}`,
      code: "api_error",
    });
  }
};

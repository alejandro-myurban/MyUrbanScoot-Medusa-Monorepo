import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import { stat } from "fs";

type ProductionStatusEvent = {
  id: string; // ID de la orden
  status: string; // El nuevo estado a establecer
  type?: string; // Tipo opcional para diferentes flujos (vinyl, battery, etc.)
};

/**
 * Subscriber para actualizar el estado de producción de una orden
 */
export default async function handleProductionStatusChange({
  event: { data },
  container,
}: SubscriberArgs<ProductionStatusEvent>) {
  const { id, status, type = "generic" } = data;

  try {
    console.log(
      `Actualizando estado de producción para orden ${id}: ${status} (tipo: ${type})`
    );

    // Obtener el servicio de órdenes
    const orderModuleService = container.resolve(Modules.ORDER);

    // Verificar si existe la orden
    const order = await orderModuleService.retrieveOrder(id);
    if (!order) {
      console.error(`Orden con ID ${id} no encontrada`);
      return;
    }

    // Lista de estados válidos
    const validStatuses = [
      "produccion_vinilos",
      "produccion_baterias",
      "en_taller",
      "espera_stock",
      "producto_reservado",
    ];

    // Validar el estado
    if (!validStatuses.includes(status)) {
      console.error(`Estado inválido: ${status}`);
      return;
    }

    // Mapeo de estados a nombres para mostrar
    const statusDisplayMap = {
      produccion_vinilos: "Producción de Vinilos",
      produccion_baterias: "Producción de Baterías",
      en_taller: "En Taller",
      espera_stock: "En Espera de Stock",
      producto_reservado: "Producto Reservado",
    };

    // Actualizar los metadatos de la orden
    await orderModuleService.updateOrders([
      {
        id,
        metadata: {
          ...order.metadata,
          production_status: status,
          production_status_display: statusDisplayMap[status],
          production_status_updated_at: new Date().toISOString(),
        },
      },
    ]);

    // Emitir evento de cambio de estado (para posibles hooks/notificaciones)
    if (status !== "espera_stock") {
      const eventModuleService = container.resolve(Modules.EVENT_BUS);
      await eventModuleService.emit({
        name: "order.production_status_updated",
        data: {
          id: order.id,
          status,
          previous_status: order.metadata?.production_status || null,
          type,
        },
      });
    }

    console.log(`Estado de producción actualizado para orden ${id}: ${status}`);
  } catch (error) {
    console.error(
      `Error al actualizar estado de producción para orden ${id}:`,
      error
    );
  }
}

// Configuramos los eventos a los que responde este subscriber
export const config: SubscriberConfig = {
  event: [
    "order.vinyl_production_requested",
    "order.battery_production_requested",
    "order.production_status_change",
    "order.status_stock_await",
  ],
};

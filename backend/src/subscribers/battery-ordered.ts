import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";

export default async function handleVinylOrdered({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string }>) {
  try {
    const eventModuleService = container.resolve(Modules.EVENT_BUS);
    
    // Emitir evento para actualizar el estado de producción
    await eventModuleService.emit({
      name: "order.battery_production_requested",
      data: {
        id: data.order_id,
        status: "produccion_baterias",
        type: "battery"
      },
    });
    
    console.log(`Evento de producción de vinilos emitido para orden ${data.order_id}`);
  } catch (error) {
    console.error("Error al manejar evento de vinilo ordenado:", error);
  }
}

export const config: SubscriberConfig = {
  event: ["battery_ordered"],
};
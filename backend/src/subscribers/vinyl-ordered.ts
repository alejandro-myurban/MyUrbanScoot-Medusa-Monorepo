// src/subscribers/vinyl-ordered.ts
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";

export default async function handleVinylOrdered({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string }>) {
  try {
    const eventModuleService = container.resolve(Modules.EVENT_BUS);

    await eventModuleService.emit({
      name: "order.vinyl_production_requested",
      data: {
        id: data.order_id,
        status: "produccion_vinilos",
        type: "vinyl",
      },
    });
  } catch (error) {
    console.error("Error handling vinyl ordered event:", error);
  }
}

export const config: SubscriberConfig = {
  event: ["vinyl_ordered"],
};

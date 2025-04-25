import { Modules } from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { EmailTemplates } from "../modules/email-notifications/templates";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items", "summary", "shipping_address"],
  });

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      template: EmailTemplates.WORKSHOP_STATUS,
      data: {
        emailOptions: {
          replyTo: "info@myurbanscoot.com",
          subject: "You've been invited to Medusa!",
        },
        greeting: "Hola, su orden ha sido actualizada.",
        actionUrl: "https://misitio.com/orden/detalle",
        preview: "Tu pedido ha sido actualizado preview",
      },
    });
  } catch (error) {
    console.error("Error sending order confirmation notification:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.status_workshop",
};

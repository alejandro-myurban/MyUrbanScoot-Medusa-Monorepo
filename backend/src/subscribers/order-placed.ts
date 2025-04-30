import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
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

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items", "summary", "shipping_address"],
  });
  const shippingAddress = await (
    orderModuleService as any
  ).orderAddressService_.retrieve(order.shipping_address.id);

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "payment_collections.*", "payment_collections.payments.*"],
      filters: {
        id: data.id,
      },
    });

    const payment = orders[0];
    const isCashOnDelivery = payment.payment_collections.some((collection) =>
      collection.payments?.some(
        (payment) => payment.provider_id === "pp_system_default"
      )
    );

    if (!isCashOnDelivery) {
      await notificationModuleService.createNotifications({
        to: order.email,
        channel: "email",
        template: EmailTemplates.ORDER_PLACED,
        data: {
          emailOptions: {
            replyTo: "info@myurbanscoot.com",
            subject: "Your order has been placed",
          },
          order,
          shippingAddress,
          preview: "Thank you for your order!",
        },
      });

      await notificationModuleService.createNotifications({
        to: "alejandro@myurbanscoot.com",
        channel: "email",
        template: EmailTemplates.ORDER_PLACED_ADMIN,
        data: {
          emailOptions: {
            replyTo: "info@myurbanscoot.com",
            subject: "Se ha realizado un pedido",
          },
          order,
          shippingAddress,
          preview: "Se ha realizado un pedido",
        },
      });
    }
  } catch (error) {
    console.error("Error sending order confirmation notification:", error);
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
};

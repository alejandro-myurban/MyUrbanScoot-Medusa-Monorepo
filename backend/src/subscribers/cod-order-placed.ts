import { Modules } from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

export default async function CodOrderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve<IOrderModuleService>(Modules.ORDER);
  const notificationService = container.resolve<INotificationModuleService>(
    Modules.NOTIFICATION
  );
  // 1) Trae la orden con relaciones
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items", "shipping_address", "summary"],
  });
  if (!order) {
    console.error(`Orden ${data.id} no encontrada`);
    return;
  }

  // 2) Envía el correo de "Order Placed"
  const shippingAddress = await (
    orderService as any
  ).orderAddressService_.retrieve(order.shipping_address.id);

  console.log("O R D E R E M A I L", order);
  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-placed",
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
}

export const config: SubscriberConfig = {
  event: ["order.cod_order_placed"],
};

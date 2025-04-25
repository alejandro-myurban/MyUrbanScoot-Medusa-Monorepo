import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { EmailTemplates } from "../modules/email-notifications/templates";
import { STORE_CORS } from "lib/constants";

export default async function confirmCodPaymentHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log("HOLA MUNDO COD", data.id);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

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

  if (!isCashOnDelivery) return;

  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items", "summary", "shipping_address"],
  });
  const shippingAddress = await (
    orderModuleService as any
  ).orderAddressService_.retrieve(order.shipping_address.id);

  // Obtener la configuración JWT del contenedor
  const configModule = container.resolve("configModule");
  const jwtSecret = configModule.projectConfig.http.jwtSecret;

  // Generar un token JWT usando la utilidad de Medusa
  const token = generateJwtToken(
    {
      payment_id: data.id,
      order_id: order.id,
    },
    {
      secret: jwtSecret,
      expiresIn: "24h",
    }
  );
  console.log("storecors", STORE_CORS);

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      template: EmailTemplates.INVITE_USER,
      data: {
        emailOptions: {
          replyTo: "info@myurbanscoot.com",
          subject: "Necesitamos tu confirmación",
        },
        inviteLink: `${STORE_CORS}/es/confirm-cod-payment?token=${token}`,
        preview: "Tu pedido ya casi está listo...",
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};

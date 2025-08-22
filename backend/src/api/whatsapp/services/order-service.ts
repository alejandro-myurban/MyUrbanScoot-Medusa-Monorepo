import { orderStatusMessages } from "../utils/messages";
import { sendWhatsApp } from "./twilio-service";

export const checkOrderStatus = async (orderId: string, userId: string): Promise<string> => {
  try {
    const wooRes = await fetch(`${process.env.WC_URL}/orders/${orderId}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_KEY_S}`).toString("base64"),
        "Content-Type": "application/json",
      },
    });

    if (!wooRes.ok) {
      await sendWhatsApp(userId, "No pude encontrar tu pedido. Por favor revisa el número de orden.");
      return `Error consultando orden: ${wooRes.status}`;
    }

    const orderData = await wooRes.json();
    const status = orderData.status;
    return orderStatusMessages[status] || `Estado actual del pedido: ${status}`;
  } catch {
    return "Ocurrió un error al consultar tu pedido.";
  }
};

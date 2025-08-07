// src/whatsapp-templates/index.ts

import { ProductStatusWhatsApp, generateProductStatusWhatsAppMessage, WHATSAPP_PRODUCT_STATUS } from "./product-status";

export type WhatsAppTemplateData =
  | { type: typeof WHATSAPP_PRODUCT_STATUS; data: ProductStatusWhatsApp };

/**
 * Genera el mensaje de WhatsApp basado en el tipo de template y los datos proporcionados.
 * @param template El tipo de template de WhatsApp a generar.
 * @param data Los datos específicos para el template.
 * @returns El mensaje de WhatsApp formateado como una cadena de texto.
 * @throws Error si el template no es reconocido o los datos son inválidos.
 */
export const generateWhatsAppTemplate = (
  template: WhatsAppTemplateData["type"],
  data: WhatsAppTemplateData["data"]
): string => {
  switch (template) {
    case WHATSAPP_PRODUCT_STATUS:
      // Asegúrate de que los datos coincidan con la interfaz esperada para este template
      if (!isProductStatusWhatsAppData(data)) {
        throw new Error(`Datos inválidos para el template de WhatsApp '${template}'.`);
      }
      return generateProductStatusWhatsAppMessage(data);
    // Añade más casos aquí para otros templates de WhatsApp
    default:
      throw new Error(`Template de WhatsApp no reconocido: ${template}`);
  }
};

/**
 * Función de guardia de tipo para ProductStatusWhatsApp.
 * @param data Los datos a verificar.
 * @returns true si los datos son de tipo ProductStatusWhatsApp, false en caso contrario.
 */
const isProductStatusWhatsAppData = (data: any): data is ProductStatusWhatsApp => {
  return (
    typeof data.customer_name === "string" &&
    typeof data.order_id === "string" &&
    typeof data.status_display === "string"
  );
};

// src/api/admin/orders/export-invoices/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import { loadImage } from "../services/load-image";
import { generateInvoicePDF } from "../services/generate-invoices-pdf";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const ids: string[] = Array.isArray(req.query.ids)
    ? (req.query.ids as string[])
    : req.query.ids
    ? [req.query.ids as string]
    : [];

  if (!ids.length) {
    return res
      .status(400)
      .json({ success: false, message: "Se requieren IDs de órdenes." });
  }

  try {
    const { result } = await getOrdersListWorkflow(req.scope).run({
      input: {
        fields: [
          "display_id", "created_at", "email", "total", "currency_code",
          "tax_total", "shipping_total", "discount_total", "subtotal", "item_total",
          "billing_address.first_name", "billing_address.last_name", "billing_address.address_1",
          "billing_address.address_2", "original_total",
          "billing_address.city", "billing_address.postal_code", "billing_address.province",
          "billing_address.phone", "billing_address.email", "billing_address.country_code",
          "shipping_address.first_name", "shipping_address.last_name", "shipping_address.address_1",
          "shipping_address.address_2", "shipping_methods.total",
          "shipping_address.city", "shipping_address.postal_code", "shipping_address.province",
          "shipping_address.phone", "shipping_address.email", "shipping_address.country_code",
          "items.id", "items.title", "items.quantity", "items.unit_price",
          "items.weight", "items.metadata",
          "metadata", "customer.first_name", "customer.last_name", "customer.phone", "customer.metadata",
          "shipping_methods.name","shipping_methods.amount",
          "payment_collections.payments.provider_id","payment_collections.amount"
        ],
        variables: { filters: { id: ids } },
      },
    });
    const orders: any[] = Array.isArray(result) ? result : result.rows;
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "No se encontraron órdenes." });
    }

    const [logoImage, fondo, invoiceHeaderImage] = await Promise.all([
      loadImage("https://dev.myurbanscoot.com/webhook/images/LOGO-MYURBAN-08.png"),
      loadImage("https://dev.myurbanscoot.com/webhook/images/fondo-myurbanscoot.jpg", true),
      loadImage("https://dev.myurbanscoot.com/webhook/images/factura.png", true),
    ]);

    const pdfBuffer = await generateInvoicePDF(orders, logoImage, fondo, invoiceHeaderImage);

    let filename: string;
    if (orders.length === 1) {
      const invoiceNum = String(orders[0].display_id).padStart(4, '0');
      filename = `FACT-${invoiceNum}.pdf`;
    } else {
      filename = `facturas_multiples.pdf`;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    return res.status(200).end(pdfBuffer);
  } catch (error: any) {
    console.error("Error al exportar PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar el PDF",
      error: error.message,
    });
  }
};

export const AUTHENTICATE = true;
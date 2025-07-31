// src/api/admin/orders/export-pdf-slips/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import { randomBytes } from "crypto";
import { loadImage, ImageWithMime } from "../services/load-image"; 
import { generatePackingSlipsPDF } from "../services/generate-pdfslips"; 

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const ids: string[] = Array.isArray(req.query.ids)
    ? (req.query.ids as string[])
    : req.query.ids
    ? [req.query.ids as string]
    : [];

  if (!ids.length) {
    return res
      .status(400)
      .json({ success: false, message: "Se requieren ids de órdenes" });
  }

  try {
    const { result } = await getOrdersListWorkflow(req.scope).run({
      input: {
        fields: [
          "display_id",
          "created_at",
          "email",
          "total",
          "currency_code",
          "tax_total",
          "billing_address.first_name",
          "billing_address.last_name",
          "billing_address.address_1",
          "billing_address.city",
          "billing_address.postal_code",
          "billing_address.province",
          "billing_address.phone",
          "billing_address.email",
          "shipping_address.first_name",
          "shipping_address.last_name",
          "shipping_address.address_1",
          "shipping_address.city",
          "shipping_address.postal_code",
          "shipping_address.province",
          "shipping_address.phone",
          "items.id",
          "items.title",
          "items.quantity",
          "items.unit_price",
          "items.variant.sku",
          "items.variant.product.thumbnail",
          "items.weight",
          "items.metadata",
          "metadata",
          "customer.first_name",
          "customer.last_name",
          "customer.phone",
          "customer.metadata",
        ],
        variables: { filters: { id: ids } },
      },
    });
    const orders: any[] = Array.isArray(result) ? result : result.rows;
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "No se encontraron órdenes" });
    }

    const logoUrl = "https://dev.myurbanscoot.com/webhook/images/LOGO-MYURBAN-08.png";
    const fondoUrl ="https://dev.myurbanscoot.com/webhook/images/fondo-myurbanscoot.jpg";
    const packingSlipImageUrl ="https://dev.myurbanscoot.com/webhook/images/packing-slip.png"

    const [logoImage, fondo, packingSlipImage] = await Promise.all([
      loadImage(logoUrl),
      loadImage(fondoUrl, true), // Se convierte a PNG si no es soportado
      loadImage(packingSlipImageUrl, true), // Se convierte a PNG si no es soportado
    ]);

    await Promise.all(
      orders.flatMap((order) =>
        order.items.map(async (item: any) => {
          const thumbUrl = item.variant?.product?.thumbnail;
          item._thumbImage = await loadImage(thumbUrl, true); // Reutiliza loadImage
        })
      )
    );
    const pdfBuffer = await generatePackingSlipsPDF(orders, logoImage, fondo, packingSlipImage);

    const shortId = randomBytes(4).toString("hex");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="packingSlips-${shortId}.pdf"`
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
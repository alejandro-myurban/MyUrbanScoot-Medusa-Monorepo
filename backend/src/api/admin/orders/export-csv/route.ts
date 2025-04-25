// src/api/routes/admin/orders/export-csv/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import { OrderAddressDTO } from "@medusajs/framework/types";
import { randomBytes } from "crypto";

type ShippingAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
} & Partial<OrderAddressDTO>;

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const ids = Array.isArray(req.query.ids)
    ? (req.query.ids as string[])
    : req.query.ids
    ? [req.query.ids as string]
    : [];

  if (!ids || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Se requieren ids de órdenes" });
  }

  try {
    // 1) Traer las órdenes
    const { result } = await getOrdersListWorkflow(req.scope).run({
      input: {
        fields: [
          "id",
          "display_id",
          "shipping_address.first_name",
          "shipping_address.last_name",
          "shipping_address.address_1",
          "shipping_address.city",
          "shipping_address.postal_code",
          "shipping_address.phone",
          "email",
          "total",
          "payment_collections.payment_sessions.provider_id",
        ],
        variables: {
          filters: { id: ids },
        },
      },
    });

    // 2) Extraer las órdenes del resultado
    const orders = Array.isArray(result) ? result : result.rows;

    // 3) Verificar que tenemos órdenes
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron órdenes con los IDs proporcionados",
      });
    }


    // 5) Montar el CSV en memoria
    const header = [
      "Nombre destinatario",
      "Dirección destinatario",
      "CP destinatario",
      "Población",
      "Email",
      "Teléfono",
      "Reembolso",
      "Observaciones",
    ];

    const rows = orders.map((o) => {
      const addr = o.shipping_address || ({} as ShippingAddress);
      const paymentProvider =
        // @ts-ignore - Ignoring payment provider type check
        o.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id || "";
      const isCodPayment = paymentProvider.startsWith("pp_system");

      return [
        `${addr.first_name || ""} ${addr.last_name || ""}`.trim(),
        addr.address_1 || "",
        addr.postal_code || "",
        addr.city || "",
        o.email || "",
        addr.phone || "",
        isCodPayment ? o.total?.toString() : "0",
        "", // Observaciones (vacío)
      ];
    });

    const csvLines = [
      header.join(","),
      ...rows.map((r) =>
        r.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const csvBuffer = Buffer.from(csvLines.join("\r\n"), "utf-8");

    // 6) Devolverlo como descarga
    const shortId = randomBytes(4).toString("hex");
    const filename = `orders-${shortId}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvBuffer);
  } catch (error) {
    console.error("Error al exportar órdenes:", error);
    res.status(500).json({
      success: false,
      message: "Error al exportar órdenes",
      error: error.message,
    });
  }
};

export const AUTHENTICATE = true;

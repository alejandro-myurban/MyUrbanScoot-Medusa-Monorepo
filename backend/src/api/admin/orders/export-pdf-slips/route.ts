// src/api/routes/admin/orders/export-pdf-slips/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import type { OrderAddressDTO } from "@medusajs/framework/types";
import { randomBytes } from "crypto";
import pdf from "html-pdf-node";

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
  // 1) IDs desde la query
  const ids = Array.isArray(req.query.ids)
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
    // 2) Traer pedidos con thumbnail y sku de variante
    const { result } = await getOrdersListWorkflow(req.scope).run({
      input: {
        fields: [
          "id",
          "display_id",
          "created_at",
          "email",
          "total",
          "currency_code",
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
        ],
        variables: { filters: { id: ids } },
      },
    });

    const orders = Array.isArray(result) ? result : result.rows;
    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron órdenes para esos IDs",
      });
    }

    // 3) Generar HTML
    const html = generatePackingSlipsHTML(orders);

    // 4) Opciones PDF
    const options = {
      format: "A4",
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
      printBackground: true,
    };

    // breve espera
    await new Promise((r) => setTimeout(r, 200));

    // 5) Generar PDF
    const file = { content: html };
    const pdfBuffer = await pdf.generatePdf(file, options);

    // 6) Responder
    const shortId = randomBytes(4).toString("hex");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="packing-slips-${shortId}.pdf"`
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

function generatePackingSlipsHTML(orders: any[]): string {
  const logoUrl =
    "https://myurbanscoot.com/wp-content/uploads/2023/05/cropped-logoH-01-284x62.png";

  // Datos de la empresa (los mismos para todas las páginas)
  const companyInfo = `
    <div class="company-info">
      <p><strong>De la dirección:</strong></p>
      <p>MyUrbanScoot</p>
      <p>Avda Peris y Valero 143, bajo derecha</p>
      <p>46005 Valencia</p>
      <p>Valencia</p>
      <p>+34 623 47 47 65</p>
      <p>B42702662</p>
    </div>
  `;

  // Para cada pedido, generamos una página POR CADA ITEM
  const pages = orders.flatMap((order) => {
    const b = (order.billing_address || {}) as ShippingAddress;
    const s = (order.shipping_address || {}) as ShippingAddress;
    const date = new Date(order.created_at).toLocaleDateString("es-ES");
    
    // Creamos una página para cada ítem del pedido
    return order.items.map((item: any, idx: number) => {
      const thumb = item.variant?.product?.thumbnail || "";
      const sku = item.variant?.sku || "";
      const weight = item.weight
        ? `${(item.weight / 1000).toFixed(2)}kg`
        : "n/a";
      const color = item.title.includes("Color : ") 
        ? item.title.split("Color : ")[1] 
        : "";
      
      // Extraemos título principal
      let mainTitle = item.title;
      if (mainTitle.includes("Color : ")) {
        mainTitle = mainTitle.split("Color : ")[0];
      }

      return `
        <div class="page">
          <div class="header">
            <div class="title">
              <h1>Hoja de embalaje</h1>
            </div>
            <div class="logo">
              <img src="${logoUrl}" alt="MyUrbanScoot"/>
            </div>
          </div>
          
          <div class="order-details">
            <p>
              <strong>Pedido Nº:</strong> ${order.display_id} &nbsp;&nbsp;
              <strong>Fecha:</strong> ${date}
            </p>
          </div>
          
          <div class="addresses-container">
            <div class="address-column">
              <div class="address-block">
                <p><strong>Dirección de facturación:</strong></p>
                <p>${b.first_name || ""} ${b.last_name || ""}</p>
                <p>${b.address_1 || ""}</p>
                <p>${b.postal_code || ""} ${b.city || ""} ${b.province ? `- ${b.province}` : ""}</p>
                <p>${b.phone || ""}</p>
                <p>${b.email || order.email || ""}</p>
              </div>
            </div>
            
            ${companyInfo}
            
            <div class="address-column">
              <div class="address-block">
                <p><strong>Dirección de envío:</strong></p>
                <p>${s.first_name || ""} ${s.last_name || ""}</p>
                <p>${s.address_1 || ""}</p>
                <p>${s.postal_code || ""} ${s.city || ""} ${s.province ? `- ${s.province}` : ""}</p>
                <p>${s.phone || ""}</p>
              </div>
              
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th class="img-cell">Imagen</th>
                <th>SKU</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Total weight</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td class="img-cell">
                  <img src="${thumb}" alt="${mainTitle}"/>
                </td>
                <td>${sku}</td>
                <td>
                  ${mainTitle}
                  ${color ? `<br><small>Color : ${color}</small>` : ''}
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center">${weight}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Gracias por confiar en MyUrbanScoot!</p>
            <p>Por guap@, te damos este código de descuento: <strong>-5€BABY</strong></p>
            <p>Si hay algún problema con tu pedido, escríbenos un WhatsApp o llámanos y te lo solucionamos cagando leches, disculpa las molestias</p>
          </div>
        </div>
      `;
    });
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Hoja de embalaje</title>
  <style>
    @page { 
      size: A4; 
      margin: 15mm; 
    }
    
    body { 
      margin: 0; 
      padding: 0;
      font-family: Arial, sans-serif; 
      font-size: 11px;
      line-height: 1.4;
    }
    
    .page { 
      page-break-after: always; 
    }
    
    .page:last-child { 
      page-break-after: auto; 
    }
    
    h1 {
      color: #00AEEF;
      font-size: 24px;
      margin: 0;
      padding: 0;
    }
    
    .header { 
      display: flex; 
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .header .logo img { 
      height: 40px; 
    }
    
    .order-details {
      margin-bottom: 15px;
    }
    
    .addresses-container {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    
    .address-column {
      width: 48%;
    }
    
    .address-block {
      margin-bottom: 20px;
    }
    
    .company-info {
      margin-top: 20px;
    }
    
    p {
      margin: 2px 0;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .items-table th {
      background-color: #333;
      color: white;
      text-align: left;
      padding: 8px 6px;
      font-weight: normal;
      border: 1px solid #222;
    }
    
    .items-table td {
      padding: 8px 6px;
      border: 1px solid #ddd;
      vertical-align: middle;
    }
    
    .img-cell {
      width: 60px;
      text-align: center;
    }
    
    .img-cell img {
      max-width: 40px;
      max-height: 40px;
      display: block;
      margin: 0 auto;
    }
    
    .text-center {
      text-align: center;
    }
    
    .footer {
      text-align: center;
      font-size: 10px;
      color: #666;
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }
    
    small {
      color: #666;
      font-size: 9px;
    }
    
    strong {
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${pages.join("")}
</body>
</html>`;
}
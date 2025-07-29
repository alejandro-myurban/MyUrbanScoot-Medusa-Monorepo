// src/api/admin/orders/export-invoices/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import type { OrderAddressDTO } from "@medusajs/framework/types";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import fileType from "file-type";

type OrderAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  province?: string;
  country_code?: string;
} & Partial<OrderAddressDTO>;

type ImageWithMime = {
  buffer: Buffer;
  mime: string;
};

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
          "tax_total", "shipping_total", "discount_total", "subtotal", "item_total", // Agregado item_total para claridad
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
      const invoiceDate = new Date().toISOString().slice(0, 10);
      filename = `FACT-${invoiceNum}-${invoiceDate}.pdf`;
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

async function loadImage(url: string | undefined, convertToPngIfUnsupported = false): Promise<ImageWithMime | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    let type = await fileType.fromBuffer(buffer);
    let imgBuffer = buffer;
    let mime = type?.mime || "image/png";

    if (convertToPngIfUnsupported && mime !== "image/jpeg" && mime !== "image/png") {
      console.warn(`Formato no soportado (${mime}) para ${url}, convirtiendo a PNG`);
      imgBuffer = await sharp(buffer).png().toBuffer();
      mime = "image/png";
    } else if (!type) {
      console.warn(`No se pudo detectar el tipo de imagen para ${url}, asumiendo PNG`);
      mime = "image/png";
    }
    return { buffer: imgBuffer, mime };
  } catch (error) {
    console.error(`Error cargando imagen desde ${url}:`, error);
    return null;
  }
}

async function generateInvoicePDF(
  orders: any[],
  logoImage: ImageWithMime | null,
  fondo: ImageWithMime | null,
  invoiceHeaderImage: ImageWithMime | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      doc.registerFont("Regular", "Helvetica");
      doc.registerFont("Bold", "Helvetica-Bold");

      const horizontalContentPadding = 30;
      const verticalContentPadding = 20;

      orders.forEach((order, orderIndex) => {
        if (orderIndex > 0) doc.addPage();

        const customerAddress: OrderAddress = (order.shipping_address || order.billing_address) as OrderAddress;

        const formattedDisplayId = String(order.display_id).padStart(4, '0');
        const invoiceNumber = `${formattedDisplayId}`;
        const invoiceDate = new Date().toLocaleDateString("es-ES");

        if (fondo) doc.image(fondo.buffer, 0, 0, { width: doc.page.width, height: doc.page.height });

        const headerHeight = 120;
        doc.rect(0, 0, doc.page.width, headerHeight).fill("black");

        if (invoiceHeaderImage) {
          try {
            doc.image(invoiceHeaderImage.buffer, horizontalContentPadding, (headerHeight - 60) / 2, { width: 180 });
          } catch (error) {
            console.error("Error al insertar imagen de cabecera en PDF:", error);
          }
        }

        const companyInfoWidth = 220;
        const companyInfoX = doc.page.width - horizontalContentPadding - companyInfoWidth;
        let currentCompanyInfoY = verticalContentPadding;

        doc.fillColor("white").fontSize(11).font("Bold");
        doc.text("MYURBANSCOOT SL", companyInfoX, currentCompanyInfoY, { align: "right", width: companyInfoWidth });
        currentCompanyInfoY = doc.y;

        doc.font("Regular").fontSize(10);
        doc.text("Avda Peris y Valero 143", companyInfoX, currentCompanyInfoY + 2, { align: "right", width: companyInfoWidth });
        currentCompanyInfoY = doc.y;
        doc.text("myurbanscoot@myurbanscoot.com", companyInfoX, currentCompanyInfoY + 2, { align: "right", width: companyInfoWidth });
        currentCompanyInfoY = doc.y;
        doc.text("+34623472200", companyInfoX, currentCompanyInfoY + 2, { align: "right", width: companyInfoWidth });
        currentCompanyInfoY = doc.y;
        doc.text("C.I.F.: B42702662", companyInfoX, currentCompanyInfoY + 2, { align: "right", width: companyInfoWidth });

        // --- Client and Invoice Information Section ---
        const infoBlockStartY = headerHeight + verticalContentPadding;
        doc.y = infoBlockStartY;

        const leftColX = horizontalContentPadding;
        const rightColX = doc.page.width / 2 + horizontalContentPadding / 2;
        const colWidth = (doc.page.width - (horizontalContentPadding * 3)) / 2;

        const labelWidth = 90;
        const valueWidth = colWidth - labelWidth - 5;

        const drawInfoRow = (x: number, y: number, label: string, value: string) => {
          doc.font("Bold").fontSize(11);
          doc.text(`${label}:`, x, y, { width: labelWidth, align: "left" });
          doc.font("Regular").text(value, x + labelWidth, y, { width: valueWidth, align: "left" });
        };

        // Client Details
        doc.fillColor("#000000").font("Bold").fontSize(12);
        doc.text("DATOS DEL CLIENTE", leftColX, doc.y);
        doc.moveDown(0.5);
        let currentYClient = doc.y;
        let yOffsetClient = 0;
        const lineHeight = 16;

        drawInfoRow(leftColX, currentYClient + yOffsetClient, "NOMBRE", `${customerAddress.first_name || ""} ${customerAddress.last_name || ""}`.trim());
        yOffsetClient += lineHeight;
        drawInfoRow(leftColX, currentYClient + yOffsetClient, "Dirección", `${customerAddress.address_1 || ""}${customerAddress.address_2 ? `, ${customerAddress.address_2}` : ''}`.trim());
        yOffsetClient += lineHeight;
        drawInfoRow(leftColX, currentYClient + yOffsetClient, "Ciudad", `${customerAddress.city || ""}`);
        yOffsetClient += lineHeight;
        drawInfoRow(leftColX, currentYClient + yOffsetClient, "Código Postal", `${customerAddress.postal_code || ""}`);
        yOffsetClient += lineHeight;
        drawInfoRow(leftColX, currentYClient + yOffsetClient, "Teléfono", `${customerAddress.phone || order.customer?.phone || ""}`);
        yOffsetClient += lineHeight;
        drawInfoRow(leftColX, currentYClient + yOffsetClient, "Email", `${customerAddress.email || order.email || ""}`);
        yOffsetClient += lineHeight;
        drawInfoRow(leftColX, currentYClient + yOffsetClient, "C.I.F.", "");

        const clientInfoEndY = currentYClient + yOffsetClient;

        // Invoice Details
        doc.y = infoBlockStartY;
        doc.fillColor("#000000").font("Bold").fontSize(12);
        doc.text("DATOS DE FACTURA", rightColX, doc.y);
        doc.moveDown(0.5);
        let currentYInvoice = doc.y;
        let yOffsetInvoice = 0;

        drawInfoRow(rightColX, currentYInvoice + yOffsetInvoice, "Nº FACTURA", invoiceNumber);
        yOffsetInvoice += lineHeight;
        drawInfoRow(rightColX, currentYInvoice + yOffsetInvoice, "FECHA", invoiceDate);
        yOffsetInvoice += lineHeight;
        drawInfoRow(rightColX, currentYInvoice + yOffsetInvoice, "Nº PEDIDO", String(order.display_id).padStart(4, '0'));
        yOffsetInvoice += lineHeight;

        // Payment Method
        let paymentMethod = "N/A";
        if (order.payment_collections && order.payment_collections.length > 0 &&
            order.payment_collections[0].payments && order.payment_collections[0].payments.length > 0) {
          const providerId = order.payment_collections[0].payments[0].provider_id;
          switch (providerId) {
            case "pp_stripe_stripe":
              paymentMethod = "Tarjeta de Crédito (Stripe)";
              break;
            case "pp_system_default":
              paymentMethod = "Transferencia Bancaria";
              break;
            default:
              paymentMethod = providerId.replace("pp_", "").replace(/_/g, " ").trim();
              if (paymentMethod.includes("stripe")) paymentMethod = "Tarjeta de Crédito (Stripe)";
              else paymentMethod = "Otro (" + paymentMethod + ")";
          }
        }
        drawInfoRow(rightColX, currentYInvoice + yOffsetInvoice, "FORMA PAGO", paymentMethod);
        yOffsetInvoice += lineHeight;

        const invoiceInfoEndY = currentYInvoice + yOffsetInvoice;

        const tableStartY = Math.max(clientInfoEndY, invoiceInfoEndY) + verticalContentPadding;
        doc.y = tableStartY;

        // --- TABLA DE ÍTEMS ---
        const tableX = horizontalContentPadding;
        const tableWidth = doc.page.width - (horizontalContentPadding * 2);
        const rowHeight = 25;
        const headerRowHeight = 22;

        const colWidths = [
          tableWidth * 0.10, // Cantidad
          tableWidth * 0.50, // Descripción
          tableWidth * 0.20, // Precio Unitario
          tableWidth * 0.20, // Importe
        ];

        const drawTableCell = (x: number, y: number, width: number, height: number, text: string, isHeader = false, align: "left" | "center" | "right" = "left", vAlign: "top" | "center" | "bottom" = "center") => {
          doc.lineWidth(isHeader ? 1 : 0.5);
          doc.rect(x, y, width, height).fillAndStroke(isHeader ? "#e0e0e0" : "white", "#CCCCCC");
          doc.fillColor("#000000").font(isHeader ? "Bold" : "Regular");
          const padding = 5;
          const textHeight = doc.heightOfString(text, { width: width - padding * 2 });
          let textY = y + padding;

          if (vAlign === "center") {
            textY = y + (height - textHeight) / 2;
          } else if (vAlign === "bottom") {
            textY = y + height - textHeight - padding;
          }

          doc.text(text, x + padding, textY, {
            width: width - padding * 2,
            align,
          });
        };

        const headerY = doc.y;
        const headers = ["QTY", "DESCRIPTION", "UNIT PRICE", "TOTAL"];
        headers.forEach((header, i) => {
          const cellX = tableX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
          const align = (i === 1) ? "left" : "center";
          drawTableCell(cellX, headerY, colWidths[i], headerRowHeight, header, true, align);
        });

        let currentY = headerY + headerRowHeight;

        order.items.forEach((item: any) => {
          const xStart = tableX;

          drawTableCell(xStart, currentY, colWidths[0], rowHeight, item.quantity.toString(), false, "center");

          let descriptionContent = item.title;
          const colorMatch = item.title.match(/Color : (.*)/);
          if (colorMatch && colorMatch[1]) {
             descriptionContent = item.title.replace(/Color : (.*)/, '').trim();
          }
          if (typeof item.metadata?.details === 'string' && item.metadata.details.trim()) {
              descriptionContent += `\n${item.metadata.details.trim()}`;
          }
          if (colorMatch && colorMatch[1]) {
             descriptionContent += `\nColor: ${colorMatch[1]}`;
          }

          const descriptionCellHeight = doc.heightOfString(descriptionContent, { width: colWidths[1] - 10 }) + 10;
          const actualRowHeight = Math.max(rowHeight, descriptionCellHeight);

          drawTableCell(xStart + colWidths[0], currentY, colWidths[1], actualRowHeight, descriptionContent.trim(), false, "left", "top");

          const unitPrice = item.unit_price.toFixed(2);
          drawTableCell(xStart + colWidths[0] + colWidths[1], currentY, colWidths[2], actualRowHeight, `${unitPrice}€`, false, "right");

          const itemTotal = (item.unit_price * item.quantity).toFixed(2);
          drawTableCell(xStart + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], actualRowHeight, `${itemTotal}€`, false, "right");

          currentY += actualRowHeight;
        });

        // --- RESUMEN DE FACTURACIÓN ---
        // Acceder directamente a los valores, sin divisiones por 100.
        // Se asume que estos valores ya están en la unidad monetaria principal (ej. euros).
        const taxTotal = order.tax_total;
        const shippingTotal = order.shipping_total;
        const total = order.total;
        const baseImponible = order.total - order.shipping_total;
        const discountTotal = order.discount_total;

        const summaryBlockWidth = 250;
        const summaryLabelWidth = 150;
        const summaryValueWidth = 100;
        const summaryBlockStartX = doc.page.width - horizontalContentPadding - summaryBlockWidth;
        const summaryValueStartX = summaryBlockStartX + summaryLabelWidth;

        const rowHeightPrice = 20;
        const totalHeight = 25;
        const totalFontSize = 14;

        let y = currentY + verticalContentPadding;

        // DEBUG: Imprime el objeto de la orden justo antes de usar los totales
        console.log("Valores de la orden para el resumen:", {
          baseImponible: baseImponible,
          taxTotal: taxTotal,
          shippingTotal: shippingTotal,
          total: total,
          discountTotal: discountTotal,
        });

        /**
         * Helper para dibujar una fila de resumen.
         * @param label Etiqueta de la fila.
         * @param value Valor de la fila.
         * @param isTotal Si es la fila del total.
         * @param bgColor Color de fondo.
         */
        const drawSummaryRow = (label: string, value: string, isTotal = false, bgColor: string | null = null) => {
          doc.fillColor("black");
          doc.font(isTotal ? "Bold" : "Regular").fontSize(isTotal ? totalFontSize : 11);

          if (bgColor) {
            doc.rect(summaryBlockStartX, y, summaryBlockWidth, isTotal ? totalHeight : rowHeightPrice)
              .fill(bgColor);
          }

          doc.text(label, summaryBlockStartX + 10, y + (isTotal ? 6 : 5), { width: summaryLabelWidth - 10, align: "left" });

          doc.text(value, summaryValueStartX, y + (isTotal ? 6 : 5), { width: summaryValueWidth - 10, align: "right" });

          if (!bgColor) {
            doc.lineWidth(0.5);
            doc.rect(summaryBlockStartX, y, summaryLabelWidth, isTotal ? totalHeight : rowHeightPrice).stroke("#CCCCCC");
            doc.rect(summaryValueStartX, y, summaryValueWidth, isTotal ? totalHeight : rowHeightPrice).stroke("#CCCCCC");
          }
          y += (isTotal ? totalHeight : rowHeightPrice);
        };

        // Reordenamiento y estilos para el resumen
        drawSummaryRow("Base Imponible", `${baseImponible.toFixed(2)}€`);

        drawSummaryRow("Descuento total", `-${discountTotal.toFixed(2)}€`);
        
        // El IVA se muestra con (0%) si taxTotal es 0
        drawSummaryRow("IVA (0%)", `${taxTotal.toFixed(2)}€`);

        let shippingMethodName = "N/A";
        if (order.shipping_methods && order.shipping_methods.length > 0) {
          shippingMethodName = order.shipping_methods[0].name || "Desconocido";
        }
        drawSummaryRow(`Envío (${shippingMethodName})`, `${shippingTotal.toFixed(2)}€`);

        drawSummaryRow("TOTAL", `${total.toFixed(2)}€`, true); // Color de fondo para el total


        // --- PIE DE PÁGINA ---
        const footerHeight = 80;
        const footerY = doc.page.height - footerHeight;

        doc.rect(0, footerY, doc.page.width, footerHeight).fill("#000000"); 

        // Logo de MyUrbanScoot en el centro del pie
        if (logoImage) {
            try {
                const logoWidth = doc.page.width - 60; 
                const logoHeight = 60; 
                const logoX = (doc.page.width - logoWidth) / 2; 
                doc.image(logoImage.buffer, logoX, footerY + (footerHeight - logoHeight) / 2, { 
                    width: logoWidth,
                    fit: [logoWidth, logoHeight],
                });
            } catch (error) {
                console.error("Error al insertar logo del footer:", error);
            }
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
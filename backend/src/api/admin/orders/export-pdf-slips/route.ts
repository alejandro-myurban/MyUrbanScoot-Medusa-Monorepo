// src/api/routes/admin/orders/export-pdf-slips/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import type { OrderAddressDTO } from "@medusajs/framework/types";
import { randomBytes } from "crypto";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import fileType from "file-type"; 

type ShippingAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
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

    let logoImage: ImageWithMime | null = null;
    let fondo: ImageWithMime | null = null;
    let packingSlipImage: ImageWithMime | null = null; 

    // Cargar logo principal (para el footer)
    try {
      const logoRes = await fetch(logoUrl);
      const arrayBuffer = await logoRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const type = await fileType.fromBuffer(buffer);
      if (!type) {
        console.warn(
          "No se pudo detectar el tipo de imagen del logo, asumiendo PNG"
        );
        logoImage = { buffer, mime: "image/png" };
      } else {
        logoImage = { buffer, mime: type.mime };
      }
    } catch (error) {
      console.error("Error cargando logo:", error);
      logoImage = null;
    }

    // Cargar imagen de fondo
    try {
      const res = await fetch(fondoUrl);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const type = await fileType.fromBuffer(buffer);
      fondo = {
        buffer: type?.mime === "image/png" || type?.mime === "image/jpeg"
        ? buffer
        : await sharp(buffer).png().toBuffer(),
        mime: "image/png",
      };
    } catch (err) {
      console.error("Error cargando fondo:", err);
      fondo = null; 
    }

    // Cargar imagen "PACKING SLIP" (ahora usada como "FACTURA")
    try {
      const res = await fetch(packingSlipImageUrl); 
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const type = await fileType.fromBuffer(buffer);
      packingSlipImage = { 
        buffer: type?.mime === "image/png" || type?.mime === "image/jpeg"
          ? buffer
          : await sharp(buffer).png().toBuffer(),
        mime: "image/png",
      };
    } catch (err) {
      console.error("Error cargando packing slip image:", err);
      packingSlipImage = null; 
    }

    await Promise.all(
      orders.flatMap((order) =>
        order.items.map(async (item: any) => {
          const thumbUrl = item.variant?.product?.thumbnail;
          if (!thumbUrl) {
            item._thumbImage = null;
            return;
          }
          try {
            const res = await fetch(thumbUrl);
            const buf = Buffer.from(await res.arrayBuffer());
            const type = await fileType.fromBuffer(buf);
            let imgBuffer = buf;
            let mime = type?.mime || "image/png";

            if (mime !== "image/jpeg" && mime !== "image/png") {
              console.warn(
                `Formato no soportado (${mime}) para item ${item.id}, convirtiendo a PNG`
              );
              imgBuffer = await sharp(buf).png().toBuffer();
              mime = "image/png";
            }

            item._thumbImage = { buffer: imgBuffer, mime };
          } catch (error) {
            console.error(
              `Error cargando thumbnail para item ${item.id}:`,
              error
            );
            item._thumbImage = null;
          }
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

async function generatePackingSlipsPDF(
  orders: any[],
  logoImage: ImageWithMime | null,
  fondo: ImageWithMime | null,
  packingSlipImage: ImageWithMime | null 
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

      orders.forEach((order, orderIndex) => {
        if (orderIndex > 0) {
          doc.addPage();
        }

        const b = order.billing_address as ShippingAddress;
        const s = order.shipping_address as ShippingAddress;
        const orderDate = new Date(order.created_at).toLocaleDateString("es-ES");
        const invoiceDate = new Date().toLocaleDateString("es-ES"); 

        // --- FONDO (si existe) ---
        if (fondo) {
          doc.image(fondo.buffer, 0, 0, { width: doc.page.width, height: doc.page.height });
        }

        // --- CABECERA ---
        const headerHeight = 120; 
        doc.rect(0, 0, doc.page.width, headerHeight).fill("black"); 

        // Imagen "PACKING SLIP" (ahora como "FACTURA") a la izquierda
        if (packingSlipImage) { 
            try {
                doc.image(packingSlipImage.buffer, 30, 30, { width: 200 }); 
            } catch (error) {
                console.error("Error al insertar imagen de cabecera en PDF:", error);
            }
        }

        // Información de la compañía a la derecha
        const companyInfoX = doc.page.width - horizontalContentPadding - 220; 
        let currentCompanyInfoY = 20; 

        doc.fillColor("white").fontSize(12).font("Bold"); 
        doc.text("MYURBANSCOOT SL", companyInfoX, currentCompanyInfoY, { align: "right", width: 220 });
        currentCompanyInfoY = doc.y; 

        doc.font("Regular").fontSize(12); 
        doc.text("Avda Peris y Valero 143", companyInfoX, currentCompanyInfoY + 2, { align: "right", width: 220 });
        currentCompanyInfoY = doc.y;

        doc.text("myurbanscoot@myurbanscoot.com", companyInfoX, currentCompanyInfoY + 2, { align: "right", width: 220 });
        currentCompanyInfoY = doc.y;

        doc.text("+34623472200", companyInfoX, currentCompanyInfoY + 2, { align: "right", width: 220 });
        currentCompanyInfoY = doc.y;

        doc.text("C.I.F.: B42702662", companyInfoX, currentCompanyInfoY + 2, { align: "right", width: 220 });
        currentCompanyInfoY = doc.y;
        
        // --- DATOS DEL CLIENTE Y FACTURA ---
        doc.y = headerHeight + 40; // Posición inicial después de la cabecera
        const clientInfoX = horizontalContentPadding;
        const invoiceInfoX = doc.page.width / 2 + horizontalContentPadding / 2; 

        // Título "DATOS DEL CLIENTE"
        doc.fillColor("black").font("Bold").fontSize(12);
        doc.text("DATOS DEL CLIENTE", clientInfoX, doc.y);
        doc.moveDown(0.8); 

        // Datos del cliente
        doc.font("Regular").fontSize(11);
        doc.font("Bold").text(`Nombre:`, clientInfoX, doc.y, { continued: true });
        doc.font("Regular").text(` ${b.first_name || ""} ${b.last_name || ""}`.trim());
        doc.moveDown(0.8); 
        
        doc.font("Bold").text(`Dirección:`, clientInfoX, doc.y, { continued: true });
        doc.font("Regular").text(` ${b.address_1 || ""}`);
        doc.moveDown(0.8); // Espacio para la línea 1 de dirección
        doc.font("Bold").text(`Ciudad:`, clientInfoX, doc.y, { continued: true });
        doc.text(`${b.city || ""}`, clientInfoX, doc.y); 
        doc.moveDown(0.8); // Espacio para la ciudad
        doc.font("Bold").text(`Codigo Postal:`, clientInfoX, doc.y, { continued: true });
        doc.text(`${b.postal_code || ""}`, clientInfoX, doc.y); 
        doc.moveDown(0.8); // Espacio para el código postal

        doc.font("Bold").text(`Teléfono:`, clientInfoX, doc.y, { continued: true });
        doc.font("Regular").text(` ${b.phone || order.customer?.phone || ""}`); 
        doc.moveDown(0.8); 
        
        doc.font("Bold").text(`Email:`, clientInfoX, doc.y, { continued: true });
        doc.font("Regular").text(` ${b.email || ""}`); 
        
        // Calcular la posición Y más baja de la sección de datos del cliente
        const clientInfoEndY = doc.y;

        // Posición para la información de la factura (a la derecha)
        doc.y = headerHeight + 40; // Reset Y para la columna de la derecha
        doc.font("Bold").fontSize(12);
        doc.text(`Nº FACTURA: ${order.metadata?.invoice_number || order.display_id}`, invoiceInfoX, doc.y);
        doc.moveDown(0.8); 
        doc.text(`FECHA: ${invoiceDate}`, invoiceInfoX, doc.y); 
        
        // Calcular la posición Y más baja de la sección de información de la factura
        const invoiceInfoEndY = doc.y;

        // --- TABLA DE PRODUCTOS ---
        // Asegura que la tabla comience después de ambas columnas de información
        const tableStartY = Math.max(clientInfoEndY, invoiceInfoEndY) + 20; // Añadir un espaciado extra
        doc.y = tableStartY;
        
        const tableX = horizontalContentPadding;
        const tableWidth = doc.page.width - (horizontalContentPadding * 2); 
        const rowHeight = 45; 
        const headerRowHeight = 25; 

        const colWidths = [
          tableWidth * 0.15, // Imagen
          tableWidth * 0.12, // Cantidad (agrandado)
          tableWidth * 0.38, // Descripción (ajustado)
          tableWidth * 0.20, // Detalles (achicado)
          tableWidth * 0.15, // Precio
        ];

        const drawTableCell = (
          x: number,
          y: number,
          width: number,
          height: number,
          text: string,
          isHeader = false,
          align: "left" | "center" | "right" = "left"
        ) => {
          doc.lineWidth(isHeader ? 1 : 0.5);
          if (isHeader) {
            doc.rect(x, y, width, height).fillAndStroke("#f5f5f5", "#CCCCCC"); 
            doc.fillColor("#000000").font("Bold");
          } else {
            doc.rect(x, y, width, height).stroke();
            doc.fillColor("#000000").font("Regular");
          }

          const padding = 5;
          const textHeight = doc.heightOfString(text, { width: width - padding * 2 });
          doc.text(text, x + padding, y + (height - textHeight) / 2, {
            width: width - padding * 2,
            align: isHeader ? "center" : align,
          });
        };

        const headerY = doc.y;
        const headers = ["Imagen", "Cantidad", "Descripción", "Detalles", "Precio"]; 

        headers.forEach((header, i) => {
          const cellX = tableX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
          drawTableCell(cellX, headerY, colWidths[i], headerRowHeight, header, true); 
        });

        let currentY = headerY + headerRowHeight; 

        order.items.forEach((item: any) => {
          const xStart = tableX;

          // Imagen
          const imageCell = { x: xStart, y: currentY, width: colWidths[0], height: rowHeight };
          doc.rect(imageCell.x, imageCell.y, imageCell.width, imageCell.height).stroke();

          if (item._thumbImage) {
            try {
              const imageSize = Math.min(imageCell.width - 10, imageCell.height - 10); 
              doc.image(
                item._thumbImage.buffer,
                imageCell.x + (imageCell.width - imageSize) / 2,
                imageCell.y + (imageCell.height - imageSize) / 2,
                { fit: [imageSize, imageSize], valign: "center", align: "center" } 
              );
            } catch (err) {
              console.error(`Error al insertar thumbnail para item ${item.id}:`, err);
              doc.rect(imageCell.x + 5, imageCell.y + 5, 30, 30).fillAndStroke("#ccc", "#999");
            }
          }

          // Cantidad
          drawTableCell(xStart + colWidths[0], currentY, colWidths[1], rowHeight, item.quantity.toString(), false, "center");

          // Descripción
          let title = item.title;
          if (title.includes("Color : ")) title = title.split("Color : ")[0];
          drawTableCell(xStart + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight, title, false, "left");

          // Detalles 
          let detailsContent = "";
          const colorMatch = item.title.match(/Color : (.*)/);
          if (colorMatch && colorMatch[1]) {
              detailsContent += `Color: ${colorMatch[1]}\n`;
          }
          if (item.metadata?.details) { 
            detailsContent += item.metadata.details;
          } else if (item.metadata && Object.keys(item.metadata).length > 0) {
            for (const key in item.metadata) {
                if (key !== "details") { 
                    detailsContent += `${key}: ${item.metadata[key]}\n`;
                }
            }
          }
          drawTableCell(xStart + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], rowHeight, detailsContent.trim(), false, "left");

          // Precio Unitario
          const unitPrice = item.unit_price.toFixed(2); 
          drawTableCell(xStart + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY, colWidths[4], rowHeight, `${unitPrice}€`, false, "right");

          currentY += rowHeight;
        });

        // Calcular totales
        const baseImponible = order.total / 1.21;
        const ivaAmount = baseImponible * 0.21;

        // Dimensiones
        const totalSummaryBlockWidth = 250;
        const summaryBlockStartX = doc.page.width - horizontalContentPadding - totalSummaryBlockWidth;
        const summaryLabelWidth = totalSummaryBlockWidth * 0.6;
        const summaryValueStartX = summaryBlockStartX + summaryLabelWidth;
        const summaryValueWidth = totalSummaryBlockWidth * 0.4;

        // Altura de filas
        const rowHeightPrice = 20;
        const totalHeight = 25;

        // Posición inicial Y
        let y = currentY + 20;

        // Estilo general
        doc.font("Regular").fontSize(11);

        // --- BASE IMPONIBLE ---
        doc.rect(summaryBlockStartX, y, summaryLabelWidth, rowHeightPrice).stroke();
        doc.rect(summaryValueStartX, y, summaryValueWidth, rowHeightPrice).stroke();

        doc.text("Base Imponible", summaryBlockStartX + 5, y + 5, {
          width: summaryLabelWidth - 10,
          align: "left"
        });
        doc.text(`${baseImponible.toFixed(2)}€`, summaryValueStartX, y + 5, {
          width: summaryValueWidth - 5,
          align: "right"
        });

        y += rowHeightPrice;

        // --- IVA ---
        doc.rect(summaryBlockStartX, y, summaryLabelWidth, rowHeightPrice).stroke();
        doc.rect(summaryValueStartX, y, summaryValueWidth, rowHeightPrice).stroke();

        doc.text("IVA 21%", summaryBlockStartX + 5, y + 5, {
          width: summaryLabelWidth - 10,
          align: "left"
        });
        doc.text(`${ivaAmount.toFixed(2)}€`, summaryValueStartX, y + 5, {
          width: summaryValueWidth - 5,
          align: "right"
        });

        y += rowHeight;

        // --- TOTAL ---
        doc.font("Bold").fontSize(14);
        doc.rect(summaryBlockStartX, y, summaryLabelWidth, totalHeight).stroke();
        doc.rect(summaryValueStartX, y, summaryValueWidth, totalHeight).stroke();

        doc.text("TOTAL", summaryBlockStartX + 5, y + 6, {
          width: summaryLabelWidth - 10,
          align: "left"
        });
        doc.text(`${order.total.toFixed(2)}€`, summaryValueStartX, y + 6, {
          width: summaryValueWidth - 5,
          align: "right"
        });
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

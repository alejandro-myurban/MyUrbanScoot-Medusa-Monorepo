// src/lib/invoices/pdfSlipsGenerator.ts
import PDFDocument from "pdfkit";
import type { OrderAddressDTO } from "@medusajs/framework/types";
import { ImageWithMime } from "./load-image"; // Importa ImageWithMime

type ShippingAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
} & Partial<OrderAddressDTO>;

/**
 * Genera un PDF de albaranes (packing slips) para una o varias órdenes.
 * @param {any[]} orders - Un array de objetos de orden.
 * @param {ImageWithMime | null} logoImage - La imagen del logo para el pie de página.
 * @param {ImageWithMime | null} fondo - La imagen de fondo para el PDF.
 * @param {ImageWithMime | null} packingSlipImage - La imagen del encabezado del albarán.
 * @returns {Promise<Buffer>} Un buffer que contiene el PDF generado.
 */
export async function generatePackingSlipsPDF(
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
        // const s = order.shipping_address as ShippingAddress; // No se usa en este código, podrías eliminarla si no es necesaria.
        // const orderDate = new Date(order.created_at).toLocaleDateString("es-ES"); // No se usa directamente en el PDF visible, podrías eliminarla.
        const invoiceDate = new Date().toLocaleDateString("es-ES"); // Fecha de generación del documento

        // --- FONDO (si existe) ---
        if (fondo) {
          doc.image(fondo.buffer, 0, 0, { width: doc.page.width, height: doc.page.height });
        }

        // --- CABECERA ---
        const headerHeight = 120;
        doc.rect(0, 0, doc.page.width, headerHeight).fill("black");

        // Imagen "PACKING SLIP" a la izquierda
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
        doc.moveDown(0.8);
        doc.font("Bold").text(`Ciudad:`, clientInfoX, doc.y, { continued: true });
        doc.text(`${b.city || ""}`, clientInfoX, doc.y);
        doc.moveDown(0.8);
        doc.font("Bold").text(`Codigo Postal:`, clientInfoX, doc.y, { continued: true });
        doc.text(`${b.postal_code || ""}`, clientInfoX, doc.y);
        doc.moveDown(0.8);

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
          tableWidth * 0.12, // Cantidad
          tableWidth * 0.38, // Descripción
          tableWidth * 0.20, // Detalles
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

        // Calcular totales (si son necesarios para el albarán, aunque los albaranes no suelen llevar precios)
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
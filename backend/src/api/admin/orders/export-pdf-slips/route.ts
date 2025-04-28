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
  // 1) IDs desde la query
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
    // 2) Traer pedidos
    const { result } = await getOrdersListWorkflow(req.scope).run({
      input: {
        fields: [
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
    const orders: any[] = Array.isArray(result) ? result : result.rows;
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "No se encontraron órdenes" });
    }

    // 3) Cargar logo con detección de tipo
    const logoUrl =
      "https://myurbanscoot.com/wp-content/uploads/2023/05/cropped-logoH-01-284x62.png";
    let logoImage: ImageWithMime | null = null;
    try {
      const logoRes = await fetch(logoUrl);
      const arrayBuffer = await logoRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Detectar el tipo de imagen - usando API antigua de file-type
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

            // PDFKit solo soporta JPEG y PNG: convertir otros formatos a PNG
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
    // 5) Crear el PDF con PDFKit
    const pdfBuffer = await generatePackingSlipsPDF(orders, logoImage);

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

// ----------------------------------------------------------------
// Genera el PDF usando PDFKit
// ----------------------------------------------------------------
async function generatePackingSlipsPDF(
  orders: any[],
  logoImage: ImageWithMime | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Configuración de página
      const doc = new PDFDocument({
        size: "A4",
        margin: 42.5, // 15mm en puntos (42.5)
        bufferPages: true,
      });

      // Recolectar datos en un buffer
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Registrar fuentes
      doc.registerFont("Regular", "Helvetica");
      doc.registerFont("Bold", "Helvetica-Bold");

      // Procesar cada orden - UNA PÁGINA POR ORDEN
      orders.forEach((order, orderIndex) => {
        if (orderIndex > 0) {
          doc.addPage(); // Nueva página para cada orden después de la primera
        }

        const b = order.billing_address as ShippingAddress;
        const s = order.shipping_address as ShippingAddress;
        const date = new Date(order.created_at).toLocaleDateString("es-ES");

        // Cabecera con título y logo
        doc
          .font("Bold")
          .fontSize(24)
          .fillColor("#00AEEF")
          .text("Hoja de embalaje", { align: "left" });

        // Logo
        if (logoImage) {
          try {
            doc.image(logoImage.buffer, doc.page.width - 150, doc.y - 35, {
              width: 120,
              fit: [120, 40],
            });
          } catch (error) {
            console.error("Error al insertar logo en PDF:", error);
          }
        }

        // Detalles del pedido
        doc.font("Regular").fontSize(11).fillColor("black");
        doc.moveDown(1);
        doc.text(`Pedido Nº: ${order.display_id}     Fecha: ${date}`);
        doc.moveDown(0.5);

        // Calculamos los anchos
        const columnWidth =
          (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2;

        // Dirección de facturación (columna izquierda)
        const billingY = doc.y;
        doc.font("Bold").text("Facturación:", doc.page.margins.left, billingY);
        doc.font("Regular");
        doc.text(`${b.first_name || ""} ${b.last_name || ""}`);
        doc.text(`${b.address_1 || ""}`);
        doc.text(
          `${b.postal_code || ""} ${b.city || ""} ${
            b.province ? `- ${b.province}` : ""
          }`
        );
        doc.text(`${b.phone || ""}`);
        doc.text(`${b.email || order.email || ""}`);

        // Columna derecha (dividida en dos bloques)

        // Bloque superior derecho (antigua columna central)
        doc
          .font("Bold")
          .text(
            "De la dirección:",
            doc.page.margins.left + columnWidth,
            billingY
          );
        doc.font("Regular");
        doc.text("MyUrbanScoot", doc.page.margins.left + columnWidth, doc.y);
        doc.text("Avda Peris y Valero 143, bajo derecha");
        doc.text("46005 Valencia");
        doc.text("Valencia");
        doc.text("+34 623 47 47 65");
        doc.text("B42702662");

        // Guardamos la posición y después de MyUrbanScoot
        const afterCompanyY = doc.y + 15;

        // Bloque inferior derecho (antigua columna derecha)
        doc
          .font("Bold")
          .text("Envío:", doc.page.margins.left + columnWidth, afterCompanyY);
        doc.font("Regular");
        doc.text(
          `${s.first_name || ""} ${s.last_name || ""}`,
          doc.page.margins.left + columnWidth,
          doc.y
        );
        doc.text(`${s.address_1 || ""}`);
        doc.text(
          `${s.postal_code || ""} ${s.city || ""} ${
            s.province ? `- ${s.province}` : ""
          }`
        );
        doc.text(`${s.phone || ""}`);

        // Asegurar que estamos debajo de todas las direcciones
        const shippingY = doc.y;
        doc.y = Math.max(doc.y, shippingY) + 20;

        // TABLA DE PRODUCTOS - Ahora incluye TODOS los productos de esta orden

        // Encabezados de tabla
        const startY = doc.y;
        const tableTop = startY;
        const tableWidth =
          doc.page.width - doc.page.margins.left - doc.page.margins.right;

        // Ajuste de anchos de columna - Columna de cantidad más ancha
        const colWidths = [
          tableWidth * 0.1,
          tableWidth * 0.15,
          tableWidth * 0.15,
          tableWidth * 0.3,
          tableWidth * 0.15,
          tableWidth * 0.15,
        ];

        // Función para dibujar una celda de tabla
        // Reemplaza tu función drawTableCell por esta:
        const drawTableCell = (
          x: number,
          y: number,
          width: number,
          height: number,
          text: string,
          isHeader = false
        ) => {
          // 1) Ajusta aquí el grosor según si es header o no
          doc.lineWidth(isHeader ? 1 : 0.5);

          // 2) Dibuja fondo y borde
          if (isHeader) {
            // fondo oscuro + borde
            doc.rect(x, y, width, height).fillAndStroke("#333333", "#000000");
            doc.fillColor("#ffffff").font("Bold");
          } else {
            // solo borde fino
            doc.rect(x, y, width, height).stroke();
            doc.fillColor("#000000").font("Regular");
          }

          // 3) Texto con padding
          const padding = 5;
          doc.text(text, x + padding, y + padding, {
            width: width - padding * 2,
            height: height - padding * 2,
            align: isHeader ? "center" : "left",
          });
        };

        // Altura de la fila - Aumento para contener la imagen
        const rowHeight = 50;

        // Dibujar encabezados
        const headerY = doc.y;
        const headers = [
          "S.No",
          "Imagen",
          "SKU",
          "Producto",
          "Cantidad",
          "Total weight",
        ];
        headers.forEach((header, i) => {
          drawTableCell(
            doc.page.margins.left +
              colWidths.slice(0, i).reduce((sum, w) => sum + w, 0),
            headerY,
            colWidths[i],
            rowHeight,
            header,
            true
          );
        });

        // Dibujar filas de datos - UNA FILA POR PRODUCTO
        let currentY = headerY + rowHeight;

        // Procesar cada producto en la tabla
        order.items.forEach((item: any, itemIndex: number) => {
          const sku = item.variant?.sku || "";
          const weight = item.weight
            ? `${(item.weight / 1000).toFixed(2)}kg`
            : "n/a";
          let title = item.title;
          let colorLabel = "";
          if (title.includes("Color : ")) {
            const parts = title.split("Color : ");
            title = parts[0];
            colorLabel = parts[1];
          }

          // S.No (número secuencial)
          drawTableCell(
            doc.page.margins.left,
            currentY,
            colWidths[0],
            rowHeight,
            (itemIndex + 1).toString()
          );

          // Imagen
          const imgCell = {
            x: doc.page.margins.left + colWidths[0],
            y: currentY,
            width: colWidths[1],
            height: rowHeight,
          };
          doc
            .rect(imgCell.x, imgCell.y, imgCell.width, imgCell.height)
            .lineWidth(0.5)
            .stroke();

          // Añadir thumbnail si existe
          if (item._thumbImage) {
            try {
              // Tamaño de imagen ajustado para caber en la celda
              const imageSize = Math.min(
                imgCell.width - 10,
                imgCell.height - 10
              );
              doc.image(
                item._thumbImage.buffer,
                imgCell.x + (imgCell.width - imageSize) / 2,
                imgCell.y + (imgCell.height - imageSize) / 2,
                {
                  fit: [imageSize, imageSize],
                  align: "center",
                  valign: "center",
                }
              );
            } catch (error) {
              console.error(
                `Error al insertar thumbnail para item ${item.id}:`,
                error
              );
              // Dibuja un cuadro gris en lugar de la imagen que falló
              doc
                .rect(
                  imgCell.x + (imgCell.width - 30) / 2,
                  imgCell.y + (imgCell.height - 30) / 2,
                  30,
                  30
                )
                .fillAndStroke("#CCCCCC", "#999999");
            }
          }

          // SKU
          drawTableCell(
            doc.page.margins.left + colWidths[0] + colWidths[1],
            currentY,
            colWidths[2],
            rowHeight,
            sku
          );

          // Producto
          const productCell = {
            x:
              doc.page.margins.left +
              colWidths[0] +
              colWidths[1] +
              colWidths[2],
            y: currentY,
            width: colWidths[3],
            height: rowHeight,
          };
          doc
            .rect(
              productCell.x,
              productCell.y,
              productCell.width,
              productCell.height
            )
            .lineWidth(0.5)
            .stroke();
          doc.font("Regular").fillColor("black");
          doc.text(title, productCell.x + 5, productCell.y + 5, {
            width: productCell.width - 10,
          });

          if (colorLabel) {
            doc.font("Regular").fontSize(9).fillColor("#666666");
            doc.text(`Color : ${colorLabel}`, productCell.x + 5, doc.y, {
              width: productCell.width - 10,
            });
          }

          // Cantidad
          drawTableCell(
            doc.page.margins.left +
              colWidths.slice(0, 4).reduce((sum, w) => sum + w, 0),
            currentY,
            colWidths[4],
            rowHeight,
            item.quantity.toString()
          );

          // Peso
          drawTableCell(
            doc.page.margins.left +
              colWidths.slice(0, 5).reduce((sum, w) => sum + w, 0),
            currentY,
            colWidths[5],
            rowHeight,
            weight
          );

          // Actualizar la posición Y para la siguiente fila
          currentY += rowHeight;
        });

        // Pie de página - MOVIDO DEBAJO DE LA TABLA Y A LA IZQUIERDA
        doc.fontSize(10).fillColor("#666666");
        doc.text(
          "Gracias por confiar en MyUrbanScoot!",
          doc.page.margins.left,
          currentY + 20
        );
        doc.text("Código: -5€BABY", doc.page.margins.left, doc.y);
        doc.text(
          "Incidencias: WhatsApp o llamada.",
          doc.page.margins.left,
          doc.y
        );
      });

      // Finalizar el documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

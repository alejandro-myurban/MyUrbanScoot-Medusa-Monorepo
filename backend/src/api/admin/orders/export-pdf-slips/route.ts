// src/api/routes/admin/orders/export-pdf-slips/route.ts
import fetch from "node-fetch"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows"
import type { OrderAddressDTO } from "@medusajs/framework/types"
import { randomBytes } from "crypto"
import pdf from "html-pdf-node"

type ShippingAddress = {
  first_name?: string
  last_name?: string
  address_1?: string
  city?: string
  postal_code?: string
  phone?: string
  email?: string
} & Partial<OrderAddressDTO>

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // 1) IDs desde la query
  const ids: string[] = Array.isArray(req.query.ids)
    ? req.query.ids as string[]
    : req.query.ids
    ? [req.query.ids as string]
    : []

  if (!ids.length) {
    return res
      .status(400)
      .json({ success: false, message: "Se requieren ids de órdenes" })
  }

  try {
    // 2) Traer pedidos
    const { result } = await getOrdersListWorkflow(req.scope).run({
      input: {
        fields: [
          "display_id","created_at","email","total","currency_code",
          "billing_address.first_name","billing_address.last_name","billing_address.address_1","billing_address.city","billing_address.postal_code","billing_address.province","billing_address.phone","billing_address.email",
          "shipping_address.first_name","shipping_address.last_name","shipping_address.address_1","shipping_address.city","shipping_address.postal_code","shipping_address.province","shipping_address.phone",
          "items.id","items.title","items.quantity","items.unit_price","items.variant.sku","items.variant.product.thumbnail","items.weight"
        ],
        variables: { filters: { id: ids } },
      },
    })
    const orders: any[] = Array.isArray(result) ? result : result.rows
    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No se encontraron órdenes" })
    }

    // 3) Pre-cargar logo en Base64
    const logoUrl = "https://myurbanscoot.com/wp-content/uploads/2023/05/cropped-logoH-01-284x62.png"
    let logoDataUri: string | null = null
    try {
      const logoRes = await fetch(logoUrl)
      const logoBuf = await logoRes.buffer()
      const logoMime = logoRes.headers.get("content-type") || "image/png"
      logoDataUri = `data:${logoMime};base64,${logoBuf.toString("base64")}`
    } catch {
      logoDataUri = null
    }

    // 4) Pre-cargar thumbnails de cada item en Base64
    await Promise.all(orders.flatMap(order =>
      order.items.map(async (item: any) => {
        const thumbUrl = item.variant?.product?.thumbnail
        if (!thumbUrl) {
          item._thumb = null
          return
        }
        try {
          const r = await fetch(thumbUrl)
          const buf = await r.buffer()
          const mime = r.headers.get("content-type") || "image/jpeg"
          item._thumb = `data:${mime};base64,${buf.toString("base64")}`
        } catch {
          item._thumb = null
        }
      })
    ))

    // 5) Generar HTML con Data URIs inline
    const html = generatePackingSlipsHTML(orders, logoDataUri)

    // 6) Opciones de PDF
    const options = {
      format: "A4",
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
      printBackground: true,
      preferCSSPageSize: true,
    }

    // 7) Generar PDF
    const file = { content: html }
    const pdfBuffer = await pdf.generatePdf(file, options)

    // 8) Responder
    const shortId = randomBytes(4).toString("hex")
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="packing-slips-${shortId}.pdf"`)
    return res.status(200).end(pdfBuffer)

  } catch (error: any) {
    console.error("Error al exportar PDF:", error)
    return res.status(500).json({
      success: false,
      message: "Error al generar el PDF",
      error: error.message,
    })
  }
}

export const AUTHENTICATE = true

// ----------------------------------------------------------------
// Genera el HTML usando logoDataUri e item._thumb inline
// ----------------------------------------------------------------
function generatePackingSlipsHTML(orders: any[], logoDataUri: string | null): string {
  // HTML y CSS idénticos al tuyo, pero <img src> con Data URIs
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
  `

  const pages = orders.flatMap(order => {
    const b = order.billing_address as ShippingAddress
    const s = order.shipping_address as ShippingAddress
    const date = new Date(order.created_at).toLocaleDateString("es-ES")

    return order.items.map((item: any) => {
      const thumbData = item._thumb || ""
      const sku = item.variant?.sku || ""
      const weight = item.weight ? `${(item.weight/1000).toFixed(2)}kg` : "n/a"
      let title = item.title
      let colorLabel = ""
      if (title.includes("Color : ")) {
        const parts = title.split("Color : ")
        title = parts[0]
        colorLabel = parts[1]
      }

      return `
      <div class="page">
        <div class="header">
          <div class="title"><h1>Hoja de embalaje</h1></div>
          <div class="logo">
            ${logoDataUri ? `<img src="${logoDataUri}" alt="Logo"/>` : ""}
          </div>
        </div>
        <div class="order-details">
          <p><strong>Pedido Nº:</strong> ${order.display_id} &nbsp;&nbsp; <strong>Fecha:</strong> ${date}</p>
        </div>
        <div class="addresses-container">
          <div class="address-column"><div class="address-block">
            <p><strong>Facturación:</strong></p>
            <p>${b.first_name||""} ${b.last_name||""}</p>
            <p>${b.address_1||""}</p>
            <p>${b.postal_code||""} ${b.city||""} ${b.province?`- ${b.province}`:""}</p>
            <p>${b.phone||""}</p>
            <p>${b.email||order.email||""}</p>
          </div></div>
          ${companyInfo}
          <div class="address-column"><div class="address-block">
            <p><strong>Envío:</strong></p>
            <p>${s.first_name||""} ${s.last_name||""}</p>
            <p>${s.address_1||""}</p>
            <p>${s.postal_code||""} ${s.city||""} ${s.province?`- ${s.province}`:""}</p>
            <p>${s.phone||""}</p>
          </div></div>
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
                ${thumbData ? `<img src="${thumbData}" alt=""/>` : ""}
              </td>
              <td>${sku}</td>
              <td>${title}${colorLabel?`<br><small>Color : ${colorLabel}</small>`:""}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">${weight}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>Gracias por confiar en MyUrbanScoot!</p>
          <p>Código: <strong>-5€BABY</strong></p>
          <p>Incidencias: WhatsApp o llamada.</p>
        </div>
      </div>`
    })
  })

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Hoja de embalaje</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body{margin:0;padding:0;font-family:Arial,sans-serif;font-size:11px;line-height:1.4;}
    .page{page-break-after:always;}
    .page:last-child{page-break-after:auto;}
    h1{color:#00AEEF;font-size:24px;margin:0;}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
    .logo img{height:40px;}
    .order-details{margin-bottom:15px;}
    .addresses-container{display:flex;justify-content:space-between;margin-bottom:20px;}
    .address-column{width:48%;}
    .address-block{margin-bottom:20px;}
    .company-info{margin-top:20px;}
    p{margin:2px 0;}
    .items-table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    .items-table th{background-color:#333;color:white;text-align:left;padding:8px 6px;border:1px solid #222;}
    .items-table td{padding:8px 6px;border:1px solid #ddd;vertical-align:middle;}
    .img-cell{text-align:center;width:60px;}
    .img-cell img{max-width:40px;max-height:40px;display:block;margin:0 auto;}
    .text-center{text-align:center;}
    .footer{text-align:center;font-size:10px;color:#666;margin-top:30px;border-top:1px solid #eee;padding-top:10px;}
    small{color:#666;font-size:9px;}
    strong{font-weight:bold;}
  </style>
</head>
<body>
  ${pages.join("")}
</body>
</html>`
}

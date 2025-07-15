import {
  ITaxProvider,
  TaxTypes,
} from "@medusajs/framework/types"

export default class CanaryIslandsTaxProvider implements ITaxProvider {
  static identifier = "canary-tax"

  private readonly PENINSULA_VAT_RATE = 21

  constructor(container: any, options: any) {}

  getIdentifier(): string {
    return CanaryIslandsTaxProvider.identifier
  }

  async getTaxLines(
    itemLines: TaxTypes.ItemTaxCalculationLine[],
    shippingLines: TaxTypes.ShippingTaxCalculationLine[],
    context: TaxTypes.TaxCalculationContext
  ): Promise<(TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[]> {
    const address = context.address // 

    let isCanaryIslands = false

    console.log("🧪 CanaryIslandsTaxProvider llamado");
    console.log("Contexto recibido:", context);


    if (address?.country_code?.toLowerCase() === "es") {
      const province = address.province_code?.toLowerCase() || ""
      const postalCode = parseInt(address.postal_code || "0", 10)

      if (
        province.includes("las palmas") ||
        province.includes("santa cruz de tenerife") ||
        (postalCode >= 35000 && postalCode <= 35999) ||
        (postalCode >= 38000 && postalCode <= 38999)
      ) {
        isCanaryIslands = true
      }
    }

    const rateValue = isCanaryIslands ? 0 : this.PENINSULA_VAT_RATE / 100
    const rateName = isCanaryIslands
      ? "Exento de IVA (Canarias)"
      : `IVA ${this.PENINSULA_VAT_RATE}%`

    const providerId = this.getIdentifier()

    const taxLines: (TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[] = []

    for (const item of itemLines) {
      taxLines.push({
        rate: rateValue,
        name: rateName,
        code: isCanaryIslands ? "EXENTO_CANARIAS" : "IVA_PENINSULA",
        provider_id: providerId,
        line_item_id: item.line_item.id,
      })
    }

    for (const shipping of shippingLines) {
      taxLines.push({
        rate: rateValue,
        name: rateName,
        code: isCanaryIslands ? "EXENTO_CANARIAS" : "IVA_PENINSULA",
        provider_id: providerId,
        shipping_line_id: shipping.shipping_line.id,
      })
    }

    return taxLines
  }
}

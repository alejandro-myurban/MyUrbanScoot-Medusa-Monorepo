import { 
  AbstractFulfillmentProviderService,
} from "@medusajs/framework/utils";
import { 
  ValidateFulfillmentDataContext,
  CalculateShippingOptionPriceDTO,
  CartLineItemDTO, 
} from "@medusajs/framework/types";

type CartLineItemWithVariant = CartLineItemDTO & {
  variant?: { weight?: number };
};

class MiFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "calculated-fulfillment";

  async getFulfillmentOptions() {
    console.log("[calculated-fulfillment] getFulfillmentOptions called");
    return [
      { id: "standard", name: "Standard Shipping" },
      { id: "express", name: "Express Shipping" },
    ];
  }

  async canCalculate(data): Promise<boolean> {
    console.log("[calculated-fulfillment] canCalculate called with:", data);
    return true;
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    console.log("[calculated-fulfillment] validateOption called with:", data);
    const validOptions = ["standard", "express"];
    const isValid = validOptions.includes(data.id as string);
    console.log("[calculated-fulfillment] validateOption result:", isValid);
    return isValid;
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext
  ): Promise<Record<string, unknown>> {
    console.log("[calculated-fulfillment] validateFulfillmentData called with:", { optionData, data, context });
    return data;
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<{
    calculated_amount: number;
    is_calculated_price_tax_inclusive: boolean;
  }> {
    let totalWeight = 0;
    console.log("[calculated-fulfillment] calculatePrice called with:", { optionData, data, context });
    if (context.items && context.items.length > 0) {
      for (const item of context.items) {
        try {
          const response = await fetch(
            `http://localhost:9000/store/products/${item.product_id}?fields=weight`,
            {
              method: "GET",
              headers: {
                "x-publishable-api-key": `pk_14db1a49297371bf3f8d345db0cf016616d4244f1d593db1050907c88333cd21`,
                "Content-Type": "application/json",
              },
            }
          );
          const dataWeight = await response.json();
          const itemWeight = dataWeight.product.weight || 0;
          const weightWithQuantity = itemWeight * (item.quantity as number);
          totalWeight += weightWithQuantity;
          console.log(`[calculated-fulfillment] Producto: ${item.product_title}, Peso unitario: ${itemWeight}, Cantidad: ${item.quantity}, Peso total del artículo: ${weightWithQuantity}`);
        } catch (error) {
          console.error(`[calculated-fulfillment] Error al obtener el peso del producto ${item.product_id}:`, error);
          const itemWithVariant = item as CartLineItemWithVariant;
          const fallbackWeight = itemWithVariant.variant?.weight || 0;
          totalWeight += fallbackWeight * (item.quantity as number);
          console.log(`[calculated-fulfillment] Usando peso alternativo para ${item.product_title}: ${fallbackWeight}`);
        }
      }
      console.log("[calculated-fulfillment] PESO TOTAL DE TODOS LOS ARTÍCULOS:", totalWeight);
    } else {
      console.log("[calculated-fulfillment] No hay artículos en el contexto");
      totalWeight = (
        (context.items as CartLineItemWithVariant[]) || []
      ).reduce((sum, item) => {
        const weightPerUnit = item.variant?.weight ?? 0;
        console.log("[calculated-fulfillment] WEIGHT PER UNIT", weightPerUnit);
        return sum + weightPerUnit * (item.quantity as number);
      }, 0);
      console.log("[calculated-fulfillment] TOTAL WEIGHT (FALLBACK METHOD):", totalWeight);
    }

    let price = 0;
    if (totalWeight <= 1) {
      price = 5.99;
    } else if (totalWeight <= 5) {
      price = 5.99;
    } else {
      price = 5.99;
    }
    console.log("[calculated-fulfillment] PRECIO CALCULADO:", price);

    return {
      calculated_amount: price,
      is_calculated_price_tax_inclusive: true,
    };
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: any[],
    order: any,
    fulfillment: Record<string, unknown>
  ): Promise<any> {
    console.log("[calculated-fulfillment] createFulfillment called with:", { data, items, order, fulfillment });
    try {
      const trackingNumber = `CALC_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const serviceType = data.id === "express" ? "express" : "standard";
      console.log(`[calculated-fulfillment] Fulfillment creado con tracking: ${trackingNumber}, servicio: ${serviceType}`);
      return {
        data: {
          tracking_number: trackingNumber,
          service_type: serviceType,
          carrier: "calculated-fulfillment",
          created_at: new Date().toISOString(),
          estimated_delivery: this.calculateEstimatedDelivery(serviceType),
          calculated_price: data.calculated_amount,
          weight_based: true,
        },
      };
    } catch (error) {
      console.error("[calculated-fulfillment] Error creando fulfillment:", error);
      throw new Error(`Error en createFulfillment: ${error.message}`);
    }
  }

  private calculateEstimatedDelivery(serviceType: string): string {
    const now = new Date();
    const deliveryDays = serviceType === "express" ? 1 : 3;
    const estimatedDate = new Date(now.getTime() + (deliveryDays * 24 * 60 * 60 * 1000));
    return estimatedDate.toISOString().split('T')[0];
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    console.log("[calculated-fulfillment] cancelFulfillment called with:", data);
    const { tracking_number, service_type } = data as {
      tracking_number?: string;
      service_type?: string;
    };
    console.log(`[calculated-fulfillment] Cancelando envío con tracking: ${tracking_number}, servicio: ${service_type}`);
    return {
      cancelled: true,
      cancelled_at: new Date().toISOString(),
      reason: "Cancelled by admin",
    };
  }

  async getFulfillmentDocuments(data: any): Promise<never[]> {
    console.log("[calculated-fulfillment] getFulfillmentDocuments called with:", data);
    return [];
  }

  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<any> {
    console.log("[calculated-fulfillment] createReturnFulfillment called with:", fulfillment);
    const returnTrackingNumber = `RETURN_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    return {
      data: {
        return_tracking_number: returnTrackingNumber,
        return_service: "standard",
        created_at: new Date().toISOString(),
        type: "return",
      },
    };
  }

  async getReturnDocuments(data: any): Promise<never[]> {
    console.log("[calculated-fulfillment] getReturnDocuments called with:", data);
    return [];
  }
}

export default MiFulfillmentProviderService;
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
    return [
      { id: "standard", name: "Standard Shipping" },
      { id: "express", name: "Express Shipping" },
    ];
  }

  async canCalculate(data): Promise<boolean> {
    // we support calculated
    return true;
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    // Validar que la opción sea válida
    const validOptions = ["standard", "express"];
    return validOptions.includes(data.id as string);
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext
  ): Promise<Record<string, unknown>> {
    // if you needed to require e.g. a special pickup point:
    // if (optionData.requires_drop_point && !data.drop_point_id) {
    //   throw new Error("A drop_point_id is required for this option");
    // }
    // here we have nothing extra to check, so pass data straight through:
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

    // Calcular el peso total considerando las cantidades
    if (context.items && context.items.length > 0) {
      // Recorrer todos los artículos
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
          const itemWeight = dataWeight.product.weight || 0; // Si no hay peso, usar 0 como valor predeterminado
          
          // Multiplicar el peso del producto por su cantidad
          const weightWithQuantity = itemWeight * (item.quantity as number);
          
          // Añadir al peso total
          totalWeight += weightWithQuantity;
          
          console.log(`Producto: ${item.product_title}`);
          console.log(`- Peso unitario: ${itemWeight}`);
          console.log(`- Cantidad: ${item.quantity}`);
          console.log(`- Peso total del artículo: ${weightWithQuantity}`);
        } catch (error) {
          console.error(`Error al obtener el peso del producto ${item.product_id}:`, error);
          // Si falla la API, intentar usar el peso de la variante si está disponible
          const itemWithVariant = item as CartLineItemWithVariant;
          const fallbackWeight = itemWithVariant.variant?.weight || 0;
          totalWeight += fallbackWeight * (item.quantity as number);
          console.log(`Usando peso alternativo para ${item.product_title}: ${fallbackWeight}`);
        }
      }
      
      console.log("PESO TOTAL DE TODOS LOS ARTÍCULOS:", totalWeight);
    } else {
      console.log("No hay artículos en el contexto");
      
      // Método alternativo usando las variantes directamente (como fallback)
      totalWeight = (
        (context.items as CartLineItemWithVariant[]) || []
      ).reduce((sum, item) => {
        const weightPerUnit = item.variant?.weight ?? 0;
        console.log("WEIGHT PER UNIT", weightPerUnit);
        return sum + weightPerUnit * (item.quantity as number);
      }, 0);
      
      console.log("TOTAL WEIGHT (FALLBACK METHOD):", totalWeight);
    }

    // Calcula el precio basado en el peso total
    let price = 0;
    if (totalWeight <= 1) {
      price = 5.99;
    } else if (totalWeight <= 5) {
      price = 5.99;
    } else {
      price = 5.99;
    }
    
    console.log("PRECIO CALCULADO:", price);

    return {
      calculated_amount: price,
      is_calculated_price_tax_inclusive: true,
    };
  }

  // *** MÉTODO OBLIGATORIO QUE FALTABA ***
  async createFulfillment(
    data: Record<string, unknown>,
    items: any[],
    order: any,
    fulfillment: Record<string, unknown>
  ): Promise<any> {
    console.log("Creando fulfillment para orden:", {
      orderId: order?.id,
      fulfillmentId: fulfillment.id,
      shippingOption: data
    });

    try {
      // Para un provider calculado, aquí manejarías:
      // 1. Generar número de tracking
      // 2. Notificar al carrier si es necesario
      // 3. Actualizar sistemas externos
      
      const trackingNumber = `CALC_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Determinar el tipo de servicio basado en los datos
      const serviceType = data.id === "express" ? "express" : "standard";
      
      console.log(`Fulfillment creado con tracking: ${trackingNumber}, servicio: ${serviceType}`);

      // Retornar datos que se guardarán en fulfillment.data
      return {
        data: {
          tracking_number: trackingNumber,
          service_type: serviceType,
          carrier: "calculated-fulfillment",
          created_at: new Date().toISOString(),
          estimated_delivery: this.calculateEstimatedDelivery(serviceType),
          // Guardar información del cálculo original si es útil
          calculated_price: data.calculated_amount,
          weight_based: true,
        },
      };
    } catch (error) {
      console.error("Error creando fulfillment:", error);
      throw new Error(`Error en createFulfillment: ${error.message}`);
    }
  }

  // Método auxiliar para calcular entrega estimada
  private calculateEstimatedDelivery(serviceType: string): string {
    const now = new Date();
    const deliveryDays = serviceType === "express" ? 1 : 3;
    const estimatedDate = new Date(now.getTime() + (deliveryDays * 24 * 60 * 60 * 1000));
    return estimatedDate.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  // Método para cancelar fulfillments
  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    console.log("Cancelando fulfillment:", data);
    
    const { tracking_number, service_type } = data as {
      tracking_number?: string;
      service_type?: string;
    };

    // Aquí cancelarías el envío si tienes integración con carrier
    console.log(`Cancelando envío con tracking: ${tracking_number}, servicio: ${service_type}`);

    return {
      cancelled: true,
      cancelled_at: new Date().toISOString(),
      reason: "Cancelled by admin",
    };
  }

  // Método para obtener documentos del fulfillment (etiquetas, etc.)
  async getFulfillmentDocuments(data: any): Promise<never[]> {
    // Para un provider calculado podrías retornar:
    // - Etiquetas de envío generadas
    // - Documentos de tracking
    // - Comprobantes de envío
    return [];
  }

  // Método para devoluciones
  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<any> {
    console.log("Creando fulfillment de devolución:", fulfillment);
    
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

  // Método para obtener documentos de devolución
  async getReturnDocuments(data: any): Promise<never[]> {
    return [];
  }
}

export default MiFulfillmentProviderService;
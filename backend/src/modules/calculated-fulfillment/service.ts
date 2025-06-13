import { 
  AbstractFulfillmentProviderService,
  // you can import the type for clarity 
} from "@medusajs/framework/utils";
import { 
  ValidateFulfillmentDataContext,
  CalculateShippingOptionPriceDTO,
  CartLineItemDTO, 
} from "@medusajs/framework/types";
import { sdk } from "admin/lib/sdk";

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
}

export default MiFulfillmentProviderService;
// src/workflows/add-shipping-method-workaround.ts
import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

type WorkflowInput = {
  cart_id: string;
  option_id: string;
};

// Step para obtener la shipping option directamente
const getShippingOptionDirectly = createStep(
  "get-shipping-option-directly",
  async ({ option_id }, { container }) => {
    console.log("🔍 Buscando shipping option directamente:", option_id);

    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Obtener la shipping option directamente por ID
    const { data: shippingOptions } = await query.graph({
      entity: "shipping_option",
      filters: { id: option_id },
      fields: [
        "id",
        "name",
        "price_type",
        "provider_id",
        "service_zone_id",
        "data",
        "provider.id",
        "provider.is_enabled",
        "prices.*",
      ],
    });

    if (!shippingOptions?.length) {
      throw new Error(`Shipping option ${option_id} not found`);
    }

    const option = shippingOptions[0];
    console.log("✅ Shipping option encontrada:", {
      id: option.id,
      name: option.name,
      provider_id: option.provider_id,
    });

    return new StepResponse(option);
  }
);

// Step para agregar el shipping method directamente
const addShippingMethodDirectly = createStep(
  "add-shipping-method-directly",
  async ({ cart_id, shipping_option, amount }, { container }) => {
    console.log("➕ Agregando shipping method:", {
      cart_id,
      option_id: shipping_option.id,
      amount,
    });

    const cartModule = container.resolve(Modules.CART);

    // Primero eliminar shipping methods existentes
    const cart = await cartModule.retrieveCart(cart_id, {
      relations: ["shipping_methods"],
    });

    if (cart.shipping_methods?.length) {
      await cartModule.deleteShippingMethods(
        cart.shipping_methods.map((sm) => sm.id)
      );
    }

    // Agregar el nuevo shipping method
    //@ts-ignore
    const shippingMethod = await cartModule.addShippingMethods({
      cart_id,
      shipping_option_id: shipping_option.id,
      amount: amount || 0,
      data: shipping_option.data || {},
    });

    console.log("✅ Shipping method agregado:", shippingMethod);

    return new StepResponse(shippingMethod, {
      cart_id,
      shipping_method_id: shippingMethod.id,
    });
  },
  async ({ cart_id, shipping_method_id }, { container }) => {
    // Compensación: eliminar el shipping method si algo falla
    const cartModule = container.resolve(Modules.CART);
    await cartModule.deleteShippingMethods([shipping_method_id]);
  }
);

// Workflow alternativo
export const addShippingMethodWorkaround = createWorkflow(
  "add-shipping-method-workaround",
  (input: WorkflowInput) => {
    // Obtener la shipping option
    //@ts-ignore
    const shippingOption = getShippingOptionDirectly({
      option_id: input.option_id,
    });

    // Calcular el precio (simplificado por ahora)
    const amount =
      shippingOption.price_type === "flat"
        ? shippingOption.prices?.[0]?.amount || 0
        : 0; // Para calculated, necesitarías más lógica

    // Agregar el shipping method
    //@ts-ignore
    const shippingMethod = addShippingMethodDirectly({
      cart_id: input.cart_id,
      shipping_option: shippingOption,
      amount,
    });

    return new WorkflowResponse(shippingMethod);
  }
);

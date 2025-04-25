import {
    type SubscriberConfig,
    type SubscriberArgs,
  } from "@medusajs/framework"
  import { exportProductsWorkflow } from "@medusajs/medusa/core-flows"
  
  export default async function exportProductsWithEuroPrices({
    event: { data },
    container,
  }: SubscriberArgs<{ id: string }>) {
    const { result } = await exportProductsWorkflow(container)
      .run({
        input: {
          select: ["*", "variants.*", "variants.prices.*"],
          // No podemos usar context aquí
        }
      })
  
    console.log(result)
  }
  
  export const config: SubscriberConfig = {
    event: "product.updated",
  }
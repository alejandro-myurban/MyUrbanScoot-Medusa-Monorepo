import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { syncProductsStep, SyncProductsStepInput } from "./steps/sync-products";
import { QueryContext } from "@medusajs/framework/utils";

type SyncProductsWorkflowInput = {
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
};

export const syncProductsWorkflow = createWorkflow(
  "sync-products",
  ({ filters, limit, offset }: SyncProductsWorkflowInput) => {
    // @ts-ignore
    const { data, metadata } = useQueryGraphStep({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "thumbnail",
        "categories.*",
        "variants.id",
        "variants.title",
        "variants.prices.*",
        "variants.calculated_price.*",
      ],
      pagination: {
        take: limit,
        skip: offset,
      },
      filters: {
        // @ts-ignore
        status: "published",
        ...filters,
      },
      context: {
        variants: {
          calculated_price: QueryContext({
            currency_code: "eur", // o la moneda que corresponda
            region_id: "reg_01JSP4QGE8SADHTVCS3M91T6B2", // opcional pero recomendado si lo tienes
          }),
        },
      },
    });

    syncProductsStep({
      products: data,
    } as SyncProductsStepInput);

    return new WorkflowResponse({
      products: data,
      metadata,
    });
  }
);

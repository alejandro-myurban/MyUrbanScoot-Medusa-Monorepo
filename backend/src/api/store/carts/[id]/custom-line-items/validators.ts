// backend/src/api/store/carts/custom-line-items/validators.ts
import { z } from "zod"

export const AddCustomLineItemsSchema = z.object({
  items: z.array(
    z.object({
      variant_id: z.string(),
      quantity: z.number(),
      unit_price: z.number(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
})
// backend/src/api/middlewares.ts
import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { AddCustomLineItemsSchema } from "../api/store/carts/[id]/custom-line-items/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/carts/:id/custom-line-items",
      method: "POST",
      middlewares: [
        validateAndTransformBody(AddCustomLineItemsSchema),
      ],
    },
  ],
})
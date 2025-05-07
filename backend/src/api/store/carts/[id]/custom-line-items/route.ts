// backend/src/api/store/carts/[id]/custom-line-items/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { addCustomToCartWorkflow } from "../../../../../workflows/add-custom-to-cart"

type CustomLineItemsReq = { items: any[] }

export const POST = async (req: MedusaRequest<CustomLineItemsReq>, res: MedusaResponse) => {
  const { id } = req.params
  const { items } = req.validatedBody // <-- datos ya validados

  const { result } = await addCustomToCartWorkflow(req.scope).run({
    input: {
      cart_id: id,
      items,
    },
  })

  res.status(200).json({ cart: result.cart })
}
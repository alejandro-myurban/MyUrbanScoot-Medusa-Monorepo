// src/api/store/cart/[id]/custom-line-items/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { addCustomLineItemIfCustomNameWorkflow } from "../../../../../workflows/custom-name-fee";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: cart_id } = req.params;

  // Aquí defines el variant_id y la cantidad que quieres añadir
  const quantity = 1;

  try {
    const { result } = await addCustomLineItemIfCustomNameWorkflow(
      req.scope
    ).run({
      input: { cart_id, quantity },
    });
    console.log("HOLAAAAAAAAAAAAAAAAAAAAAAAA", cart_id);
    res.status(200).json({ cart: result.cart });
  } catch (error) {
    console.error("Error in POST /cart/:id/custom-line-items", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

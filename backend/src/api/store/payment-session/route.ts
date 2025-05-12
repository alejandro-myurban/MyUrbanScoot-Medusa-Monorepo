// src/api/payment-sessions/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { deletePaymentSessionsWorkflow } from "@medusajs/medusa/core-flows";

export async function DELETE(
  req: MedusaRequest & { body: { ids: string[] } },
  res: MedusaResponse
) {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({
      message: "Payment session IDs are required and must be an array",
    });
  }

  try {
    const { result } = await deletePaymentSessionsWorkflow(req.scope).run({
      input: {
        ids
      },
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

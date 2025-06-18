import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const container = req.scope
    const paymentService = container.resolve("payment")
    
    // Llamar directamente al método listPaymentProviders
    const providers = await paymentService.listPaymentProviders()
    
    res.json({
      success: true,
      debug: {
        totalProviders: providers.length,
        providers: providers.map(p => ({
          id: p.id,
          is_enabled: p.is_enabled,
          // Cualquier otra propiedad útil
        })),
        rawProviders: providers
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}
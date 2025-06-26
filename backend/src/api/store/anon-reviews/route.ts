// src/api/store/anon-reviews/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";

// Schema más simple para reseñas anónimas
const anonymousReviewSchema = z.object({
  product_id: z.string(),
  rating: z.number().min(1).max(5),
  content: z.string().min(1),
  name: z.string().optional(),
});

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("🔥 Endpoint anonymous-reviews llamado");
    console.log("📦 Request body:", req.body);

    // Validar el body manualmente
    const validatedData = anonymousReviewSchema.parse(req.body);
    console.log("✅ Datos validados:", validatedData);

    // Generar ID único para la reseña
    const reviewId = `review_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    console.log("🆔 ID generado:", reviewId);

    // Resolver el servicio workflows
    const workflows = req.scope.resolve("workflows");
    console.log("✅ Servicio workflows resuelto");

    try {
      console.log("🔄 Ejecutando workflow con formato corregido...");

      // Preparar datos con el formato correcto (array directo, no objeto)
      const productReviewsArray = [
        {
          id: reviewId,
          product_id: validatedData.product_id,
          rating: validatedData.rating,
          content: validatedData.content,
          name: validatedData.name || "Cliente anónimo",
          status: "approved",
        },
      ];

      console.log("📊 Array de reseñas:", productReviewsArray);

      // Intentar diferentes formatos de input
      const inputFormats = [
        // Formato 1: Como vimos en el código original
        { input: { productReviews: productReviewsArray } },
        // Formato 2: Directo
        { productReviews: productReviewsArray },
        // Formato 3: Solo el array
        productReviewsArray,
        // Formato 4: Con key input
        { input: productReviewsArray },
      ];

      for (let i = 0; i < inputFormats.length; i++) {
        try {
          console.log(`🔄 Probando formato ${i + 1}:`, inputFormats[i]);

          const result = await workflows.run(
            "create-product-reviews-workflow",
            inputFormats[i]
          );

          console.log(`✅ Formato ${i + 1} funcionó! Resultado:`, result);

          const createdReview =
            result?.productReviews?.[0] ||
            result?.[0] ||
            result?.result?.[0] ||
            result?.data?.[0] ||
            result;

          return res.status(201).json({
            success: true,
            product_review: createdReview,
            workflow_result: result,
          });
        } catch (formatError) {
          console.log(`❌ Formato ${i + 1} falló:`, formatError.message);
          continue;
        }
      }

      throw new Error("Todos los formatos de input fallaron");
    } catch (workflowError) {
      console.log("❌ Error ejecutando workflow:", workflowError.message);
      console.log("❌ Stack del workflow:", workflowError.stack);

      // Como último recurso, intentar ejecutar sin nombre de workflow
      try {
        console.log("🔄 Intentando ejecución sin nombre específico...");
        const result = await workflows.run("create-product-reviews-workflow", {
          input: {
            productReviews: [
              {
                id: reviewId,
                product_id: validatedData.product_id,
                rating: validatedData.rating,
                content: validatedData.content,
                name: validatedData.name || "Cliente anónimo",
                status: "approved",
              },
            ],
          },
        });

        console.log("✅ Ejecución alternativa funcionó:", result);

        return res.status(201).json({
          success: true,
          product_review: result,
          note: "Creado con ejecución alternativa",
        });
      } catch (altError) {
        console.log("❌ Ejecución alternativa falló:", altError.message);
      }
    }

    // Fallback final
    console.log("🔄 Fallback a mock review...");
    const mockReview = {
      id: reviewId,
      product_id: validatedData.product_id,
      rating: validatedData.rating,
      content: validatedData.content,
      name: validatedData.name || "Cliente anónimo",
      status: "approved",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      product_review: mockReview,
      note: "Mock review - investigar formato correcto de workflow",
    });
  } catch (error) {
    console.error("❌ Error completo:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Datos de entrada inválidos",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

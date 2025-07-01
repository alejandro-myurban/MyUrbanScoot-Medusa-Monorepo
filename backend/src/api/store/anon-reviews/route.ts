// src/api/store/anon-reviews/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";

// Schema actualizado para incluir imágenes
const anonymousReviewSchema = z.object({
  product_id: z.string(),
  rating: z.number().min(1).max(5),
  content: z.string().min(1),
  name: z.string().optional(),
  images: z.array(z.string().url()).optional(), // Array de URLs de imágenes
});

// Función para generar IDs al estilo Medusa
function generateMedusaId(): string {
  // Genera un ID similar al formato de Medusa: 26 caracteres alfanuméricos en mayúsculas
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 26; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("🔥 Endpoint anonymous-reviews llamado");
    console.log("📦 Request body:", req.body);

    // Validar el body manualmente
    const validatedData = anonymousReviewSchema.parse(req.body);
    console.log("✅ Datos validados:", validatedData);
    console.log("🖼️ Imágenes recibidas:", validatedData.images);

    // Generar ID único para la reseña siguiendo el patrón del plugin
    const reviewId = `prev_${generateMedusaId()}`;
    console.log("🆔 ID generado:", reviewId);

    // Resolver servicios
    const workflows = req.scope.resolve("workflows");
    const query = req.scope.resolve("query");
    console.log("✅ Servicios resueltos");

    try {
      console.log("🔄 Intentando con imágenes incluidas en el workflow...");

      // INTENTAR INCLUIR IMÁGENES con el formato correcto del plugin
      const productReviewData = {
        id: reviewId,
        name: validatedData.name || "Cliente anónimo",
        email: null,
        product_id: validatedData.product_id,
        rating: validatedData.rating,
        content: validatedData.content,
        order_id: null,
        order_line_item_id: null,
        status: "approved",
        // Formato de imágenes que podría esperar el plugin
        images:
          validatedData.images?.map((imageUrl, index) => ({
            id: `pri_${generateMedusaId()}`,
            url: imageUrl,
            alt_text: `Review image ${index + 1}`,
            order: index,
          })) || [],
      };

      console.log("📊 Datos completos incluyendo imágenes:", productReviewData);

      const result = await workflows.run("create-product-reviews-workflow", {
        input: {
          productReviews: [productReviewData],
        },
      });

      const createdReview = result.result?.[0];
      console.log("✅ Workflow ejecutado - revisando resultado...");
      console.log("📋 Reseña creada:", createdReview?.id);
      console.log(
        "🖼️ Imágenes en resultado del workflow:",
        createdReview?.images?.length || 0
      );
      console.log(
        "📋 Detalle de imágenes del workflow:",
        JSON.stringify(createdReview?.images, null, 2)
      );

      // IMPORTANTE: Si el workflow ya creó las imágenes, NO ejecutar código manual
      if (createdReview?.images && createdReview.images.length > 0) {
        console.log("✅ El workflow ya procesó las imágenes correctamente");

        // Obtener la reseña completa final
        try {
          const reviewWithImages = await query.graph({
            entity: "product_review",
            fields: [
              "id",
              "name",
              "email",
              "rating",
              "content",
              "product_id",
              "status",
              "created_at",
              "updated_at",
              "images.*",
            ],
            filters: { id: createdReview.id },
          });

          const finalReview = reviewWithImages.data?.[0];
          console.log("✅ Reseña final desde BD:", {
            id: finalReview?.id,
            images_count: finalReview?.images?.length || 0,
          });
          console.log(
            "📋 Imágenes finales desde BD:",
            JSON.stringify(finalReview?.images, null, 2)
          );

          // SOLUCIÓN TEMPORAL: Eliminar imágenes duplicadas
          if (finalReview?.images && finalReview.images.length > 0) {
            console.log("🔧 Aplicando filtro de duplicados...");

            // Agrupar por URL para detectar duplicados
            const imagesByUrl = finalReview.images.reduce((acc, img) => {
              if (!acc[img.url]) {
                acc[img.url] = [];
              }
              acc[img.url].push(img);
              return acc;
            }, {});

            // Para cada URL, quedarse solo con la primera imagen
            const uniqueImages = Object.values(imagesByUrl).map(
              (imagesGroup) => imagesGroup[0]
            );

            console.log(
              `🔧 Duplicados filtrados: ${finalReview.images.length} → ${uniqueImages.length}`
            );

            // Actualizar la reseña con imágenes únicas
            finalReview.images = uniqueImages;
          }

          return res.status(201).json({
            success: true,
            product_review: finalReview || createdReview,
            images_sent: validatedData.images?.length || 0,
            images_created: finalReview?.images?.length || 0,
            workflow_result: createdReview,
            debug_info: {
              workflow_images: createdReview?.images?.length || 0,
              final_images: finalReview?.images?.length || 0,
              images_match:
                (createdReview?.images?.length || 0) ===
                (finalReview?.images?.length || 0),
            },
          });
        } catch (fetchError) {
          console.log("❌ Error obteniendo reseña final:", fetchError.message);

          return res.status(201).json({
            success: true,
            product_review: createdReview,
            images_sent: validatedData.images?.length || 0,
            images_created: createdReview?.images?.length || 0,
            note: "Workflow procesó imágenes pero error al verificar BD",
          });
        }
      }

      // Si las imágenes no se crearon en el workflow, intentar método alternativo
      else if (validatedData.images?.length > 0) {
        console.log(
          "⚠️ Workflow NO procesó imágenes - saltando método manual para evitar duplicados"
        );
        console.log("🔄 Solo obteniendo reseña desde BD...");

        try {
          const reviewWithImages = await query.graph({
            entity: "product_review",
            fields: [
              "id",
              "name",
              "email",
              "rating",
              "content",
              "product_id",
              "status",
              "created_at",
              "updated_at",
              "images.*",
            ],
            filters: { id: createdReview.id },
          });

          const finalReview = reviewWithImages.data?.[0];
          console.log("✅ Reseña desde BD (sin método manual):", {
            id: finalReview?.id,
            images_count: finalReview?.images?.length || 0,
          });

          return res.status(201).json({
            success: true,
            product_review: finalReview || createdReview,
            images_sent: validatedData.images?.length || 0,
            images_created: finalReview?.images?.length || 0,
            workflow_result: createdReview,
            note: "Workflow no procesó imágenes, método manual deshabilitado para evitar duplicados",
          });
        } catch (fetchError) {
          console.log("❌ Error obteniendo reseña final:", fetchError.message);

          return res.status(201).json({
            success: true,
            product_review: createdReview,
            images_sent: validatedData.images?.length || 0,
            images_created: "unknown",
            note: "Sin método manual - verificar por qué el workflow no procesó imágenes",
          });
        }
      }

      // ✅ NUEVO: Caso cuando NO hay imágenes para procesar
      else {
        console.log("📝 Reseña creada sin imágenes");
        
        try {
          // Obtener la reseña desde BD para asegurar datos completos
          const reviewWithoutImages = await query.graph({
            entity: "product_review",
            fields: [
              "id",
              "name", 
              "email",
              "rating",
              "content",
              "product_id",
              "status",
              "created_at",
              "updated_at",
              "images.*",
            ],
            filters: { id: createdReview.id },
          });

          const finalReview = reviewWithoutImages.data?.[0];
          console.log("✅ Reseña sin imágenes desde BD:", {
            id: finalReview?.id,
            images_count: finalReview?.images?.length || 0,
          });

          return res.status(201).json({
            success: true,
            product_review: finalReview || createdReview,
            images_sent: 0,
            images_created: finalReview?.images?.length || 0,
            workflow_result: createdReview,
            note: "Reseña creada exitosamente sin imágenes"
          });
          
        } catch (fetchError) {
          console.log("❌ Error obteniendo reseña final sin imágenes:", fetchError.message);
          
          // Fallback: retornar directamente el resultado del workflow
          return res.status(201).json({
            success: true,
            product_review: createdReview,
            images_sent: 0,
            images_created: createdReview?.images?.length || 0,
            note: "Reseña creada sin imágenes (usando resultado directo del workflow)"
          });
        }
      }

    } catch (workflowError) {
      console.log("❌ Error ejecutando workflow:", workflowError.message);  
      console.log("❌ Stack del workflow:", workflowError.stack);
      throw workflowError;
    }
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
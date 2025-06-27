// src/api/store/debug-reviews/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("🔍 Debug: Investigando estructura de reseñas");

    const query = req.scope.resolve("query");
    
    type DebugResults = {
      all_reviews?: any;
      all_images?: any;
      reviews_with_images_join?: { success: boolean; count: number; samples: any[] } | { error: string };
      paco_reviews?: any;
      module_info?: any;
      non_null_images?: any;
      [key: string]: any;
    };
    const results: DebugResults = {};

    // 1. Buscar TODAS las reseñas
    try {
      const allReviews = await query.graph({
        entity: "product_review",
        fields: ["*"],
        pagination: { take: 5, order: { created_at: "DESC" } }
      });
      
      results["all_reviews"] = {
        success: true,
        count: allReviews.data?.length || 0,
        samples: allReviews.data || []
      };
      console.log("✅ Reseñas encontradas:", allReviews.data?.length);
    } catch (error) {
      results["all_reviews"] = { error: error.message };
    }

    // 2. Buscar TODAS las imágenes de reseñas
    try {
      const allImages = await query.graph({
        entity: "product_review_image", 
        fields: ["*"],
        pagination: { take: 10 }
      });
      
      results["all_images"] = {
        success: true,
        count: allImages.data?.length || 0,
        samples: allImages.data || []
      };
      console.log("✅ Imágenes encontradas:", allImages.data?.length);
    } catch (error) {
      results["all_images"] = { error: error.message };
    }

    // 3. Intentar reseñas CON imágenes usando JOIN
    try {
      const reviewsWithImages = await query.graph({
        entity: "product_review",
        fields: [
          "id",
          "name", 
          "rating",
          "content",
          "product_id",
          "created_at",
          "images.*" // JOIN con imágenes
        ],
        pagination: { take: 5, order: { created_at: "DESC" } }
      });
      
      results["reviews_with_images_join"] = {
        success: true,
        count: reviewsWithImages.data?.length || 0,
        samples: reviewsWithImages.data || []
      };
      console.log("✅ Reseñas con JOIN de imágenes:", reviewsWithImages.data?.length);
    } catch (error) {
      results["reviews_with_images_join"] = { error: error.message };
    }

    // 4. Buscar específicamente la reseña de Paco
    try {
      const pacoReviews = await query.graph({
        entity: "product_review",
        fields: [
          "id",
          "name",
          "rating", 
          "content",
          "product_id",
          "created_at",
          "images.*"
        ],
        filters: {
          name: { $ilike: "%Paco%" }
        }
      });
      
      results["paco_reviews"] = {
        success: true,
        count: pacoReviews.data?.length || 0,
        data: pacoReviews.data || []
      };
      console.log("✅ Reseñas de Paco:", pacoReviews.data?.length);
    } catch (error) {
      results["paco_reviews"] = { error: error.message };
    }

    // 5. Intentar obtener metadatos del modelo
    try {
      const moduleService = req.scope.resolve("moduleService");
      // Intentar obtener información sobre las entidades disponibles
      results["module_info"] = "Module service disponible";
    } catch (error) {
      results["module_info"] = { error: error.message };
    }

    // 6. Verificar si hay alguna imagen huérfana (sin reseña asociada)
    try {
      const orphanImages = await query.graph({
        entity: "product_review_image",
        fields: ["*"],
        filters: {
          product_review_id: { $not: null }
        }
      });
      
      results["non_null_images"] = {
        success: true,
        count: orphanImages.data?.length || 0,
        samples: orphanImages.data || []
      };
    } catch (error) {
      results["non_null_images"] = { error: error.message };
    }

    return res.status(200).json({
      debug_info: results,
      timestamp: new Date().toISOString(),
      summary: {
        total_reviews: results.all_reviews?.count || 0,
        total_images: results.all_images?.count || 0,
        reviews_with_images: (results.reviews_with_images_join && "samples" in results.reviews_with_images_join && Array.isArray(results.reviews_with_images_join.samples)
          ? results.reviews_with_images_join.samples.filter(r => r.images?.length > 0).length
          : 0)
      }
    });

  } catch (error) {
    console.error("❌ Error en debug:", error);
    
    return res.status(500).json({
      error: "Error en debug",
      details: error.message
    });
  }
};
import {
  MedusaPluginsSDK,
  StoreListProductReviewsQuery,
  StoreListProductReviewStatsQuery,
  StoreUpsertProductReviewsDTO
} from "@lambdacurry/medusa-plugins-sdk";

// Initialize the SDK
export const sdk = new MedusaPluginsSDK({
  baseUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY,
});


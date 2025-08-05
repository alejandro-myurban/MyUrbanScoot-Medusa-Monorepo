import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { loadEnv, Modules, defineConfig } from "@medusajs/utils";
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
} from "lib/constants";

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
    },
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      resolve: "./src/modules/algolia",
      options: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY,
        productIndexName: process.env.ALGOLIA_PRODUCT_INDEX_NAME,
      },
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          // otros providers...
          {
            resolve: "./src/modules/calculated-fulfillment",
            id: "calculated-fulfillment",
            options: {
              // opciones si necesitas
            },
          },
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
            options: {
              // opciones...
            },
          },
          {
            resolve: "@medusajs/medusa/auth-google",
            id: "google",
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl: process.env.GOOGLE_CALLBACK_URL,
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/loyalty",
    },
    {
      resolve: "./src/modules/financing_data",
    },
    {
      resolve: "./src/modules/blog",
    },
    {
      resolve: "./src/modules/document-verification",
      key: "documentVerificationModuleService",
    },
    {
      key: Modules.FILE,
      resolve: "@medusajs/file",
      options: {
        providers: [
          ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY
            ? [
                {
                  resolve: "./src/modules/minio-file",
                  id: "minio",
                  options: {
                    endPoint: MINIO_ENDPOINT,
                    accessKey: MINIO_ACCESS_KEY,
                    secretKey: MINIO_SECRET_KEY,
                    bucket: MINIO_BUCKET, // Optional, default: medusa-media
                  },
                },
              ]
            : [
                {
                  resolve: "@medusajs/file-local",
                  id: "local",
                  options: {
                    upload_dir: "static",
                    backend_url: `${BACKEND_URL}/static`,
                  },
                },
              ]),
        ],
      },
    },
    ...(REDIS_URL
      ? [
          {
            key: Modules.EVENT_BUS,
            resolve: "@medusajs/event-bus-redis",
            options: {
              redisUrl: REDIS_URL,
            },
          },
          {
            key: Modules.WORKFLOW_ENGINE,
            resolve: "@medusajs/workflow-engine-redis",
            options: {
              redis: {
                url: REDIS_URL,
              },
            },
          },
        ]
      : []),
    ...((SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) ||
    (RESEND_API_KEY && RESEND_FROM_EMAIL)
      ? [
          {
            key: Modules.NOTIFICATION,
            resolve: "@medusajs/notification",
            options: {
              providers: [
                ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL
                  ? [
                      {
                        resolve: "@medusajs/notification-sendgrid",
                        id: "sendgrid",
                        options: {
                          channels: ["email"],
                          api_key: SENDGRID_API_KEY,
                          from: SENDGRID_FROM_EMAIL,
                          capture: true,
                        },
                      },
                    ]
                  : []),
                ...(RESEND_API_KEY && RESEND_FROM_EMAIL
                  ? [
                      {
                        resolve: "./src/modules/email-notifications",
                        id: "resend",
                        options: {
                          channels: ["email"],
                          api_key: RESEND_API_KEY,
                          from: RESEND_FROM_EMAIL,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ]
      : []),
    {
      key: Modules.PAYMENT,
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          // Stripe (si está configurado)
          ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET
            ? [
                {
                  resolve: "@medusajs/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: STRIPE_API_KEY,
                    webhookSecret: STRIPE_WEBHOOK_SECRET,
                    capture: true,
                  },
                },
              ]
            : []),

          // PayPal (SIEMPRE, no condicionado)
          {
            resolve: "@rsc-labs/medusa-paypal-payment/providers/paypal-payment",
            id: "paypal-payment",
            options: {
              oAuthClientId: process.env.PAYPAL_CLIENT_ID,
              oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
              environment: process.env.PAYPAL_ENVIRONMENT,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/tax",
      options: {
        providers: [
          {
            resolve: "./src/modules/canary-tax",
            id: "canary-tax",
          },
        ],
      },
    },
  ],
  plugins: [
    {
      resolve: "@rsc-labs/medusa-paypal-payment",
      options: {
        oAuthClientId: process.env.PAYPAL_CLIENT_ID,
        oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
        environment: process.env.PAYPAL_ENVIRONMENT,
      },
    },
    {
      resolve: `medusa-plugin-tolgee`,
      options: {
        baseURL: process.env.TOLGEE_API_URL,
        apiKey: process.env.TOLGEE_API_KEY,
        projectId: "2",
        requestDelay: 100, // ms entre requests
        maxConcurrentRequests: 5,
        keys: {
          // Optional
          product: ["title", "description"],
        },
      },
    },
    {
      resolve: "medusa-variant-images",
      options: {},
    },
    {
      resolve: "@lambdacurry/medusa-product-reviews",
      options: {
        defaultReviewStatus: "approved", // OPTIONAL, default is 'approved'
      },
    },
  ],
};

// 🔍 DEBUG: Verificar configuración antes de export
console.log("🔧 PayPal provider config:", {
  resolve: "@rsc-labs/medusa-paypal-payment/providers/paypal-payment",
  id: "paypal-payment",
  hasOptions: !!(process.env.PAYPAL_CLIENT_ID || "AYej1..."),
});

console.log(
  "🔧 Payment module config:",
  JSON.stringify(
    medusaConfig.modules.find((m) => m.key === "payment"),
    null,
    2
  )
);
const fulfillmentModule = medusaConfig.modules.find(
  (m) => m.resolve === "@medusajs/medusa/fulfillment"
);

if (!fulfillmentModule) {
  console.warn("⚠️ No se encontró el módulo de fulfillment.");
} else {
  console.log("📦 Fulfillment module encontrado:", fulfillmentModule);

  if (
    fulfillmentModule.options &&
    Array.isArray(fulfillmentModule.options.providers)
  ) {
    fulfillmentModule.options.providers.forEach((provider, idx) => {
      console.log(`📦 Fulfillment provider [${idx}]:`, provider);
    });
  } else {
    console.warn("⚠️ Fulfillment module no tiene 'options.providers' definido como array.");
  }
}

console.log("📦 Dump completo de config:");
console.log(JSON.stringify(medusaConfig, null, 2));

export default defineConfig(medusaConfig);

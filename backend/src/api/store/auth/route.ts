import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { decode, JwtPayload } from "jsonwebtoken";

type TokenOptions = {
  actor_id?: string;
  actor_type?: string;
  auth_identity_id?: string;
  app_metadata?: Record<string, any>;
};

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const token = req.get("Authorization")?.replace("Bearer ", "").trim();

  if (!token) {
    res.status(401).json({ error: "No authorization token provided" });
    return;
  }

  try {
    const decoded = decode(token) as TokenOptions;
    const authId = decoded.auth_identity_id;

    if (!authId) {
      res
        .status(400)
        .json({ error: "Invalid token: no auth_identity_id found" });
      return;
    }

    const authModuleService = req.scope.resolve(Modules.AUTH);

    // Get all provider identities and find the one matching our auth_identity_id
    const identities = await authModuleService.listProviderIdentities();
    const identity = identities.find(
      (iden) => iden.auth_identity_id === authId
    );

    if (identity && identity.user_metadata) {
      res.json(identity.user_metadata);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("Error fetching user metadata:", error);
    res.status(500).json({ error: "Failed to fetch user metadata" });
  }
}

import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { BLOG_MODULE } from "modules/blog";
import BlogModuleService from "modules/blog/service";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE);
  const posts = await blogModuleService.listPosts(
    { slug: req.params.slug },
    { relations: ["category"] }
  );
  res.json({ posts });
};

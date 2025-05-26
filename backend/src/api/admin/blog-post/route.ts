import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import BlogModuleService from "../../../modules/blog/service";
import { BLOG_MODULE } from "../../../modules/blog";



export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE);
  const post = await blogModuleService.createPosts(req.body);
  res.json({ post });
};


export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE);
  const post = await blogModuleService.listPosts(req.body);
  res.json({ post });
};

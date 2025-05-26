import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BlogModuleService from "../../../modules/blog/service"
import { BLOG_MODULE } from "../../../modules/blog"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const category = await blogModuleService.createBlogCategories(req.body)
  res.json({ category })
}

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const categories = await blogModuleService.listBlogCategories()
  res.json({ categories })
}


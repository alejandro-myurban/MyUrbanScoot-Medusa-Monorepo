import { MedusaService } from "@medusajs/framework/utils"
import Post from "./models/post"
import Comment from "./models/comment"
import BlogCategory from "./models/blog-category"

class BlogModuleService extends MedusaService({
  Post,
  Comment,
  BlogCategory,
}) {
  // Aquí puedes añadir métodos personalizados si lo necesitas
}

export default BlogModuleService
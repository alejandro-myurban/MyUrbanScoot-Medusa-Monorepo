import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { BLOG_MODULE } from "modules/blog";
import BlogModuleService from "modules/blog/service";

interface PostRequestBody {
  author_name: string;
  title: string;
  slug: string;
  content: string;
  category_id: string;
  status: "draft" | "published" | "private";
  extract?: string;
  image?: string;
  published_at?: Date;
}

export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const postId = req.params.id;
  const { author_name, title, slug, content, category_id, status, image, extract, published_at } =
    req.body as PostRequestBody;

  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE);
  const post = await blogModuleService.updatePosts({
    id: postId,
    author_name,
    title,
    slug,
    content,
    category_id,
    status,
    image,
    extract,
    published_at
  });

  return res.json({ post });
};

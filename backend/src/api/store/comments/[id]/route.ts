import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { BLOG_MODULE } from "modules/blog";
import BlogModuleService from "modules/blog/service";

interface CreateCommentRequest {
  author_name: string;
  content: string;
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const postId = req.params.id;
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE);
  const comment = await blogModuleService.listComments({
    post: postId,
  });
  res.status(201).json({ comment });
};

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const postId = req.params.id;
  const { author_name, content } = req.body as CreateCommentRequest;
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE);
  const comment = await blogModuleService.createComments({
    post: postId,
    author_name,
    content,
  });
  res.status(201).json({ comment });
};

import { model } from "@medusajs/framework/utils";
import Post from "./post";

const BlogCategory = model.define("blog_category", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  posts: model.hasMany(() => Post, { mappedBy: "category" })
});

export default BlogCategory;

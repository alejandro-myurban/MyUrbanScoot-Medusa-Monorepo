import { model } from "@medusajs/framework/utils";
import Comment from "./comment";
import BlogCategory from "./blog-category";

const Post = model.define("post", {
  id: model.id().primaryKey(),
  author_name: model.text(),
  title: model.text(),
  slug: model.text().unique(),
  published_at: model.dateTime(),
  content: model.text(),
  status: model.enum(["draft", "private", "published"]),
  category: model.belongsTo(() => BlogCategory, { mappedBy: "posts" }),
  comments: model.hasMany(() => Comment),
  image: model.text().nullable(), 
  extract: model.text().nullable(), 
  // created_at, updated_at se agregan automáticamente
});

export default Post;

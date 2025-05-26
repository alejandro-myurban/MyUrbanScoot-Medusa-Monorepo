import { model } from "@medusajs/framework/utils"
import Post from "./post"

const Comment = model.define("comment", {
  id: model.id().primaryKey(),
  post: model.belongsTo(() => Post, { mappedBy: "comments" }), // Relación con el post
  author_name: model.text(),
  content: model.text(),
 
})

export default Comment
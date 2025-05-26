import BlogModule from "../modules/blog"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  { linkable: BlogModule.linkable.post, isList: true },
  { linkable: ProductModule.linkable.product, isList: true }
)
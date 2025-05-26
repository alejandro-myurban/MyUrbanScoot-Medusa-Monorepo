import { Module } from "@medusajs/framework/utils"
import BlogModuleService from "../blog/service"

export const BLOG_MODULE = "blog"

export default Module(BLOG_MODULE, {
  service: BlogModuleService,
})
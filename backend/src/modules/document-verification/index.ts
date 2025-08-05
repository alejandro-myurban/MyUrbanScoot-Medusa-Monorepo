import { Module } from "@medusajs/framework/utils"
import { DocumentVerificationModuleService } from "./service"

export const DOCUMENT_VERIFICATION_MODULE = "documentVerificationModuleService"

export default Module(DOCUMENT_VERIFICATION_MODULE, {
  service: DocumentVerificationModuleService,
})

export * from "./service"
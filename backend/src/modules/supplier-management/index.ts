import { Module } from "@medusajs/framework/utils";
import SupplierManagementModuleService from "./service";

export const SUPPLIER_MODULE = "supplier_management";

export default Module(SUPPLIER_MODULE, {
  service: SupplierManagementModuleService,
});
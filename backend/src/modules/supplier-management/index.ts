import { Module, Modules } from "@medusajs/framework/utils";
import SupplierManagementModuleService from "./service";

export const SUPPLIER_MODULE = "supplier_management";

export default Module(SUPPLIER_MODULE, {
  service: SupplierManagementModuleService,
  //@ts-ignore

  dependencies: [Modules.INVENTORY, Modules.PRODUCT, Modules.STOCK_LOCATION],
});

import { Module } from "@medusajs/framework/utils";
import FinancingModuleService from "./service";

export const FINANCING_MODULE = "financing_data";

export default Module(FINANCING_MODULE, {
  service: FinancingModuleService,
});
    
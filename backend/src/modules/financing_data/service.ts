import { MedusaService } from "@medusajs/framework/utils";
import FinancingData from "./models/financing-data";

class FinancingModuleService extends MedusaService({
  FinancingData,
}) {}

export default FinancingModuleService;

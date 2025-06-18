import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "../../../modules/financing_data";
import FinancingModuleService from "../../../modules/financing_data/service";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const financingDataModule: FinancingModuleService = req.scope.resolve(FINANCING_MODULE);
    
    //@ts-ignore
    const financingData = await financingDataModule.listFinancingData();
    
    res.status(200).json({
      financing_data: financingData,
      count: financingData.length
    });
  } catch (error) {
    console.error("Error fetching financing data:", error);
    res.status(500).json({
      message: "Error fetching financing data",
      error: error.message
    });
  }
};
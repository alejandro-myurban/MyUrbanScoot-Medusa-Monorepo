import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "modules/financing_data";
import FinancingModuleService from "modules/financing_data/service";


type FinancingRequestData = {
  email: string;
  phone: string;
  productName: string; 
  selectedMonths: number; 
  price: number;
  requestDate: string; 
};

export const POST = async (
  req: MedusaRequest<FinancingRequestData>,
  res: MedusaResponse
) => {
  const requestData = req.body;


  //@ts-ignore
  const requestedAt = requestData.requested_at ? new Date(requestData.requested_at) : new Date();
  
  // Mapear los datos del frontend al formato del modelo
  const financingData = {
    name: "Cliente Test", 
    email: requestData.email,
    phone: requestData.phone,
    product: requestData.productName, 
    months: requestData.selectedMonths,
    price: requestData.price,
    requested_at: requestedAt
  };


  const financingDataModule: FinancingModuleService = req.scope.resolve(FINANCING_MODULE);
  
  try {
    //@ts-ignore
    const post = await financingDataModule.createFinancingData(financingData);
    
    console.log("Datos guardados:", financingData);
    
    res.status(201).json({
      message: "Financing data saved successfully",
      data: post
    });
  } catch (error) {
    console.error("Error saving financing data:", error);
    res.status(500).json({
      message: "Error saving financing data",
      error: error.message
    });
  }
};
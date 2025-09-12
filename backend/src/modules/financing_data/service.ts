import { MedusaService } from "@medusajs/framework/utils";
import FinancingData from "./models/financing-data";
import type { 
  FinancingDataBase, 
  UpdateFinancingDataInput, 
  CreateFinancingDataInput 
} from "./types";

class FinancingModuleService extends MedusaService({
  FinancingData,
}) {
  // Método tipado para actualizar datos de financiación
  async updateFinancingDataTyped(input: UpdateFinancingDataInput): Promise<FinancingDataBase> {
    const { id, ...updateData } = input;
    
    // @ts-ignore - MedusaService update method
    return await super.updateFinancingData({
      id,
      ...updateData,
    });
  }

  // Método tipado para crear datos de financiación
  async createFinancingDataTyped(input: CreateFinancingDataInput): Promise<FinancingDataBase> {
    // @ts-ignore - MedusaService create method
    return await super.createFinancingData(input);
  }

  // Método tipado para obtener datos de financiación
  async getFinancingDataById(id: string): Promise<FinancingDataBase | null> {
    // @ts-ignore - MedusaService list method
    const results = await super.listFinancingData({ id });
    return results?.[0] || null;
  }

  // Método tipado para listar datos de financiación
  async listFinancingDataTyped(filters?: Partial<FinancingDataBase>): Promise<FinancingDataBase[]> {
    // @ts-ignore - MedusaService list method
    return await super.listFinancingData(filters);
  }
}

export default FinancingModuleService;

import { model } from "@medusajs/framework/utils"

const FinancingData = model.define("financing_data", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text(),
  product: model.text(), 
  months: model.number(), 
  price: model.number(), 
  requested_at: model.dateTime() 
})

export default FinancingData
import { model } from "@medusajs/framework/utils"
import { Workshop } from "./workshop"

// Define los estados de la cita para mayor claridad
export const AppointmentState = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELED: "canceled",
  COMPLETED: "completed",
}

export const Appointment = model.define("appointment", {
  id: model.id().primaryKey(),
  customer_name: model.text(),
  customer_phone: model.text(),
  description: model.text().nullable(),
  start_time: model.dateTime().index(),
  end_time: model.dateTime().index(),
  workshop: model.belongsTo(() => Workshop),
  state: model
    .enum(Object.values(AppointmentState))
    .default(AppointmentState.PENDING),
  completed: model.boolean().default(false),
}).indexes([
  {
    on: ["workshop_id", "start_time"],
    unique: true,
    where: { state: AppointmentState.CONFIRMED },
  },
])
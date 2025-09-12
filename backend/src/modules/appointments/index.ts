// backend/src/modules/appointments/index.ts
import { Module } from "@medusajs/framework/utils"
import AppointmentsModuleService from "./service"

export const APPOINTMENTS_MODULE = "appointments"

export default Module(APPOINTMENTS_MODULE, {
  service: AppointmentsModuleService,
})

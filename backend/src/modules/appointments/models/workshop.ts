// src/modules/appointments/models/workshop.ts
import { model } from "@medusajs/framework/utils"

export const Workshop = model.define("workshop", {
  id: model.id().primaryKey(),
  name: model.text(),                     // p.ej. "MyUrbanScoot 3.0 Barcelona"
  address: model.text(),                  // dirección
  phone: model.text(),                    // teléfono
  timezone: model.text().nullable(),      // opcional
  // Horarios base (JSON) para poder representar tramos como 10-14 y 17-20, y sábados 11-14
  opening_hours: model.json(),            // { mon_fri: [{ start:"10:00", end:"14:00" }, { start:"17:00", end:"20:00" }], sat:[{ start:"11:00", end:"14:00" }], sun:[] }
})
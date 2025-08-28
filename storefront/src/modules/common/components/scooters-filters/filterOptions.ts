// filterOptions.ts
import { TFunction } from "i18next"

export const getFilterOptions = (t: TFunction) => ({
  dgt: [t("filters.dgt.options.dgt"), t("filters.dgt.options.noDgt")],
  motorType: [t("filters.motorType.options.single"), t("filters.motorType.options.dual")],
  hydraulicBrakes: [t("filters.hydraulicBrakes.options.yes"), t("filters.hydraulicBrakes.options.no")],
  tireSizes: ["10\"x3", "10\"x2,75-6,5", "8,5\"x3"],
  gripTypes: ["offroad (Taco)", "smooth", "mixed"],
  tireTypes: ["Tubeless", "Tube", "Solid"],
})

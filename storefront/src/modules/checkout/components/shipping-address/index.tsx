import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { useTranslation } from "react-i18next"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const { t } = useTranslation()
  const countriesInRegion = useMemo(() => {
    const countries = cart?.region?.countries?.map((c) => c.iso_2) || []

    // Ordenar para que "es" aparezca primero
    return countries.sort((a, b) => {
      if (a === "es") return -1
      if (b === "es") return 1
      return 0
    })
  }, [cart?.region])

  console.log("REGIONES", countriesInRegion)

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  // ✅ INICIALIZACIÓN MEJORADA - Solo una vez
  useEffect(() => {
    const initializeFormData = () => {
      const initialData: Record<string, any> = {}

      // Inicializar con datos del cart si existen
      if (cart?.shipping_address) {
        initialData["shipping_address.first_name"] =
          cart.shipping_address.first_name || ""
        initialData["shipping_address.last_name"] =
          cart.shipping_address.last_name || ""
        initialData["shipping_address.address_1"] =
          cart.shipping_address.address_1 || ""
        initialData["shipping_address.company"] =
          cart.shipping_address.company || ""
        initialData["shipping_address.postal_code"] =
          cart.shipping_address.postal_code || ""
        initialData["shipping_address.city"] = cart.shipping_address.city || ""
        initialData["shipping_address.country_code"] =
          cart.shipping_address.country_code || ""
        initialData["shipping_address.province"] =
          cart.shipping_address.province || ""
        initialData["shipping_address.phone"] =
          cart.shipping_address.phone || ""
      } else {
        // Valores por defecto si no hay datos del cart
        initialData["shipping_address.first_name"] = ""
        initialData["shipping_address.last_name"] = ""
        initialData["shipping_address.address_1"] = ""
        initialData["shipping_address.company"] = ""
        initialData["shipping_address.postal_code"] = ""
        initialData["shipping_address.city"] = ""
        initialData["shipping_address.country_code"] =
          countriesInRegion[0] || ""
        initialData["shipping_address.province"] = ""
        initialData["shipping_address.phone"] = ""
      }

      // Email del cart o del customer
      initialData.email = cart?.email || customer?.email || ""

      console.log("🔄 Inicializando formulario con:", initialData)
      setFormData(initialData)
    }

    // ✅ CAMBIO: Solo inicializar si formData está completamente vacío
    if (Object.keys(formData).length === 0 || !formData.email) {
      initializeFormData()
    }
  }, [cart?.id, customer?.id, countriesInRegion]) // ✅ Dependencias más específicas

  // ✅ SINCRONIZACIÓN CON DATOS DEL SERVIDOR (sin sobrescribir lo que el usuario escribe)
  useEffect(() => {
    if (cart?.shipping_address && Object.keys(formData).length > 0) {
      // Solo actualizar campos que están vacíos para no sobrescribir lo que el usuario escribe
      setFormData((prev) => {
        const updated = { ...prev }
        let hasChanges = false

        // Solo actualizar si el campo está vacío
        const fieldsToSync = [
          "shipping_address.first_name",
          "shipping_address.last_name",
          "shipping_address.address_1",
          "shipping_address.city",
          "shipping_address.postal_code",
          "shipping_address.country_code",
          "shipping_address.province",
          "shipping_address.phone",
        ]

        fieldsToSync.forEach((field) => {
          const serverValue =
          //@ts-ignore
            cart.shipping_address?.[field.replace("shipping_address.", "")] ||
            ""
          if (!prev[field] && serverValue) {
            updated[field] = serverValue
            hasChanges = true
          }
        })

        // Email
        if (!prev.email && cart.email) {
          updated.email = cart.email
          hasChanges = true
        }

        if (hasChanges) {
          console.log("🔄 Sincronizando campos vacíos con datos del servidor")
        }

        return hasChanges ? updated : prev
      })
    }
  }, [cart?.shipping_address, cart?.email])

  // ✅ MANEJO DE CAMBIOS MEJORADO
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    console.log(`📝 Campo cambiado: ${name} = ${value}`)

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
        <Input
          label={t("checkout.shipping_address_form.first_name")}
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label={t("checkout.shipping_address_form.last_name")}
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label={t("checkout.shipping_address_form.address_1")}
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
        <Input
          label={t("checkout.shipping_address_form.company")}
          name="shipping_address.company"
          value={formData["shipping_address.company"] || ""}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="shipping-company-input"
        />
        <Input
          label={t("checkout.shipping_address_form.postal_code")}
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
        />
        <Input
          label={t("checkout.shipping_address_form.city")}
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
        <Input
          label={t("checkout.shipping_address_form.state")}
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-province-input"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email || ""}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label={t("checkout.shipping_address_form.phone_number")}
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-phone-input"
        />
      </div>

      <div className="my-8">
        <Checkbox
          label={t("checkout.shipping_address_form.address_info")}
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
    </>
  )
}

export default ShippingAddress

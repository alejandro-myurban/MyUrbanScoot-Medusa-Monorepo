import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, {
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { useTranslation } from "react-i18next"
import PhoneInput from "../phone-input"
import {
  validateAddressForm,
  sanitizeAddressData,
} from "@/lib/schemas/shipping-address"

// Definir interfaz para el ref
interface ShippingAddressRef {
  validateForm: () => boolean
  getFormDataForSubmit: () => Record<string, any>
  hasErrors: boolean
}

interface ShippingAddressProps {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}

const ShippingAddress = forwardRef<ShippingAddressRef, ShippingAddressProps>(
  ({ customer, cart, checked, onChange }, ref) => {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [phonePrefix, setPhonePrefix] = useState("+34")
    const [validationErrors, setValidationErrors] = useState<Record<
      string,
      string[]
    > | null>(null)
    const { t } = useTranslation()

    const countriesInRegion = useMemo(() => {
      const countries = cart?.region?.countries?.map((c) => c.iso_2) || []
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

    // Función para parsear teléfono completo
    const parsePhoneNumber = (fullPhone: string) => {
      if (!fullPhone) return { prefix: "+34", number: "" }

      const prefixes = ["+351", "+34", "+33", "+39", "+49", "+44", "+1"]

      for (const prefix of prefixes) {
        if (fullPhone.startsWith(prefix)) {
          return {
            prefix,
            number: fullPhone.substring(prefix.length).trim(),
          }
        }
      }

      return { prefix: "+34", number: fullPhone }
    }

    const setFormAddress = (
      address?: HttpTypes.StoreCartAddress,
      email?: string
    ) => {
      if (address) {
        // Parsear el teléfono si existe
        let parsedPhone = { prefix: "+34", number: "" }
        if (address.phone) {
          parsedPhone = parsePhoneNumber(address.phone)
          setPhonePrefix(parsedPhone.prefix)
        }

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
          "shipping_address.phone": parsedPhone.number,
        }))
      }

      if (email) {
        setFormData((prevState: Record<string, any>) => ({
          ...prevState,
          email: email,
        }))
      }

      // Limpiar errores al seleccionar dirección
      setValidationErrors(null)
    }

    useEffect(() => {
      const initializeFormData = () => {
        const initialData: Record<string, any> = {}

        if (cart?.shipping_address) {
          // Parsear teléfono del cart
          let parsedPhone = { prefix: "+34", number: "" }
          if (cart.shipping_address.phone) {
            parsedPhone = parsePhoneNumber(cart.shipping_address.phone)
            setPhonePrefix(parsedPhone.prefix)
          }

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
          initialData["shipping_address.city"] =
            cart.shipping_address.city || ""
          initialData["shipping_address.country_code"] =
            cart.shipping_address.country_code || ""
          initialData["shipping_address.province"] =
            cart.shipping_address.province || ""
          initialData["shipping_address.phone"] = parsedPhone.number
        } else {
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

        initialData.email = cart?.email || customer?.email || ""
        console.log("🔄 Inicializando formulario con:", initialData)
        setFormData(initialData)
      }

      if (Object.keys(formData).length === 0 || !formData.email) {
        initializeFormData()
      }
    }, [cart?.id, customer?.id, countriesInRegion])

    useEffect(() => {
      if (cart?.shipping_address && Object.keys(formData).length > 0) {
        setFormData((prev) => {
          const updated = { ...prev }
          let hasChanges = false

          const fieldsToSync = [
            "shipping_address.first_name",
            "shipping_address.last_name",
            "shipping_address.address_1",
            "shipping_address.city",
            "shipping_address.postal_code",
            "shipping_address.country_code",
            "shipping_address.province",
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

          // Manejo especial para el teléfono
          if (
            !prev["shipping_address.phone"] &&
            cart.shipping_address &&
            cart.shipping_address.phone
          ) {
            const parsedPhone = parsePhoneNumber(cart.shipping_address.phone)
            updated["shipping_address.phone"] = parsedPhone.number
            setPhonePrefix(parsedPhone.prefix)
            hasChanges = true
          }

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

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target
      console.log(`📝 Campo cambiado: ${name} = ${value}`)

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))

      // Limpiar errores del campo cuando el usuario empieza a escribir
      if (validationErrors?.[name]) {
        setValidationErrors((prev) => {
          if (!prev) return null
          const newErrors = { ...prev }
          delete newErrors[name]
          return Object.keys(newErrors).length > 0 ? newErrors : null
        })
      }
    }

    // Manejadores para el teléfono
    const handlePhoneChange = (phoneNumber: string) => {
      setFormData((prev) => ({
        ...prev,
        "shipping_address.phone": phoneNumber,
      }))

      // Limpiar errores del teléfono
      if (validationErrors?.["shipping_address.phone"]) {
        setValidationErrors((prev) => {
          if (!prev) return null
          const newErrors = { ...prev }
          delete newErrors["shipping_address.phone"]
          return Object.keys(newErrors).length > 0 ? newErrors : null
        })
      }
    }

    const handlePrefixChange = (prefix: string) => {
      setPhonePrefix(prefix)
    }

    // Función para validar el formulario
    const validateForm = () => {
      const sanitizedData = sanitizeAddressData(formData)

      // Agregar el teléfono completo para validación
      const dataToValidate = {
        ...sanitizedData,
        "shipping_address.phone": sanitizedData["shipping_address.phone"]
          ? `${phonePrefix}${sanitizedData["shipping_address.phone"]}`
          : "",
        same_as_billing: checked,
      }

      console.log("🔍 Validando datos:", dataToValidate)
      const validation = validateAddressForm(dataToValidate)

      if (!validation.success) {
        console.log("❌ Errores de validación:", validation.errors)
        // Filter out keys with undefined values to satisfy the type
        const filteredErrors = Object.fromEntries(
          Object.entries(validation.errors || {}).filter(
            ([, v]) => Array.isArray(v) && v !== undefined
          )
        ) as Record<string, string[]>
        setValidationErrors(filteredErrors)
        return false
      }

      setValidationErrors(null)
      return true
    }

    // Función para obtener el teléfono completo (para enviar al servidor)
    const getFormDataForSubmit = () => {
      const phoneNumber = formData["shipping_address.phone"] || ""
      const fullPhone = phoneNumber ? `${phonePrefix}${phoneNumber}` : ""

      return {
        ...formData,
        "shipping_address.phone": fullPhone,
      }
    }

    // Convertir errores para el formato que espera Input
    const errors = validationErrors
      ? Object.fromEntries(
          Object.entries(validationErrors).map(([key, errorArray]) => [
            key,
            errorArray[0], // Tomar solo el primer error
          ])
        )
      : {}

    // Marcar campos como "touched" si hay errores
    const touched = validationErrors
      ? Object.fromEntries(
          Object.keys(validationErrors).map((key) => [key, true])
        )
      : {}

    // Función para obtener errores específicos
    const getFieldError = (fieldName: string): string | null => {
      const errorArray = validationErrors?.[fieldName]
      return errorArray && errorArray.length > 0 ? errorArray[0] : null
    }

    // Exponer funciones para el componente padre
    useImperativeHandle(ref, () => ({
      validateForm,
      getFormDataForSubmit,
      hasErrors: validationErrors !== null,
    }))

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
            autoFocus
            label={t("checkout.shipping_address_form.first_name")}
            name="shipping_address.first_name"
            autoComplete="given-name"
            value={formData["shipping_address.first_name"] || ""}
            onChange={handleChange}
            required
            errors={errors}
            touched={touched}
            data-testid="shipping-first-name-input"
          />
          <Input
            label={t("checkout.shipping_address_form.last_name")}
            name="shipping_address.last_name"
            autoComplete="family-name"
            value={formData["shipping_address.last_name"] || ""}
            onChange={handleChange}
            required
            errors={errors}
            touched={touched}
            data-testid="shipping-last-name-input"
          />
          <Input
            label={t("checkout.shipping_address_form.address_1")}
            name="shipping_address.address_1"
            autoComplete="address-line1"
            value={formData["shipping_address.address_1"] || ""}
            onChange={handleChange}
            required
            errors={errors}
            touched={touched}
            data-testid="shipping-address-input"
          />
          <Input
            label={t("checkout.shipping_address_form.company")}
            name="shipping_address.company"
            value={formData["shipping_address.company"] || ""}
            onChange={handleChange}
            autoComplete="organization"
            errors={errors}
            touched={touched}
            data-testid="shipping-company-input"
          />
          <Input
            label={t("checkout.shipping_address_form.postal_code")}
            name="shipping_address.postal_code"
            autoComplete="postal-code"
            value={formData["shipping_address.postal_code"] || ""}
            onChange={handleChange}
            required
            errors={errors}
            touched={touched}
            data-testid="shipping-postal-code-input"
          />
          <Input
            label={t("checkout.shipping_address_form.city")}
            name="shipping_address.city"
            autoComplete="address-level2"
            value={formData["shipping_address.city"] || ""}
            onChange={handleChange}
            required
            errors={errors}
            touched={touched}
            data-testid="shipping-city-input"
          />
          <Input
            label={t("checkout.shipping_address_form.state")}
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"] || ""}
            onChange={handleChange}
            required
            errors={errors}
            touched={touched}
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
            errors={errors}
            touched={touched}
            data-testid="shipping-email-input"
          />

          {/* PhoneInput con validación */}
          <div className="flex flex-col">
            <PhoneInput
              label={t("checkout.shipping_address_form.phone_number")}
              name="shipping_address.phone_display"
              value={formData["shipping_address.phone"] || ""}
              phonePrefix={phonePrefix}
              onPhoneChange={handlePhoneChange}
              onPrefixChange={handlePrefixChange}
              required
              placeholder="123-456-789"
              data-testid="shipping-phone-input"
            />
            {getFieldError("shipping_address.phone") && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError("shipping_address.phone")}
              </p>
            )}
          </div>

          <input
            type="hidden"
            name="shipping_address.phone"
            value={(() => {
              const phoneNumber = formData["shipping_address.phone"] || ""
              return phoneNumber ? `${phonePrefix}${phoneNumber}` : ""
            })()}
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
)

ShippingAddress.displayName = "ShippingAddress"

export default ShippingAddress

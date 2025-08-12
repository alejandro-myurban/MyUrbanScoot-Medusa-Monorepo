"use client"

import { Table, Text, clx } from "@medusajs/ui"

import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useEffect, useState } from "react"
import { getProductsById } from "@lib/data/products"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
}

const Item = ({ item, type = "full" }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(item.thumbnail)

  console.log("item!!!!!!!", item)
  const { handle } = item.variant?.product ?? {}
  const productId = [item.product?.id]

  useEffect(() => {
    const getProductData = async () => {
      if (productId) {
        setLoading(true)
        try {
          const data = await getProductsById({
            ids: productId.filter(Boolean) as string[],
            regionId: "reg_01JSP4QGE8SADHTVCS3M91T6B2",
          })
          console.log("data", data)
          setProductData(data)
        } catch (err) {
          console.error("Error fetching product data:", err)
        } finally {
          setLoading(false)
        }
      }
    }

    getProductData()
  }, [])

  useEffect(() => {
    if (productData) {
      const newImageUrl = getVariantImage()
      console.log("URL final a usar en Thumbnail:", newImageUrl)
      setImageUrl(newImageUrl)
    }
  }, [productData])

  const getVariantImage = () => {
    console.log("Ejecutando getVariantImage")
    const product = Array.isArray(productData) ? productData[0] : productData

    // Si no hay datos de producto o imágenes, usa el thumbnail
    if (!product || !product.images || !product.images.length) {
      console.log("Usando thumbnail por defecto:", item.thumbnail)
      return item.thumbnail
    }

    // Encuentra el valor del color en las opciones de la variante
    // Busca la opción "Base"
    const baseOption = item.variant?.options?.find(
      (opt) => (opt.option?.title)?.toLowerCase() === "base"
    )
    console.log("Opción Base encontrada:", baseOption)

    // Extrae el valor, por ejemplo "con base" o "sin base"
    const baseValue = baseOption?.value?.toLowerCase()
    if (!baseValue) {
      console.log(
        "No se encontró valor para Base, usando thumbnail:",
        item.thumbnail
      )
      return item.thumbnail
    }

    // Extrae solo la primera palabra, que se espera que sea "con" o "sin"
    const baseKeyWord = baseValue.split(" ")[0]
    console.log("Palabra base extraída:", baseKeyWord)

    // Crea una expresión regular para buscar la palabra exacta con límites (word boundaries)
    const regex = new RegExp(`\\b${baseKeyWord}\\b`, "i")

    // Filtra las imágenes utilizando la expresión regular
    const baseImages = product.images.filter((img: any) => regex.test(img.url))
    console.log("Imágenes encontradas para la palabra base:", baseImages)

    // Si hay imágenes que coinciden, devuelve la primera; de lo contrario, usa el thumbnail original
    if (baseImages.length > 0) {
      console.log("URL de imagen seleccionada:", baseImages[0].url)
      return baseImages[0].url
    }

    console.log(
      "No se encontraron imágenes para la palabra base, usando thumbnail:",
      item.thumbnail
    )
    return item.thumbnail
  }

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    const message = await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  return (
    <Table.Row className="w-full bg-gray-200 sm:table-row hover:bg-gray-200" data-testid="product-row">
      {/* Imagen + Precio en móvil, solo imagen en desktop */}
      <Table.Cell className="!pl-0 p-2 sm:p-4 w-full sm:w-32">
        {/* Layout móvil: Stack vertical */}
        <div className="flex flex-col sm:block gap-3">
          {/* Contenedor de imagen y precio en una fila en móvil */}
          <div className="flex items-start justify-between gap-3">
            <LocalizedClientLink href={`/producto/${handle}`} className="flex-shrink-0 relative z-10">  { /* Apuntaba a product */}
              {loading ? (
                <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center border rounded-lg bg-gray-100">
                  <Spinner />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg  border relative">
                  <Thumbnail
                    thumbnail={imageUrl}
                    images={productData?.images || []}
                    size="square"
                    className="w-full h-full object-cover"
                  />
                  {/* Badge de cantidad */}
                  <div className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md z-20">
                    {item.quantity}
                  </div>
                </div>
              )}
            </LocalizedClientLink>
            
            {/* Precio solo en móvil - sin quantity */}
            <div className="flex sm:hidden flex-col items-end">
              <span
                className={clx("text-right", {
                  "flex flex-col items-end h-full justify-center": type === "preview",
                })}
              >
                {type === "preview" && (
                  <LineItemUnitPrice item={item} style="tight" />
                )}
                <LineItemPrice item={item} style="tight" />
              </span>
            </div>
          </div>

          {/* Título y opciones en móvil - debajo de imagen */}
          <div className="block sm:hidden">
            <Text
              className="txt-small text-ui-fg-base mb-1"
              data-testid="product-title"
            >
              {item.product_title}
            </Text>
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          </div>
        </div>
      </Table.Cell>

      {/* Título y opciones solo en desktop */}
      <Table.Cell className="hidden sm:table-cell text-left p-2 sm:p-4">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell className="p-2 sm:p-4">
          <div className="flex gap-1 sm:gap-2 items-center w-20 sm:w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-12 sm:w-14 h-8 sm:h-10 p-2 sm:p-4 text-xs sm:text-sm"
              data-testid="product-select-button"
            >
              {/* TODO: Update this with the v2 way of managing inventory */}
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}

              <option value={1} key={1}>
                1
              </option>
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden sm:table-cell">
          <LineItemUnitPrice item={item} style="tight" />
        </Table.Cell>
      )}

      {/* Precio solo en desktop - sin quantity en preview */}
      <Table.Cell className="!pr-0 p-2 sm:p-4 hidden sm:table-cell">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {/* {type === "preview" && (
            <LineItemUnitPrice item={item} style="tight" />
          )} */}
          <LineItemPrice item={item} style="tight" />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
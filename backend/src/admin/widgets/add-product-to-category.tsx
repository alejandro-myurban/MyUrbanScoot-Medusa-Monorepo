import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Button, Input, toast, Toaster, Select } from "@medusajs/ui";
import { useEffect, useState } from "react";
import {
  DetailWidgetProps,
  AdminProduct,
  AdminProductCategory,
} from "@medusajs/framework/types";
import { sdk } from "../lib/sdk"; // Asegúrate de tener el JS SDK configurado

const parentCategoryIds = [
  "pcat_01JWG5ZKBT1BF1NM5YSH6MH9D4",
  "pcat_01JWG5Z06EMTA35T8RRYB6RB81",
  "pcat_01JWG5Y5KJNSER6509HMEHECZ0",
];

const AddProductToCategoryWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const [categories, setCategories] = useState<AdminProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchChildCategories = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          parentCategoryIds.map((parentId) =>
            sdk.admin.productCategory.list({
              parent_category_id: parentId,
              fields: "id,name",
            })
          )
        );
        const allChildren = results.flatMap(
          ({ product_categories }) => product_categories
        );
        setCategories(allChildren);
      } catch (e) {
        // Manejo de error
        setCategories([]);
      }
      setLoading(false);
    };
    fetchChildCategories();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const existingCategoryIds = data.categories?.map((cat) => cat.id) || [];

      const updatedCategoryIds = selectedCategory
        ? Array.from(new Set([...existingCategoryIds, selectedCategory]))
        : existingCategoryIds;

      await sdk.admin.product.update(data.id, {
        categories: updatedCategoryIds.map((id) => ({ id })),
      });

      toast.success("Guardado correctamente");
    } catch (e) {
      toast.error("Error al guardar");
    }
    setLoading(false);
  };

  return (
    <Container>
      <div className="flex flex-col gap-2">
        <label htmlFor="numero-personalizado">
          Si el producto es un recambio, añade el producto a su modelo
          compatible.
        </label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <Select.Trigger>
            <Select.Value placeholder="Selecciona una opción" />
          </Select.Trigger>
          <Select.Content>
            {categories.map((item) => (
              <Select.Item key={item.id} value={item.id}>
                {item.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Button onClick={handleSave} disabled={loading}>
          Guardar
        </Button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default AddProductToCategoryWidget;

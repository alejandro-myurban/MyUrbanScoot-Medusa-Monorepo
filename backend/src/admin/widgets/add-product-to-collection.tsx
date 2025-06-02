import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Button, Input, toast, Toaster, Select } from "@medusajs/ui";
import { useEffect, useState } from "react";
import {
  DetailWidgetProps,
  AdminProduct,
  AdminProductCategory,
  AdminCollectionListResponse,
  AdminCollection,
} from "@medusajs/framework/types";
import { sdk } from "../lib/sdk"; // Asegúrate de tener el JS SDK configurado

const AddProductToCategoryWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(
    data.collection_id || ""
  );

  useEffect(() => {
    setSelectedCollection(data.collection_id || "");
  }, [data.collection_id]);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        sdk.admin.productCollection
          .list({
            fields: "id,title",
          })
          .then(({ collections }) => {
            setCollections(collections);
          });
      } catch (e) {
        // Manejo de error
        setCollections([]);
      }
      setLoading(false);
    };
    fetchCollections();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await sdk.admin.product.update(data.id, {
        collection_id: selectedCollection || null,
      });
      toast.success("Colección guardada correctamente");
    } catch (e) {
      toast.error("Error al guardar la colección");
    }
    setLoading(false);
  };

  return (
    <Container>
      <div className="flex flex-col gap-2">
        <label htmlFor="numero-personalizado">
          Si el producto es un recambio, añade el producto a su colección
        </label>
        <Select
          value={selectedCollection}
          onValueChange={setSelectedCollection}
        >
          <Select.Trigger>
            <Select.Value placeholder="Selecciona una opción" />
          </Select.Trigger>
          <Select.Content>
            {collections.map((item) => (
              <Select.Item key={item.id} value={item.id}>
                {item.title}
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

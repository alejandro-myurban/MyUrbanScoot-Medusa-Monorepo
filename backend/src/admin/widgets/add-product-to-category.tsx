import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Button, Input, toast, Toaster, Checkbox, Text } from "@medusajs/ui";
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);

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
        console.error("Error fetching categories:", e);
        setCategories([]);
      }
      setLoading(false);
    };
    
    fetchChildCategories();
  }, []);

  // Inicializar las categorías seleccionadas con las categorías actuales del producto
  useEffect(() => {
    if (data.categories && categories.length > 0) {
      const currentCategoryIds = data.categories
        .map((cat) => cat.id)
        .filter((id) => categories.some((category) => category.id === id));
      setSelectedCategories(currentCategoryIds);
    }
  }, [data.categories, categories]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        // Si ya está seleccionada, la quitamos
        return prev.filter((id) => id !== categoryId);
      } else {
        // Si no está seleccionada, la añadimos
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const existingCategoryIds = data.categories?.map((cat) => cat.id) || [];
      
      // Mantener las categorías que no están en nuestro scope de gestión
      const managedCategoryIds = categories.map((cat) => cat.id);
      const unManagedCategories = existingCategoryIds.filter(
        (id) => !managedCategoryIds.includes(id)
      );

      // Combinar categorías no gestionadas + categorías seleccionadas
      const finalCategoryIds = Array.from(
        new Set([...unManagedCategories, ...selectedCategories])
      );

      await sdk.admin.product.update(data.id, {
        categories: finalCategoryIds.map((id) => ({ id })),
      });

      // Calcular cambios para el mensaje
      const currentManagedCategories = existingCategoryIds.filter(id => 
        managedCategoryIds.includes(id)
      );
      const added = selectedCategories.filter(id => 
        !currentManagedCategories.includes(id)
      ).length;
      const removed = currentManagedCategories.filter(id => 
        !selectedCategories.includes(id)
      ).length;

      let message = "Guardado correctamente.";
      if (added > 0 && removed > 0) {
        message += ` ${added} añadida${added > 1 ? 's' : ''}, ${removed} eliminada${removed > 1 ? 's' : ''}.`;
      } else if (added > 0) {
        message += ` ${added} categoría${added > 1 ? 's' : ''} añadida${added > 1 ? 's' : ''}.`;
      } else if (removed > 0) {
        message += ` ${removed} categoría${removed > 1 ? 's' : ''} eliminada${removed > 1 ? 's' : ''}.`;
      }

      toast.success(message);
    } catch (e) {
      console.error("Error saving categories:", e);
      toast.error("Error al guardar las categorías");
    }
    setLoading(false);
  };

  const selectedCount = selectedCategories.length;
  
  // Verificar si hay cambios respecto al estado actual
  const currentManagedCategories = data.categories?.map(cat => cat.id)
    .filter(id => categories.some(category => category.id === id)) || [];
  
  const hasChanges = 
    selectedCategories.length !== currentManagedCategories.length ||
    !selectedCategories.every(id => currentManagedCategories.includes(id));

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <div>
          <Text size="large" weight="plus" className="mb-2">
            Añadir producto a modelos compatibles
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            Si el producto es un recambio, selecciona todos los modelos compatibles.
          </Text>
        </div>

        {loading && categories.length === 0 ? (
          <div className="text-ui-fg-subtle text-sm">Cargando categorías...</div>
        ) : (
          <div className="space-y-3">
            {/* Botón para mostrar/ocultar + contador */}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center gap-2"
              >
                {showCategories ? "Ocultar Categorías" : "Ver Categorías"}
                <span className="bg-ui-bg-highlight text-ui-fg-base px-2 py-1 rounded text-xs">
                  {categories.length}
                </span>
              </Button>
              
              {selectedCount > 0 && (
                <Text size="small" weight="plus" className="text-ui-fg-interactive">
                  {selectedCount} seleccionada{selectedCount > 1 ? 's' : ''}
                </Text>
              )}
            </div>

            {/* Grid de categorías (solo visible cuando showCategories es true) */}
            {showCategories && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto border border-ui-border-base rounded-md p-3 animate-in slide-in-from-top-2 duration-200">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  const isCurrentlyAssigned = data.categories?.some(cat => cat.id === category.id);
                  
                  return (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 hover:bg-ui-bg-subtle rounded-md cursor-pointer transition-colors min-h-[44px]"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm block truncate">
                          {category.name}
                        </span>
                        {isCurrentlyAssigned && (
                          <span className="text-xs text-white bg-green-700 px-1 py-0.5 rounded mt-1 inline-block">
                            Asignado
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
                
                {categories.length === 0 && !loading && (
                  <div className="text-ui-fg-subtle text-sm text-center py-4 col-span-full">
                    No se encontraron categorías
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={loading || !hasChanges}
          className="mt-4"
        >
          {loading ? "Guardando..." : 
           hasChanges ? 
             `Guardar cambios (${selectedCount} seleccionada${selectedCount !== 1 ? 's' : ''})` : 
             "Sin cambios"
          }
        </Button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default AddProductToCategoryWidget;  
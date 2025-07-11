import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Button,
  Select,
  toast,
  Toaster,
  Heading,
} from "@medusajs/ui";
import { useQuery, useMutation } from "@tanstack/react-query";
import { sdk } from "../lib/sdk.js";
import { useState, useEffect } from "react";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

const BoughtTogetherWidget = ({ data }) => {
  // ─── Estados ───────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);

  // Inicializamos desde metadata.bought_together (string o JSON-array)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const raw = data.metadata?.bought_together;
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [String(arr)];
    } catch {
      return [String(raw)];
    }
  });

  const [discounts, setDiscounts] = useState<Record<string, number>>(() => {
  const initial: Record<string, number> = {};
  selectedIds.forEach((id) => {
    const d = data.metadata?.[`bought_together_discount_${id}`];
    if (d) initial[id] = Number(d);
  });
  return initial;
  });



  // ─── Query de productos ────────────────────────────────────
  const { data: productsData, isLoading } = useQuery<
    { products: { id: string; title: string; variants?: { prices?: { amount: number; currency_code: string }[] }[] }[] },
    Error
  >({
    queryKey: ["products", debouncedSearch],
    queryFn: () =>
      sdk.admin.product.list({
        q: debouncedSearch,
        fields: "id,title,variants.id,variants.title,variants.prices.amount,variants.prices.currency_code",
        limit: 50,
      }),
    placeholderData: (prev) => prev,
  });

  // ─── Mutación para guardar metadata ────────────────────────
  const mutation = useMutation<any, Error, void>({
    mutationFn: () => {
      const metadata: Record<string, any> = {
        bought_together: JSON.stringify(selectedIds),
      };

      const allKeys = Object.keys(data.metadata || {});
      
      // Copiar claves existentes
      allKeys.forEach((key) => {
        if (key.startsWith("bought_together_discount_")) {
          const id = key.replace("bought_together_discount_", "");
          metadata[key] = selectedIds.includes(id)
            ? (discounts[id]?.toString() ?? "0")
            : "null";
        } else if (key !== "bought_together") {
          metadata[key] = data.metadata[key];
        }
      });

      // 🔥 Agregar descuentos que no existían antes
      selectedIds.forEach((id) => {
        const key = `bought_together_discount_${id}`;
        if (!(key in metadata)) {
          metadata[key] = discounts[id]?.toString() ?? "0";
        }
      });

      return sdk.admin.product.update(data.id, { metadata });
    },
    onSuccess: () => {
      toast.success("Configuración guardada correctamente");
    },
    onError: (error) => {
      toast.error("Error al guardar la configuración", {
        description: error.message,
      });
    },
  });


// ─── Handlers ─────────────────────────────────────────────
  const handleAdd = (id: string) => {
    if (id && !selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };
  const handleRemove = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setDiscounts((prev) => {
    const updated = { ...prev };
    delete updated[id]; // eliminamos el descuento asociado
    return updated;
    });
    };
    const handleSave = () => {
      mutation.mutate();
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

  return (
    <Container>
      <Toaster />
      <Heading level="h2" className="mb-4">
        Selecciona uno o más productos comprados juntos y su descuento
      </Heading>

      {/* Search + Dropdown */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />

        <Select value={""} onValueChange={handleAdd}>
          <Select.Trigger>
            <Select.Value placeholder="Añadir producto…" />
          </Select.Trigger>
          <Select.Content>
            {isLoading && (
              <Select.Item value="__loading__" disabled>
                Cargando…
              </Select.Item>
            )}
            {!isLoading && productsData?.products.length === 0 && (
              <Select.Item value="__no_results__" disabled>
                Sin resultados
              </Select.Item>
            )}
            {!isLoading &&
              productsData?.products.map((p) => (
                <Select.Item
                  key={p.id}
                  value={p.id}
                  disabled={selectedIds.includes(p.id)}
                >
                  {p.title}
                </Select.Item>
              ))}
          </Select.Content>
        </Select>
      </div>

      {/* Tags de productos seleccionados */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedIds.map((id) => {
            const prod = productsData?.products.find((p) => p.id === id);
            return (
              <div
                key={id}
                className="flex items-center bg-gray-100 dark:bg-ui-button-inverted shadow-buttons-inverted bg-ui-button-inverted px-3 py-1 rounded-full"
              >
                <span className="mr-2 text-sm">{prod?.title ?? id}</span>
                <button
                  onClick={() => handleRemove(id)}
                  className="text-sm font-bold leading-none"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

        {/* Inputs de descuentos individuales */}
        <div className="mb-6 space-y-3"> 
          {selectedIds.length > 0 && productsData ? ( // Asegúrate de que haya IDs seleccionados y productsData cargado
            selectedIds.map((id) => {
              const prod = productsData.products?.find((p) => p.id === id); 
              return (
                <div key={id} className="flex items-center gap-4 bg-ui-bg-base p-3 rounded-md border border-ui-border-base shadow-sm">
                  <label className="text-sm font-medium text-ui-fg-base flex-grow">
                    Descuento para <strong className="text-ui-fg-subtle">{prod?.title ?? `Producto ${id}`}</strong>:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={0}
                      max={100} // Añadido un máximo razonable para porcentajes
                      step={1}
                      placeholder="Ej. 10"
                      value={discounts[id] ?? ""}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        setDiscounts((prev) => ({
                          ...prev,
                          [id]: isNaN(newValue) ? 0 : Math.max(0, Math.min(100, newValue)),
                        }));
                      }}
                      className="w-24 p-2 pl-3 border border-ui-border-base rounded-md text-sm focus:border-ui-border-interactive focus:ring-1 focus:ring-ui-border-interactive transition-colors"
                    />
                    <span className="absolute right-3 text-ui-fg-muted">%</span> 
                  </div>
                </div>
              );
            })
          ) : (
            selectedIds.length > 0 && <p className="text-ui-fg-subtle text-center py-2">Cargando productos para definir descuentos...</p>
          )}
        </div>
        
        {/* Ver los descuentos */}
        <div className="mb-6 space-y-6"> 
          {!isLoading && productsData && selectedIds.length > 0 ? (
            selectedIds.map((id) => {
              const prod = productsData.products.find((p) => p.id === id);

              if (!prod) {
                return (
                  <div key={id} className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded-md flex justify-between items-center text-ui-fg-subtle">
                    <p className="text-sm font-medium">{`Producto no encontrado: ${id}`}</p>
                  </div>
                );
              }

              const discountPercent = discounts[id] ?? 0;

              const variant = prod.variants?.[0];

              if (!variant) {
                return (
                  <div key={id} className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded-md">
                    <h3 className="text-base font-semibold text-ui-fg-base">{prod.title ?? `Producto ${id}`}</h3>
                    <p className="text-sm text-ui-fg-subtle">No hay variantes disponibles para mostrar precios.</p>
                  </div>
                );
              }

              const priceObj = variant.prices?.[0];
              const priceAmount = priceObj?.amount;

              // Se asume que priceAmount ya viene en el formato correcto (ej. 34.9)
              const price = typeof priceAmount === 'number' ? priceAmount : 0; 
              const currency = priceObj?.currency_code?.toUpperCase() ?? "EUR";

              let formattedPrice = "N/A";
              let discountedPrice = "N/A";

              try {
                formattedPrice = price.toFixed(2); 
                discountedPrice = (price * (1 - discountPercent / 100)).toFixed(2);
              } catch (e) {
                console.error(`Error al formatear precios para ${prod.title || id}:`, e);
              }

              return (
                <div key={id} className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded-md shadow-sm">
                  <h3 className="text-base font-semibold text-ui-fg-base mb-2">{prod.title}</h3>
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-ui-fg-subtle">Precio original:</p>
                    <p className="font-medium text-ui-fg-base">{currency} {formattedPrice}</p>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-ui-fg-subtle">Precio con descuento ({discountPercent}%):</p>
                    <p className="font-medium text-ui-fg-interactive">{currency} {discountedPrice}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-ui-fg-subtle text-center py-4">Cargando información de precios o no hay productos seleccionados con descuento para mostrar.</p>
          )}
        </div>

      {/* Botón de guardar */}
      <Button onClick={handleSave} disabled={mutation.isPending}>
        {mutation.isPending ? "Guardando…" : "Guardar configuración"}
      </Button>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default BoughtTogetherWidget;

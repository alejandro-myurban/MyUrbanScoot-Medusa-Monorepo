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
      <div className="mb-4 space-y-2">
        {selectedIds.map((id) => {
          const prod = productsData?.products.find((p) => p.id === id);
          return (
            <div key={id} className="flex items-center gap-2">
              <label className="text-sm w-64">
                Descuento para <strong>{prod?.title ?? id}</strong>:
              </label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Ej. 10"
                value={discounts[id] ?? ""}
                onChange={(e) => {
                  const newValue = Number(e.target.value);
                  setDiscounts((prev) => ({
                    ...prev,
                    [id]: isNaN(newValue) ? 0 : newValue,
                  }));
                }}
                className="w-24 p-2 border rounded text-sm"
              />
            </div>
          );
        })}
        </div>

      {/* <div className="mb-4 space-y-5">
        {selectedIds.map((id) => {
          const prod = productsData?.products.find((p) => p.id === id)
          const discountPercent = discounts[id] ?? 0

          // Asumimos que usamos la primera variante del producto
          const variant = prod?.variants?.[0]
          const price = variant?.prices?.[0]?.amount ?? 0
          const currency = variant?.prices?.[0]?.currency_code?.toUpperCase() ?? "USD"

          console.log(price)
          const formattedPrice = (price).toFixed(2)
          const discountedPrice = ((price * (1 - discountPercent / 100))).toFixed(2)

          return (
            <div key={id}>
              <Heading>{prod?.title ?? id}</Heading>
              <h2>Sin descuento: {currency} {formattedPrice}</h2>
              <h2>Con descuento: {currency} {discountedPrice}</h2>
            </div>
          )
        })}
      </div> */}
      
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

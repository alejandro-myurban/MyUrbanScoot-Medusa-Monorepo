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

  const [discount, setDiscount] = useState<number | "">(
    data.metadata?.bought_together_discount
      ? Number(data.metadata.bought_together_discount)
      : ""
  );

  // ─── Query de productos ────────────────────────────────────
  const { data: productsData, isLoading } = useQuery<
    { products: { id: string; title: string }[] },
    Error
  >({
    queryKey: ["products", debouncedSearch],
    queryFn: () =>
      sdk.admin.product.list({
        q: debouncedSearch,
        fields: "id,title",
        limit: 50,
      }),
    placeholderData: (prev) => prev,
  });

  // ─── Mutación para guardar metadata ────────────────────────
  const mutation = useMutation<any, Error, void>({
    mutationFn: () =>
      sdk.admin.product.update(data.id, {
        metadata: {
          ...data.metadata,
          bought_together: JSON.stringify(selectedIds),
          bought_together_discount:
            discount !== "" ? discount.toString() : undefined,
        },
      }),
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
  };
  const handleSave = () => {
    mutation.mutate();
    setTimeout(() => {
      window.location.reload();
    }, 500);
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

      {/* Input de descuento */}
      <div className="mb-4">
        <label className="block mb-1">Descuento (%)</label>
        <input
          type="number"
          min={0}
          step={1}
          placeholder="Ej. 10"
          value={discount}
          onChange={(e) => {
            const v = e.target.value;
            setDiscount(v === "" ? "" : Math.max(0, Number(v)));
          }}
          className="w-24 p-2 border rounded"
        />
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

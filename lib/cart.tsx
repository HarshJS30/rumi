"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Product } from "./products";

export type CartLine = { key: string; productId: string; slug: string; name: string; image: string; basePrice: number; setName?: string; size?: number; optionIds: string[]; options: { id: string; name: string; priceAdjustment: number }[]; quantity: number };
type CartOption = CartLine["options"][number];
type CartContextValue = { lines: CartLine[]; hydrated: boolean; add: (product: Product, optionIds: string[], quantity: number, setOptionId?: string, size?: number) => void; setQuantity: (key: string, quantity: number) => void; remove: (key: string) => void; clear: () => void; subtotal: number; count: number };
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rumi-cart-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCartOption(value: unknown): value is CartOption {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.priceAdjustment === "number" &&
    Number.isFinite(value.priceAdjustment);
}

function restoreCartLine(value: unknown): CartLine | null {
  if (!isRecord(value)) return null;

  const { key, productId, slug, name, image, basePrice, quantity } = value;
  if (
    typeof key !== "string" ||
    typeof productId !== "string" ||
    typeof slug !== "string" ||
    typeof name !== "string" ||
    typeof image !== "string" ||
    typeof basePrice !== "number" ||
    !Number.isFinite(basePrice) ||
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null;
  }

  const options = value.options === undefined
    ? []
    : Array.isArray(value.options) && value.options.every(isCartOption)
      ? value.options
      : null;
  const optionIds = value.optionIds === undefined
    ? []
    : Array.isArray(value.optionIds) && value.optionIds.every((id) => typeof id === "string")
      ? value.optionIds
      : null;
  if (!options || !optionIds) return null;

  return {
    key,
    productId,
    slug,
    name,
    image,
    basePrice,
    setName: typeof value.setName === "string" ? value.setName : "",
    size: typeof value.size === "number" && Number.isFinite(value.size) ? value.size : undefined,
    options,
    optionIds,
    quantity,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let restored: CartLine[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          restored = parsed.flatMap((line) => {
            const restoredLine = restoreCartLine(line);
            return restoredLine ? [restoredLine] : [];
          });
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    queueMicrotask(() => { setLines(restored); setHydrated(true); });
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); }, [hydrated, lines]);
  const value = useMemo<CartContextValue>(() => ({ lines, hydrated,
    add(product, optionIds, quantity, setOptionId, size) {
      const options = product.options.filter(option => optionIds.includes(option.id));
      const selectedSet = product.setOptions.find(option => option.id === setOptionId) ?? product.setOptions[0];
      const basePrice = selectedSet?.price ?? product.basePrice;
      const setName = selectedSet?.name ?? "";
      const key = `${product.id}:${selectedSet?.id ?? "base"}:${size ?? "na"}:${[...optionIds].sort().join(",") || "base"}`;
      setLines(current => { const found = current.find(line => line.key === key); return found ? current.map(line => line.key === key ? { ...line, quantity: line.quantity + quantity } : line) : [...current, { key, productId: product.id, slug: product.slug, name: product.name, image: product.images[0] || "", basePrice, setName, size, optionIds: [...optionIds], options, quantity }]; });
    },
    setQuantity(key, quantity) { setLines(current => quantity <= 0 ? current.filter(line => line.key !== key) : current.map(line => line.key === key ? { ...line, quantity } : line)); },
    remove(key) { setLines(current => current.filter(line => line.key !== key)); }, clear() { setLines([]); },
    subtotal: lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0),
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
  }), [lines, hydrated]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const cart = useContext(CartContext); if (!cart) throw new Error("useCart must be used within CartProvider"); return cart; }
export function lineUnitPrice(line: CartLine) {
  return line.basePrice + line.options.reduce((sum, option) => sum + option.priceAdjustment, 0);
}

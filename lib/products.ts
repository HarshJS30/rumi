import catalogue from "../data/catalogue.json";
import coverOverrides from "../data/cover-overrides.json";

export type ProductOption = { id: string; name: string; priceAdjustment: number; description: string };
export type SetOption = { id: string; name: string; price: number };
export type SizeOption = { size: number; bookable: boolean };
export type ProductStatus = "available" | "sold";

export type Product = {
  id: string;
  slug: string;
  identifier?: string;
  newArticleNumber?: string;
  websiteName: string;
  name: string;
  status: ProductStatus;
  available: boolean;
  hasPhotos: boolean;
  images: string[];
  color?: string;
  colorGroup?: string[];
  fabric?: string;
  silhouette?: string;
  pattern?: string;
  dyeable?: boolean;
  length?: string;
  size?: string;
  sizes: SizeOption[];
  mrp?: number;
  setOptions: SetOption[];
  basePrice?: number;
  category?: string;
  tags: string[];
  collections: string[];
  photoSource?: "ai" | "original" | "direct";
  description: string;
  options: ProductOption[];
};

const SIZE_RANGE = [38, 40, 42, 44, 46];
const ADD_ONS: ProductOption[] = [
  { id: "matching-inner", name: "Add a matching inner", priceAdjustment: 300, description: "An optional finishing touch for your order." },
  { id: "gift-wrap", name: "Gift wrap", priceAdjustment: 150, description: "An optional finishing touch for your order." },
];
const DESCRIPTION = "A considered piece from the Rumi Ethnic collection. Contact us on WhatsApp for sizing and availability details.";
type CatalogueRow = Omit<Product, "description" | "basePrice" | "options">;

export const products: Product[] = (catalogue as CatalogueRow[]).map((row) => {
  const override = (coverOverrides as Record<string, string>)[row.id];
  const overridePath = override?.startsWith("/photoshoot/")
    ? override
    : row.images.find((image) => image.split("/").pop() === override);
  const images = override && (overridePath ?? row.images[0])
    ? [overridePath ?? row.images[0], ...row.images.filter((image) => image !== (overridePath ?? row.images[0]))]
    : row.images;
  const offered = (row.size ?? "")
    .replace(/\s+I\s+/g, " | ")
    .split("|")
    .map((value) => Number(value.trim()))
    .filter(Number.isFinite);
  return {
    ...row,
    images,
    sizes: !row.size || /^(na|freesize)$/i.test(row.size)
      ? []
      : SIZE_RANGE.map((size) => ({ size, bookable: row.available && offered.includes(size) })),
    basePrice: row.setOptions[0]?.price ?? row.mrp,
    description: DESCRIPTION,
    options: ADD_ONS,
  };
});

export const formatPrice = (amount?: number) => amount === undefined
  ? ""
  : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export const getDistinctCollectionProducts = (collection: string, excludedCollections: string[] = []) => {
  const visibleProducts = products.filter((product) => product.hasPhotos);
  const previouslyShown = visibleProducts.filter((product) =>
    excludedCollections.some((excluded) => product.collections.includes(excluded)),
  );
  const seenIdentifiers = new Set(previouslyShown.map((product) => product.identifier ?? product.id));
  const seenNames = new Set(previouslyShown.map((product) => product.name.trim().toLowerCase()));

  return visibleProducts.filter((product) => {
    if (!product.collections.includes(collection)) return false;
    const identifier = product.identifier ?? product.id;
    const name = product.name.trim().toLowerCase();
    const sharedGenderProduct =
      (collection === "men" || collection === "women") &&
      product.collections.includes("men") &&
      product.collections.includes("women");
    if (
      !sharedGenderProduct &&
      (seenIdentifiers.has(identifier) || seenNames.has(name))
    ) {
      return false;
    }
    seenIdentifiers.add(identifier);
    seenNames.add(name);
    return true;
  });
};

export const productSlugAliases: Record<string, string> = {};
export const getProduct = (slug: string) => products.find((product) => product.slug === (productSlugAliases[slug] ?? slug));
export const productUnitPrice = (product: Product, optionIds: string[], setOptionId?: string) => {
  const base = product.setOptions.find((set) => set.id === setOptionId)?.price ?? product.basePrice ?? 0;
  return base + product.options.filter((option) => optionIds.includes(option.id)).reduce((sum, option) => sum + option.priceAdjustment, 0);
};
export const getSizes = (product: Product) => product.sizes;
export const isSizeBookable = (product: Product, size: number) => product.available && (product.sizes.find((item) => item.size === size)?.bookable ?? false);
export const RELATED_LIMIT = 4;
export const getRelatedProducts = (product: Product, limit = RELATED_LIMIT): Product[] => {
  const pool = products.filter((item) => item.id !== product.id && item.hasPhotos);
  const picked = new Map<string, Product>();
  const take = (list: Product[]) => list.forEach((item) => picked.size < limit && picked.set(item.id, item));
  take(pool.filter((item) => item.identifier === product.identifier));
  take(pool.filter((item) => item.category === product.category));
  take(pool.filter((item) => item.fabric === product.fabric));
  take(pool);
  return [...picked.values()];
};

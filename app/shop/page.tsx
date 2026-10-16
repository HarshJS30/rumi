import type { Metadata } from "next";
import ProductListing from "../../components/ProductListing";

export const metadata: Metadata = {
  title: "Shop the Collection | Rumi Ethnic",
  description:
    "Explore the complete Rumi Ethnic collection of considered Indian wear, kurtas, and handcrafted details.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const initialQuery = Array.isArray(q) ? q[0] ?? "" : q ?? "";

  return <ProductListing initialQuery={initialQuery} />;
}

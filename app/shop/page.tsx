import type { Metadata } from "next";
import ProductListing from "../../components/ProductListing";

export const metadata: Metadata = {
  title: "Shop the Collection | Rumi Studio",
  description:
    "Explore the complete Rumi Studio collection of considered Indian wear, kurtas, and handcrafted details.",
};

export default function ShopPage() {
  return <ProductListing />;
}

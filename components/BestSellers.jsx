"use client";
import { getDistinctCollectionProducts } from "../lib/products";
import ProductSection from "./ProductSection";

export default function BestSellers() {
  const items = getDistinctCollectionProducts("best-seller");
  return (
    <ProductSection
      eyebrow="Best Sellers"
      sectionId="best-sellers"
      heading="Loved by You"
      sub="Pieces chosen for their thoughtful details and lasting craftsmanship."
      products={items}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

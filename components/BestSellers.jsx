"use client";
import { getDistinctCollectionProducts } from "../lib/products";
import ProductSection from "./ProductSection";

export default function BestSellers() {
  const items = getDistinctCollectionProducts("best-seller");
  const orderedItems = [
    ...items.filter((product) => !product.collections.includes("men")),
    ...items.filter((product) => product.collections.includes("men")),
  ];

  return (
    <ProductSection
      sectionId="best-sellers"
      eyebrow="Loved by You"
      heading="Best Sellers"
      sub="Pieces chosen for their thoughtful details and lasting craftsmanship."
      products={orderedItems}
      showSizes={false}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

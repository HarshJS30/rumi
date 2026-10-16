"use client";
import { getDistinctCollectionProducts } from "../lib/products";
import ProductSection from "./ProductSection";

export default function MensWear() {
  const items = getDistinctCollectionProducts("men", ["best-seller", "new-arrival", "women"]);
  return (
    <ProductSection
      eyebrow="For Him"
      sectionId="mens-edit"
      heading="The Men's Edit"
      sub="Understated craftsmanship for the modern man."
      products={items}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

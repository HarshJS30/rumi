"use client";
import { getDistinctCollectionProducts } from "../lib/products";
import ProductSection from "./ProductSection";

export default function MensWear() {
  const items = getDistinctCollectionProducts("men", ["best-seller", "new-arrival", "women"]);
  return (
    <ProductSection
      sectionId="mens-edit"
      eyebrow="The Men's Edit"
      heading="For Him"
      sub="Understated craftsmanship for the modern man."
      products={items}
      showSizes={false}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

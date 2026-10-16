"use client";
import { getDistinctCollectionProducts } from "../lib/products";
import ProductSection from "./ProductSection";

export default function NewArrivals() {
  const items = getDistinctCollectionProducts("new-arrival", ["best-seller"]);
  return (
    <ProductSection
      eyebrow="New Arrivals"
      sectionId="new-arrivals"
      heading="This Season's Edit"
      sub="Freshly embroidered, freshly arrived — the newest additions to the collection."
      products={items}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

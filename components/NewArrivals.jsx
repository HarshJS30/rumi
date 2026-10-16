"use client";
import { getDistinctCollectionProducts } from "../lib/products";
import ProductSection from "./ProductSection";

export default function NewArrivals() {
  const items = getDistinctCollectionProducts("new-arrival", ["best-seller"]);
  return (
    <ProductSection
      sectionId="new-arrivals"
      eyebrow="This Season's Edit"
      heading="New Arrivals"
      sub="Freshly embroidered, freshly arrived — the newest additions to the collection."
      products={items}
      showSizes={false}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

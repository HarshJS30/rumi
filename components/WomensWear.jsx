"use client";
import { getDistinctCollectionProducts } from "../lib/products";
import ProductSection from "./ProductSection";

export default function WomensWear() {
  const items = getDistinctCollectionProducts("women", ["best-seller", "new-arrival"]);
  return (
    <ProductSection
      eyebrow="For Her"
      sectionId="womens-edit"
      heading="The Women's Edit"
      sub="Hand-embroidered Chikankari sets designed for everyday elegance."
      products={items}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

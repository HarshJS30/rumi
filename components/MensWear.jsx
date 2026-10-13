"use client";

import { products } from "../lib/products";
import ProductSection from "./ProductSection";

const mensProducts = products.filter(
  (product) =>
    product.available &&
    product.images.length > 0 &&
    /\bmen'?s?\b/i.test(product.name),
);

export default function MensWear() {
  return (
    <ProductSection
      eyebrow="For Him"
      sectionId="mens-edit"
      heading="The Men's Edit"
      sub="Understated craftsmanship for the modern man — fine hand embroidery, cut for effortless comfort."
      products={mensProducts}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

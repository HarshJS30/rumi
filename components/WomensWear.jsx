"use client";

import { products } from "../lib/products";
import ProductSection from "./ProductSection";

const womensProducts = products.filter(
  (product) =>
    product.available &&
    product.images.length > 0 &&
    !/\bmen'?s?\b|\bunisex\b/i.test(product.name),
).slice(0, 4);

export default function WomensWear() {
  return (
    <ProductSection
      eyebrow="For Her"
      sectionId="womens-edit"
      heading="The Women's Edit"
      sub="Hand-embroidered Chikankari sets designed for everyday elegance."
      products={womensProducts}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

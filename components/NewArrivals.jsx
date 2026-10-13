"use client";

import { products } from "../lib/products";
import ProductSection from "./ProductSection";

const womensProductIds = new Set(
  products
    .filter(
      (product) =>
        product.available &&
        product.images.length > 0 &&
        !/\bmen'?s?\b|\bunisex\b/i.test(product.name),
    )
    .slice(0, 7)
    .map((product) => product.id),
);

const newArrivalProducts = products
  .filter(
    (product) =>
      product.available &&
      product.images.length > 0 &&
      !womensProductIds.has(product.id),
  )
  .slice(0, 4);

export default function NewArrivals() {
  return (
    <ProductSection
      eyebrow="New Arrivals"
      sectionId="new-arrivals"
      heading="This Season's Edit"
      sub="Freshly embroidered, freshly arrived — the newest additions to the collection."
      products={newArrivalProducts}
      viewAllHref="/shop"
      viewAllLabel="View whole collection"
    />
  );
}

"use client";

import ProductSection from "./ProductSection";

const MENS_SIZES = ["S", "M", "L", "XL", "XXL"];

const products = [
  {
    name: "Charcoal Chikankari Kurta",
    price: "₹4,950",
    image: "/mens_wear_1.jpg",
    hoverImage: "/mens_wear_1_alt.jpg",
    href: "/shop/charcoal-chikankari-kurta",
    sizes: MENS_SIZES,
  },
  {
    name: "Ivory Straight Kurta",
    price: "₹4,450",
    image: "/mens_wear_2.jpg",
    hoverImage: "/mens_wear_2_alt.jpg",
    href: "/shop/ivory-straight-kurta-men",
    sizes: MENS_SIZES,
  },
  {
    name: "Sandstone Mukaish Kurta",
    price: "₹5,300",
    image: "/mens_wear_3.jpg",
    hoverImage: "/mens_wear_3_alt.jpg",
    href: "/shop/sandstone-mukaish-kurta",
    sizes: MENS_SIZES,
  },
  {
    name: "Beige Cutwork Kurta",
    price: "₹4,800",
    image: "/mens_wear_4.jpg",
    hoverImage: "/mens_wear_4_alt.jpg",
    href: "/shop/beige-cutwork-kurta",
    sizes: MENS_SIZES,
  },
];

export default function MensWear() {
  return (
    <ProductSection
      eyebrow="For Him"
      sectionId="mens-edit"
      heading="The Men's Edit"
      sub="Understated craftsmanship for the modern man — fine hand embroidery, cut for effortless comfort."
      products={products}
      viewAllHref="/shop/mens-wear"
      viewAllLabel="View All Men's Wear"
    />
  );
}
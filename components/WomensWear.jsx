"use client";

import ProductSection from "./ProductSection";

const products = [
  {
    name: "Anarkali White Set",
    price: "₹9,450",
    image: "/anarkali_white_heavy_1.png",
    hoverImage: "/anarkali_white_heavy_2.JPG",
    href: "/shop/anarkali-white-heavy",
  },
  {
    name: "Anarkali Yellow Set",
    price: "₹6,200",
    image: "/anarkali_yellow_1.jpg",
    hoverImage: "/anarkali_yellow_2.jpg",
    href: "/shop/anarkali-yellow",
  },
  {
    name: "Blue Chanderi Set",
    price: "₹5,600",
    image: "/blue_chanderi_1.jpg",
    hoverImage: "/blue_chanderi_2.jpg",
    href: "/shop/blue-chanderi",
  },
  {
    name: "Kota Chicken Blue Set",
    price: "₹7,100",
    image: "/kota_chicken_blue_1.jpg",
    hoverImage: "/kota_chicken_blue_2.jpg",
    href: "/shop/kota-chicken-blue",
  },
];

export default function WomensWear() {
  return (
    <ProductSection
      eyebrow="For Her"
      sectionId="womens-edit"
      heading="The Women's Edit"
      sub="Hand-embroidered Chikankari sets designed for everyday elegance."
      products={products}
      viewAllHref="/shop/womens-wear"
      viewAllLabel="View All Women's Wear"
    />
  );
}
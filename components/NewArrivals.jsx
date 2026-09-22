"use client";

import ProductSection from "./ProductSection";

const products = [
  {
    name: "Kota Chicken Orange Set",
    price: "₹6,850",
    image: "/kota_chicken_orange_1.jpg",
    hoverImage: "/kota_chicken_orange_2.jpg",
    href: "/shop/kota-chicken-orange",
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

export default function NewArrivals() {
  return (
    <ProductSection
      eyebrow="New Arrivals"
      sectionId="new-arrivals"
      heading="This Season's Edit"
      sub="Freshly embroidered, freshly arrived — the newest additions to the collection."
      products={products}
      viewAllHref="/shop/new-arrivals"
      viewAllLabel="View All New Arrivals"
    />
  );
}
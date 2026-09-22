"use client";

import { useState } from "react";
import styles from "./ProductCard.module.css";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];

export default function ProductCard({
  name,
  price,
  image,
  hoverImage,
  href = "#",
  sizes = DEFAULT_SIZES,
}) {
  const [selectedSize, setSelectedSize] = useState(null);

  return (
    <article className={styles.card}>
      <a href={href} className={styles.imageLink} aria-label={name}>
        <div className={styles.imageWrap}>
          <img src={image} alt={name} className={`${styles.image} ${styles.imageBase}`} />
          {hoverImage && (
            <img
              src={hoverImage}
              alt=""
              aria-hidden="true"
              className={`${styles.image} ${styles.imageHover}`}
            />
          )}
        </div>
      </a>

      <div className={styles.info}>
        <a href={href} className={styles.name}>
          {name}
        </a>

        <div className={styles.sizes}>
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={`${styles.sizePill} ${
                selectedSize === size ? styles.sizePillActive : ""
              }`}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </button>
          ))}
        </div>

        <span className={styles.price}>{price}</span>

        <button type="button" className={styles.addToCart}>
          Add to Cart
        </button>
      </div>
    </article>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "../lib/products";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const href = `/products/${product.slug}`;
  const name = product.name;

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.imageLink} aria-label={name}>
        <div className={styles.imageWrap}>
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={name}
              fill
              sizes="(min-width: 768px) 260px, 43vw"
              className={`${styles.image} ${styles.imageBase}`}
            />
          ) : (
            <span className={styles.placeholder}>Photos coming soon</span>
          )}
          {!product.available && <span className={styles.soldLabel}>Sold out</span>}
          {product.images[0] && product.images[1] && (
            <Image
              src={product.images[1]}
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 768px) 260px, 43vw"
              className={`${styles.image} ${styles.imageHover}`}
            />
          )}
        </div>
      </Link>

      <div className={styles.info}>
        <Link href={href} className={styles.name}>
          {name}
        </Link>

        {(product.sizes.length > 0 || product.size?.toLowerCase() === "freesize") && (
          <div className={styles.sizes} role="group" aria-label="Available sizes">
            {product.sizes.length > 0
              ? product.sizes.map(({ size, bookable }) => (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.sizePill} ${
                      selectedSize === size ? styles.sizePillActive : ""
                    }`}
                    aria-label={`Size ${size}${bookable ? "" : " unavailable"}`}
                    aria-pressed={selectedSize === size}
                    disabled={!product.available || !bookable}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))
              : <span className={styles.sizePill}>Free size</span>}
          </div>
        )}

        <span className={styles.price}>{formatPrice(product.basePrice)}</span>

        <Link
          href={href}
          className={styles.addToCart}
          style={{ textDecoration: "none", textAlign: "center" }}
        >
          View this product
        </Link>
      </div>
    </article>
  );
}

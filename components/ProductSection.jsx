"use client";

import ProductCard from "./ProductCard";
import Link from "next/link";
import styles from "./ProductSection.module.css";

export default function ProductSection({
  eyebrow,
  heading,
  sub,
  products,
  viewAllHref,
  viewAllLabel = "View All",
  sectionId,
}) {
  return (
    <section id={sectionId} className={styles.section}>
      <div className={styles.header}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>

      <div className={styles.scrollRow}>
        <div className={styles.scrollTrack}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {viewAllHref && (
        <Link href={viewAllHref} className={styles.viewAll}>
          {viewAllLabel}
        </Link>
      )}
    </section>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const scrollRowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const row = scrollRowRef.current;
    if (!row) return;

    setCanScrollLeft(row.scrollLeft > 1);
    setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const row = scrollRowRef.current;
    if (!row) return;

    updateScrollButtons();
    row.addEventListener("scroll", updateScrollButtons, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(row);
    resizeObserver.observe(row.firstElementChild ?? row);

    return () => {
      row.removeEventListener("scroll", updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [updateScrollButtons, products.length]);

  const scrollProducts = (direction) => {
    const row = scrollRowRef.current;
    if (!row) return;

    row.scrollBy({
      left: direction * row.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <section id={sectionId} className={styles.section}>
      <div className={styles.header}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>

      <div className={styles.carousel}>
        <div className={styles.scrollRow} ref={scrollRowRef}>
          <div className={styles.scrollTrack}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
        {canScrollLeft && (
          <button
            type="button"
            className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
            aria-label={`Scroll ${heading ?? "products"} left`}
            onClick={() => scrollProducts(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            className={`${styles.scrollButton} ${styles.scrollButtonRight}`}
            aria-label={`Scroll ${heading ?? "products"} right`}
            onClick={() => scrollProducts(1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </div>

      {viewAllHref && (
        <Link href={viewAllHref} className={styles.viewAll}>
          {viewAllLabel}
        </Link>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";

const slides = Array.from({ length: 12 }, (_, index) => ({
  image: `/hero-carousel/hero-${index + 1}.png`,
  label: `Rumi collection poster ${index + 1}`,
}));

const DURATION = 5000;

export default function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.hero} aria-label="Featured collections">
      <div className={styles.imageWrap}>
        <Image
          key={active}
          src={slides[active].image}
          alt={slides[active].label}
          fill
          sizes="100vw"
          priority={active === 0}
          className={styles.image}
        />

        <Link href="/shop" className={styles.cta}>
          View whole collection
        </Link>

        <div className={styles.dots} aria-label="Choose a collection poster">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={`${styles.dot} ${index === active ? styles.dotActive : ""}`}
              onClick={() => setActive(index)}
              aria-label={`Go to poster ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

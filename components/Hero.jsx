"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";

const slides = [
  {
    image: "/pink_anarkali_1.png",
    label: "New Arrivals",
  },
  {
    image: "/anarkali_white_heavy_1.png",
    label: "Festive Edit",
  },
  {
    image: "/kota_chicken_pink_green_1.png",
    label: "Summer Collection",
  },
];

const DURATION = 4000;

export default function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, DURATION);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index) => {
    if (index === active) return;
    setActive(index);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.imageWrap}>
        <Image
          key={active}
          src={slides[active].image}
          alt={slides[active].label}
          fill
          sizes="100vw"
          preload={active === 0}
          className={styles.image}
        />
        <div className={styles.scrim} />

        <div className={styles.content}>
          <span className={styles.eyebrow}>{slides[active].label}</span>
          <h1 className={styles.heading}>
            Fashion Woven<br />With Heritage
          </h1>
          <p className={styles.sub}>
            Handcrafted Lucknowi Chikankari — elegance in every stitch.
          </p>
          <Link href="/shop" className={styles.cta}>
            View whole collection
          </Link>
        </div>

        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

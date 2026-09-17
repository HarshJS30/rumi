"use client";

import { useEffect, useState } from "react";
import styles from "./Hero.module.css";

const slides = [
  {
    desktopImage: "/demo_pic4.png",
    mobileImage: "/demo_pic1.jpg",
    label: "New Arrivals",
  },
  {
    desktopImage: "/demo_pic5.png",
    mobileImage: "/demo_pic2.jpg",
    label: "Festive Edit",
  },
  {
    desktopImage: "/demo_pic6.png",
    mobileImage: "/demo_pic3.jpg",
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
        <picture key={active} className={styles.picture}>
          <source media="(max-width: 767px)" srcSet={slides[active].mobileImage} />
          <img
            src={slides[active].desktopImage}
            alt={slides[active].label}
            className={styles.image}
          />
        </picture>
        <div className={styles.scrim} />

        <div className={styles.content}>
          <span className={styles.eyebrow}>{slides[active].label}</span>
          <h1 className={styles.heading}>
            Fashion Woven<br />With Heritage
          </h1>
          <p className={styles.sub}>
            Handcrafted Lucknowi Chikankari — elegance in every stitch.
          </p>
          <a href="/shop" className={styles.cta}>
            Explore Collection
          </a>
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
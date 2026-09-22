"use client";

import { useEffect, useState } from "react";
import styles from "./Testimonials.module.css";

const testimonials = [
  {
    quote:
      "The chikankari was even more delicate in person than in the photos. It felt like receiving a piece of heritage, not just a kurta.",
    name: "Ananya R.",
    location: "Lucknow",
  },
  {
    quote:
      "I've bought from a few 'premium' ethnic labels before, but Rumi Studio is the first one where the embroidery actually matched what I saw online.",
    name: "Priyanka M.",
    location: "Delhi",
  },
  {
    quote:
      "Wore the sage set to a family lunch — elegant without trying too hard. Exactly the quiet luxury I was looking for.",
    name: "Kavya S.",
    location: "Bengaluru",
  },
];

const DURATION = 6000;

export default function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, DURATION);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index) => {
    if (index === active) return;
    setActive(index);
  };

  return (
    <section id="reviews" className={styles.section}>
      <span className={styles.eyebrow}>In Their Words</span>

      <blockquote key={active} className={styles.quoteBlock}>
        <p className={styles.quote}>&ldquo;{testimonials[active].quote}&rdquo;</p>
        <footer className={styles.attribution}>
          <span className={styles.name}>{testimonials[active].name}</span>
          <span className={styles.location}>{testimonials[active].location}</span>
        </footer>
      </blockquote>

      <div className={styles.dots}>
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Show testimonial ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import styles from "./Navbar.module.css";

const links = [
  { label: "New Arrivals", href: "#new-arrivals" },
  { label: "Women", href: "#womens-edit" },
  { label: "Men", href: "#mens-edit" },
];

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <a href="#top" className={styles.logo} aria-label="Rumi Studio home">
        <Image
          src="/Rumi_RGB_Black.png"
          alt="Rumi Studio"
          width={132}
          height={40}
          className={styles.logoImage}
          priority
        />
      </a>

      <nav className={styles.nav} aria-label="Main navigation">
        {links.map((link) => (
          <a key={link.href} href={link.href} className={styles.link}>
            {link.label}
          </a>
        ))}
      </nav>

      <a href="/shop" className={styles.shopLink} aria-label="Shop">
        <ShoppingBag size={20} strokeWidth={1.6} aria-hidden="true" />
      </a>
    </header>
  );
}
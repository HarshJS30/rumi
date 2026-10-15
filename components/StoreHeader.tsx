"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "../lib/cart";
import SearchControl from "./SearchControl";

export default function StoreHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return (
    <header className="store-header">
      <Link className="brand" href="/" aria-label="Rumi Studio home">
        <Image
          src="/Rumi_RGB_Black.png"
          alt="Rumi Studio"
          width={172}
          height={52}
          priority
        />
      </Link>
      <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
        <Link onClick={() => setOpen(false)} href="/#new-arrivals">New Arrivals</Link>
        <Link onClick={() => setOpen(false)} href="/shop#products">Bestsellers</Link>
        <Link onClick={() => setOpen(false)} href="/#womens-edit">Women</Link>
        <Link onClick={() => setOpen(false)} href="/#mens-edit">Men</Link>
      </nav>
      <div className="header-actions">
        <SearchControl />
        <Link className="cart-link" href="/cart" aria-label={`Shopping bag, ${count} items`}>
          <ShoppingBag size={20} />
          <span>Bag</span>
          {count > 0 && <b>{count}</b>}
        </Link>
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

"use client";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "../lib/cart";

export default function StoreHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return <header className="store-header"><Link className="brand" href="/" aria-label="Rumi Studio home">RUMI<span>STUDIO</span></Link><nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Main navigation"><Link onClick={() => setOpen(false)} href="/shop">Shop all</Link><Link onClick={() => setOpen(false)} href="/#collection">The collection</Link><Link onClick={() => setOpen(false)} href="/#about">Our story</Link></nav><div className="header-actions"><Link className="cart-link" href="/cart" aria-label={`Shopping bag, ${count} items`}><ShoppingBag size={20}/><span>Bag</span>{count > 0 && <b>{count}</b>}</Link><button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div></header>;
}

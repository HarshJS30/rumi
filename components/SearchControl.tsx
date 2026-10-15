"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./SearchControl.module.css";

export default function SearchControl() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className={styles.searchControl}>
      <button
        type="button"
        className={styles.toggle}
        aria-label={open ? "Close search" : "Search products"}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {open ? <X size={19} strokeWidth={1.6} /> : <Search size={19} strokeWidth={1.6} />}
      </button>
      {open && (
        <form className={styles.panel} action="/shop" role="search">
          <label className={styles.visuallyHidden} htmlFor="site-search">
            Search products
          </label>
          <input
            ref={inputRef}
            id="site-search"
            name="q"
            type="search"
            placeholder="Search the collection"
            autoComplete="off"
          />
          <button type="submit" aria-label="Submit search">
            <Search size={18} strokeWidth={1.6} />
          </button>
        </form>
      )}
    </div>
  );
}

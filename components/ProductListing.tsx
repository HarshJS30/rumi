"use client";

import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { formatPrice, products } from "../lib/products";

type ProductListingProps = {
  initialQuery?: string;
};

export default function ProductListing({
  initialQuery = "",
}: ProductListingProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [category, setCategory] = useState("All pieces");
  const [colorsSelected, setColorsSelected] = useState<string[]>([]);
  const [fabric, setFabric] = useState("All fabrics");
  const filterProducts = products;
  const categories = [...new Set(filterProducts.map((product) => product.category).filter((value): value is string => Boolean(value)))];
  const colors = [...new Set(filterProducts.flatMap((product) => product.colorGroup ?? []))].sort();
  const fabrics = [...new Set(filterProducts.map((product) => product.fabric).filter((value): value is string => Boolean(value)))];
  const normalizedQuery = initialQuery.trim().toLocaleLowerCase();

  const shown = useMemo(
    () =>
      filterProducts.filter((product) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            product.websiteName,
            product.name,
            product.color,
            ...(product.colorGroup ?? []),
            product.category,
            product.fabric,
          ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));

        return (
          matchesQuery &&
          (category === "All pieces" || product.category === category) &&
          (colorsSelected.length === 0 || colorsSelected.some((color) => product.colorGroup?.includes(color))) &&
          (fabric === "All fabrics" || product.fabric === fabric)
        );
      }),
    [category, colorsSelected, fabric, normalizedQuery],
  );

  const clearFilters = () => {
    setCategory("All pieces");
    setColorsSelected([]);
    setFabric("All fabrics");
  };

  return (
    <main>
      <section className="collection-hero" id="collection">
        <p className="eyebrow">Rumi Studio · A considered wardrobe</p>
        <h1>Pieces to keep close.</h1>
        <p>
          Discover easy silhouettes and thoughtful details, made for the
          moments that make a day.
        </p>
        <a href="#products" className="text-link">
          Explore the collection <span aria-hidden="true">↓</span>
        </a>
      </section>
      <section className="catalogue" id="products">
        <div className="catalogue-heading">
          <div>
            <p className="eyebrow">The collection</p>
            <h2>Shop all pieces</h2>
          </div>
          <button
            className="filter-trigger"
            onClick={() => setFilterOpen(!filterOpen)}
            aria-expanded={filterOpen}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
        {filterOpen && (
          <div className="filter-panel">
            <label>
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>All pieces</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <fieldset className="color-filter">
              <legend>Color</legend>
              {colors.map((item) => {
                const count = filterProducts.filter((product) => product.colorGroup?.includes(item)).length;
                return <label key={item}>
                  <input type="checkbox" checked={colorsSelected.includes(item)} onChange={(event) => setColorsSelected((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))} />
                  {item} <span>({count})</span>
                </label>;
              })}
            </fieldset>
            <label>
              Fabric
              <select
                value={fabric}
                onChange={(event) => setFabric(event.target.value)}
              >
                <option>All fabrics</option>
                {fabrics.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button className="clear-filter" onClick={clearFilters}>
              Clear
            </button>
          </div>
        )}
        <p className="results-count">
          {normalizedQuery && <>Search results for “{initialQuery}” · </>}
          {shown.length} pieces
        </p>
        {shown.length ? (
          <div className="product-grid">
            {shown.map((product) => (
              <article
                className={`product-card ${!product.available ? "sold-out" : ""}`}
                key={product.id}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="product-image"
                >
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.websiteName}
                      fill
                      sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
                    />
                  ) : (
                    <span className="missing-product-image">Photos coming soon</span>
                  )}
                  {!product.available && (
                    <span className="sold-label">Sold out</span>
                  )}
                </Link>
                <div className="product-meta">
                  <Link
                    href={`/products/${product.slug}`}
                    className="product-name"
                  >
                    {product.websiteName}
                  </Link>
                  <span>{formatPrice(product.basePrice)}</span>
                </div>
                <p className="product-detail-meta">
                  {[product.color, product.category].filter(Boolean).join(" · ")}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-filter">
            <p>No pieces match this search and these filters.</p>
            <button onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </section>
    </main>
  );
}

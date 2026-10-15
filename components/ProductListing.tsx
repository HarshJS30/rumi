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
  const [color, setColor] = useState("All colors");
  const [fabric, setFabric] = useState("All fabrics");
  const [availability, setAvailability] = useState(false);
  const categories = [...new Set(products.map((product) => product.category))];
  const colors = [...new Set(products.map((product) => product.color))];
  const fabrics = [...new Set(products.map((product) => product.fabric))];
  const normalizedQuery = initialQuery.trim().toLocaleLowerCase();

  const shown = useMemo(
    () =>
      products.filter((product) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            product.websiteName,
            product.name,
            product.color,
            product.category,
            product.fabric,
          ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));

        return (
          matchesQuery &&
          (category === "All pieces" || product.category === category) &&
          (color === "All colors" || product.color === color) &&
          (fabric === "All fabrics" || product.fabric === fabric) &&
          (!availability || product.available)
        );
      }),
    [availability, category, color, fabric, normalizedQuery],
  );

  const clearFilters = () => {
    setCategory("All pieces");
    setColor("All colors");
    setFabric("All fabrics");
    setAvailability(false);
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
            <label>
              Color
              <select
                value={color}
                onChange={(event) => setColor(event.target.value)}
              >
                <option>All colors</option>
                {colors.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
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
            <label className="availability-filter">
              <input
                type="checkbox"
                checked={availability}
                onChange={(event) => setAvailability(event.target.checked)}
              />
              Available pieces
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
                    <span className="missing-product-image">
                      Photograph coming soon
                    </span>
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
                  {product.color} · {product.category}
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

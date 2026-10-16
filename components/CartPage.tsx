"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, lineUnitPrice } from "../lib/cart";
import { formatPrice } from "../lib/products";

const WHATSAPP_NUMBER = "918796677991";

export default function CartPage() {
  const { lines, hydrated, subtotal, setQuantity, remove } = useCart();

  function checkout() {
    if (!hydrated || !lines.length) return;

    const items = lines
      .map(
        (line, index) =>
          `${index + 1}. ${line.name}\n   ${
            line.setName ? `Set: ${line.setName}\n   ` : ""
          }${line.size ? `Size: ${line.size}\n   ` : ""}Quantity: ${
            line.quantity
          }\n   Base price: ${formatPrice(line.basePrice)}\n   ${
            line.options.length
              ? `Options: ${line.options
                  .map(
                    (option) =>
                      `${option.name} (+${formatPrice(option.priceAdjustment)})`,
                  )
                  .join(", ")}`
              : "Options: None"
          }${line.isStitched && line.note ? `\n   ${line.note}` : ""}\n   Unit price: ${formatPrice(
            lineUnitPrice(line),
          )}\n   Line total: ${formatPrice(
            lineUnitPrice(line) * line.quantity,
          )}`,
      )
      .join("\n\n");
    const message = `Hello, I would like to place an order.\n\nORDER DETAILS\n\n${items}\n\n--------------------------------\nSubtotal: ${formatPrice(
      subtotal,
    )}\n--------------------------------\n\nPlease confirm availability and order details.`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (!hydrated) {
    return (
      <main className="cart-page">
        <p className="eyebrow">Your bag</p>
        <h1>Your shopping bag</h1>
        <p className="loading-cart">Loading your bag…</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <p className="eyebrow">
        Your bag · {lines.reduce((count, line) => count + line.quantity, 0)} items
      </p>
      <h1>Your shopping bag</h1>
      {!lines.length ? (
        <div className="empty-cart">
          <p>Your bag is waiting for something special.</p>
          <Link className="primary-button" href="/">
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Cart items">
            {lines.map((line) => (
              <article className="cart-line" key={line.key}>
                <Link
                  className="cart-thumb"
                  href={`/products/${line.slug}`}
                  aria-label={line.name}
                >
                  {line.image ? (
                    <Image src={line.image} alt="" fill sizes="120px" />
                  ) : (
                    <span className="missing-cart-image">
                      Photograph unavailable
                    </span>
                  )}
                </Link>
                <div className="cart-line-info">
                  <Link
                    href={`/products/${line.slug}`}
                    className="product-name"
                  >
                    {line.name}
                  </Link>
                  <p>
                    {[
                      line.setName,
                      line.size ? `Size ${line.size}` : null,
                      ...line.options.map(
                        (option) =>
                          `${option.name} (+${formatPrice(option.priceAdjustment)})`,
                      ),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No options selected"}
                  </p>
                  {line.isStitched && line.note && (
                    <small className="stitched-note cart-stitched-note">{line.note}</small>
                  )}
                  <span>{formatPrice(lineUnitPrice(line))} each</span>
                  <div className="cart-controls">
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          setQuantity(line.key, line.quantity - 1)
                        }
                        aria-label={`Decrease ${line.name} quantity`}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        onClick={() =>
                          setQuantity(line.key, line.quantity + 1)
                        }
                        aria-label={`Increase ${line.name} quantity`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="remove-button"
                      onClick={() => remove(line.key)}
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>
                <strong className="line-total">
                  {formatPrice(lineUnitPrice(line) * line.quantity)}
                </strong>
              </article>
            ))}
          </section>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <p>
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </p>
            <small>
              Shipping and final availability will be confirmed with you on
              WhatsApp.
            </small>
            <button className="primary-button" onClick={checkout}>
              Order via WhatsApp
            </button>
            <Link className="continue-shopping" href="/">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

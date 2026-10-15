"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useCart } from "../lib/cart";
import ProductStory from "./ProductStory";
import {
  formatPrice,
  getRelatedProducts,
  type Product,
} from "../lib/products";

const WHATSAPP_NUMBER = "918796677991";

export default function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const [imageIndex, setImageIndex] = useState(0);
  const [setOptionId, setSetOptionId] = useState(product.setOptions[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [addedToBag, setAddedToBag] = useState(false);
  const selectedSet = product.setOptions.find((option) => option.id === setOptionId);
  const price = selectedSet?.price ?? product.basePrice;
  const hasBookableSizes = product.sizes.some((size) => size.bookable);
  const relatedProducts = getRelatedProducts(product);
  const orderMessage = [
    "Hello Rumi Studio, I would like to order:",
    product.websiteName,
    `Set: ${selectedSet?.name ?? "Please advise"}`,
    ...(selectedSize ? [`Size: ${selectedSize}`] : []),
    `Quantity: ${quantity}`,
    `Price: ${formatPrice(price * quantity)}`,
    `Product: ${product.slug}`,
  ].join("\n");
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderMessage)}`;

  const showImage = (index: number) => {
    setImageIndex((index + product.images.length) % product.images.length);
  };

  return (
    <main className="detail-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.websiteName}</span>
      </nav>

      <div className="detail-layout">
        <section className="gallery" aria-label="Product images">
          <div className="gallery-main">
            {product.images.length > 0 ? (
              <Image
                src={product.images[imageIndex]}
                alt={`${product.websiteName}, view ${imageIndex + 1}`}
                fill
                loading="eager"
                sizes="(max-width: 760px) 100vw, 56vw"
              />
            ) : (
              <div className="missing-product-image">Photograph coming soon</div>
            )}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow-prev"
                  aria-label="Previous product image"
                  onClick={() => showImage(imageIndex - 1)}
                >
                  <ChevronLeft size={23} />
                </button>
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow-next"
                  aria-label="Next product image"
                  onClick={() => showImage(imageIndex + 1)}
                >
                  <ChevronRight size={23} />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="gallery-thumbs" aria-label="Choose a product image">
              {product.images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  className={index === imageIndex ? "thumb active" : "thumb"}
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === imageIndex ? "true" : undefined}
                  onClick={() => showImage(index)}
                >
                  <Image src={src} alt="" fill sizes="72px" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="product-info">
          <p className="eyebrow">Rumi Studio · {product.category}</p>
          <h1>{product.websiteName}</h1>
          <p className="detail-color">{product.color}</p>
          <p className="detail-price">{formatPrice(price)}</p>
          <p className="tax-note">Prices are in Indian Rupees.</p>

          <fieldset className="set-picker">
            <legend>Sets</legend>
            <div className="set-options">
              {product.setOptions.map((option) => (
                <label
                  key={option.id}
                  className={
                    option.id === setOptionId
                      ? "set-option selected"
                      : "set-option"
                  }
                >
                  <input
                    type="radio"
                    name="product-set"
                    value={option.id}
                    checked={option.id === setOptionId}
                    onChange={() => setSetOptionId(option.id)}
                  />
                  <span>{option.name}</span>
                  <strong>{formatPrice(option.price)}</strong>
                </label>
              ))}
            </div>
          </fieldset>

          {product.sizes.length > 0 && (
            <fieldset className="set-picker">
              <legend>Size</legend>
              <div className="set-options">
                {product.sizes.map(({ size, bookable }) => (
                  <label
                    key={size}
                    className={
                      size === selectedSize
                        ? "set-option selected"
                        : "set-option"
                    }
                  >
                    <input
                      type="radio"
                      name={`product-size-${product.id}`}
                      value={size}
                      checked={size === selectedSize}
                      disabled={!bookable}
                      onChange={() => setSelectedSize(size)}
                    />
                    <span>{size}</span>
                    {!bookable && <small>Unavailable</small>}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="quantity-picker">
            <span>Quantity</span>
            <div className="quantity-control" aria-label="Quantity">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {product.available ? (
            <>
              <button
                type="button"
                className="primary-button whatsapp-order"
                disabled={hasBookableSizes && selectedSize === null}
                onClick={() => {
                  add(product, [], quantity, setOptionId, selectedSize ?? undefined);
                  setAddedToBag(true);
                }}
              >
                {hasBookableSizes && selectedSize === null
                  ? "Choose a size to add to bag"
                  : "Add to bag"}
              </button>
              {addedToBag && (
                <p aria-live="polite" className="tax-note">
                  Added to your bag.
                </p>
              )}
              <a
                className="primary-button whatsapp-order"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                Order through WhatsApp
              </a>
            </>
          ) : (
            <button className="primary-button whatsapp-order" disabled>
              Sold out
            </button>
          )}

          <section className="product-details" aria-labelledby="details-title">
            <h2 id="details-title">Product details</h2>
            <table>
              <tbody>
                <tr>
                  <th scope="row">Fabric</th>
                  <td>{product.fabric}</td>
                </tr>
                <tr>
                  <th scope="row">Colour</th>
                  <td>{product.color}</td>
                </tr>
                <tr>
                  <th scope="row">Silhouette</th>
                  <td>{product.silhouette}</td>
                </tr>
                <tr>
                  <th scope="row">Pattern</th>
                  <td>{product.pattern}</td>
                </tr>
                <tr>
                  <th scope="row">Dyeable</th>
                  <td>{product.dyeable ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <th scope="row">Length</th>
                  <td>{product.length}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="product-accordions">
            <ProductStory />
            <details>
              <summary>Returns &amp; exchanges</summary>
              <p>
                We want you to feel confident about your Rumi purchase. Our
                simple policy:
              </p>
              <ul className="policy-list">
                <li>7-day return &amp; exchange window from the date of delivery.</li>
                <li>Products must be unworn, unwashed and unaltered, with original tags and packaging intact.</li>
                <li>One complimentary size exchange is available, subject to availability.</li>
                <li>For eligible returns, the product value will be refunded after the item reaches us and passes our quality check. Applicable return shipping charges may be deducted.</li>
                <li>Sale, customised, altered and Final Sale products are not eligible for return or exchange.</li>
                <li>If you receive a damaged, defective or incorrect product, please contact us within 48 hours. We will arrange a replacement or full refund where the issue is confirmed to be on our end.</li>
                <li>As our pieces are handcrafted, minor variations in embroidery, texture or finish are natural and not considered defects.</li>
                <li>Unsure about the colour, fit or details? Speak to our team or request a video call to see the actual product before ordering.</li>
              </ul>
            </details>
            <details>
              <summary>Garment care</summary>
              <p>
                Rumi pieces are handcrafted with delicate embroidery and
                detailing, and deserve to be cared for gently.
              </p>
              <ul className="policy-list">
                <li>Dry clean only.</li>
                <li>Avoid soaking, scrubbing, wringing or twisting the garment.</li>
                <li>Do not use bleach or harsh chemicals.</li>
                <li>Dry and store away from direct sunlight and moisture.</li>
                <li>Iron on the reverse side on a gentle setting. Avoid placing the iron directly over embroidery, Mukaish, Kaamdani, Pitta, pearls or other embellishments.</li>
                <li>Store your garment clean and completely dry, preferably folded or hung in a breathable cotton/muslin cover.</li>
                <li>Avoid prolonged exposure to perfumes, deodorants or other chemicals directly on the embroidered areas.</li>
              </ul>
            </details>
            <details>
              <summary>Product image disclaimer</summary>
              <p>
                We make every effort to represent our products as accurately as
                possible in terms of colour, embroidery, fabric, silhouette and
                detailing.
              </p>
              <p>
                Some images on our website may be AI-assisted or digitally
                enhanced for visual presentation and styling. While we take great
                care to maintain the authenticity of the actual product, minor
                visual differences or inaccuracies may occasionally occur.
              </p>
              <p>
                For the most accurate representation, we recommend referring to
                the original product photographs wherever provided. Still unsure?
                We would be happy to help. You can request a video call with our
                team to view the actual product before placing your order.
              </p>
            </details>
          </div>
        </section>
      </div>

      {relatedProducts.length > 0 && (
        <section className="related-products" aria-labelledby="related-title">
          <p className="eyebrow">A little more to love</p>
          <h2 id="related-title">You may also like</h2>
          <div className="product-grid">
            {relatedProducts.map((related) => (
              <article className="product-card" key={related.id}>
                <Link
                  href={`/products/${related.slug}`}
                  className="product-image"
                >
                  <Image
                    src={related.images[0]}
                    alt={related.websiteName}
                    fill
                    sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
                  />
                </Link>
                <div className="product-meta">
                  <Link
                    href={`/products/${related.slug}`}
                    className="product-name"
                  >
                    {related.websiteName}
                  </Link>
                  <span>{formatPrice(related.basePrice)}</span>
                </div>
                <p className="product-detail-meta">
                  {related.color} · {related.category}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

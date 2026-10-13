import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ProductDetail from "../../../components/ProductDetail";
import { getProduct, productSlugAliases, products } from "../../../lib/products";

export function generateStaticParams() {
  return [
    ...products.map((product) => ({ slug: product.slug })),
    ...Object.keys(productSlugAliases).map((slug) => ({ slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  return product
    ? {
        title: `${product.websiteName} | Rumi Studio`,
        description: `${product.websiteName} in ${product.fabric}. Explore product details and order through WhatsApp.`,
      }
    : { title: "Piece not found | Rumi Studio" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  if (product.slug !== slug) permanentRedirect(`/products/${product.slug}`);

  return <ProductDetail product={product} />;
}

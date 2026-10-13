import type { Metadata } from "next";
import "./globals.css";
import "./store.css";
import { CartProvider } from "../lib/cart";
import StoreChrome from "../components/StoreChrome";

export const metadata: Metadata = {
  title: "Rumi Studio | Thoughtful Indian Wear",
  description: "Explore thoughtful kurtas and occasion wear from Rumi Studio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <CartProvider><StoreChrome>{children}</StoreChrome></CartProvider>
      </body>
    </html>
  );
}

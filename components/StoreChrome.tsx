"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";

export default function StoreChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return children;
  return <div className="store-shell"><StoreHeader />{children}<StoreFooter /></div>;
}

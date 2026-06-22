import { Shell } from "@/components/layout/Shell";
import type { ReactNode } from "react";

export default function DataLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}

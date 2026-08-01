import type { HTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/10", className)} {...props} />;
}

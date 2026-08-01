import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-cyan-300 text-slate-950 hover:bg-cyan-200 focus-visible:ring-cyan-300 ring-offset-slate-950",
        secondary: "border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 focus-visible:ring-slate-300 ring-offset-slate-950",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Button({ className, variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}

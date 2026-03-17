import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-primary/80 bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-primary/30 bg-primary/12 text-primary [a&]:hover:bg-primary/18 dark:border-primary/35 dark:bg-primary/18 dark:text-primary",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-amber-200 bg-amber-50 text-amber-800 [a&]:hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
        ghost:
          "border-violet-200 bg-violet-50 text-violet-700 [a&]:hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

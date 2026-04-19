import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-semibold transition-[background,border,color,transform] duration-150 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-hover",
        secondary:
          "bg-surface text-primary border border-border-default hover:bg-hover",
        ghost: "text-secondary hover:bg-hover hover:text-primary",
        outline:
          "text-primary border border-border-default bg-transparent hover:bg-hover",
        destructive:
          "bg-danger text-white hover:opacity-90",
        link: "text-accent font-medium underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 text-[14px]",
        sm: "h-9 px-4 text-[13px] font-semibold",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

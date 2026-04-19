import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-border-default bg-surface px-3.5 text-[14px] text-primary placeholder:text-tertiary",
      "focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--accent-subtle)]",
      "transition-[border-color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full rounded-md border border-border-default bg-surface px-3 py-2 text-base text-primary placeholder:text-tertiary",
      "focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--accent-subtle)]",
      "transition-[border-color,box-shadow] duration-150 min-h-[120px] resize-none",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium text-secondary", className)}
    {...props}
  />
));
Label.displayName = "Label";

export function SectionLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "text-xs font-medium text-tertiary uppercase tracking-[0.06em]",
        className,
      )}
    >
      {children}
    </div>
  );
}

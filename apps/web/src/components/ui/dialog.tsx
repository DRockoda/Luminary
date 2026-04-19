import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-[4px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    position?: "center" | "bottom-sheet";
    showClose?: boolean;
  }
>(({ className, children, position = "center", showClose = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-dialog-position={position}
      className={cn(
        "fixed z-50 bg-elevated border border-border-strong text-primary shadow-lg outline-none",
        position === "center"
          ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[500px] rounded-xl p-7 animate-modal-in"
          : "left-0 right-0 bottom-0 rounded-t-2xl px-6 pt-5 pb-7 animate-sheet-in",
        className,
      )}
      {...props}
    >
      {position === "bottom-sheet" && (
        <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-border-strong" aria-hidden />
      )}
      {children}
      {showClose && (
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute top-3 right-3 p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-6 flex flex-col gap-1", className)} {...props} />
);

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-[20px] font-semibold text-primary", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-base text-secondary", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

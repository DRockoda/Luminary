import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "page-container mx-auto w-full max-w-[1100px] px-4 py-5 md:px-10 md:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

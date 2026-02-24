import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "destructive" | "success" | "secondary";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        variant === "default"
          ? "bg-black text-white"
          : variant === "destructive"
            ? "bg-red-600 text-white"
            : variant === "success"
              ? "bg-green-600 text-white"
              : variant === "secondary"
                ? "bg-gray-200 text-gray-800"
                : "border border-border text-foreground",
        className,
      )}
      {...props}
    />
  );
}

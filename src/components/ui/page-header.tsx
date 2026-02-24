// src/components/ui/page-header.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    total?: number;
    totalLabel?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, total, totalLabel = "total", children, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    {total !== undefined && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                            {total.toLocaleString()} {totalLabel}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
            {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
        </div>
    );
}

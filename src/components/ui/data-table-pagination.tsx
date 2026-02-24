// src/components/ui/data-table-pagination.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTablePaginationProps {
    currentPage: number;
    totalPages: number;
    total: number;
    limit?: number;
}

export function DataTablePagination({
    currentPage,
    totalPages,
    total,
    limit = 20,
}: DataTablePaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        router.push(`?${params.toString()}`);
    };

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    if (total === 0) return null;

    return (
        <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{start}–{end}</span> of{" "}
                <span className="font-medium">{total}</span>
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </Button>
                <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

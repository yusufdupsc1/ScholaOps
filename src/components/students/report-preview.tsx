"use client";

import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { templateLabel } from "@/components/students/template-selector";

export interface StudentRecordItem {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  periodType: string;
  periodLabel: string;
  recordType: string;
  source: string;
  generatedAt: string;
}

interface ReportPreviewProps {
  loading: boolean;
  selectedStudentName: string;
  grouped: Record<string, StudentRecordItem[]>;
  onRegenerate: (record: StudentRecordItem) => void;
  regeneratingId: string | null;
}

export function ReportPreview({
  loading,
  selectedStudentName,
  grouped,
  onRegenerate,
  regeneratingId,
}: ReportPreviewProps) {
  const groups = Object.entries(grouped);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Generated Records</h2>
        {selectedStudentName ? <p className="text-sm text-muted-foreground">{selectedStudentName}</p> : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading records...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records generated yet.</p>
      ) : (
        <div className="space-y-4">
          {groups.map(([groupKey, items]) => (
            <div key={groupKey} className="rounded-lg border border-border p-3">
              <p className="mb-3 text-sm font-medium">{groupKey.replace(":", " - ")}</p>
              <div className="space-y-2">
                {items.map((record) => (
                  <div key={record.id} className="flex flex-col gap-2 rounded-md border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{record.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {templateLabel(record.recordType)} · {new Date(record.generatedAt).toLocaleString()}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {record.source}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <a href={record.fileUrl} download={record.fileName}>
                        <Button type="button" size="sm" variant="outline">
                          <Download className="mr-1 h-3.5 w-3.5" /> Download
                        </Button>
                      </a>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onRegenerate(record)}
                        disabled={regeneratingId === record.id}
                      >
                        <RefreshCw className={`mr-1 h-3.5 w-3.5 ${regeneratingId === record.id ? "animate-spin" : ""}`} />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

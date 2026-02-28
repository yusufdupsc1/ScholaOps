"use client";

import { useMemo, useState } from "react";
import { Download, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  previewRecordId?: string | null;
  onPreviewRecordHandled?: () => void;
}

export function ReportPreview({
  loading,
  selectedStudentName,
  grouped,
  onRegenerate,
  regeneratingId,
  previewRecordId = null,
  onPreviewRecordHandled,
}: ReportPreviewProps) {
  const [manualPreviewId, setManualPreviewId] = useState<string | null>(null);
  const groups = Object.entries(grouped);
  const recordById = useMemo(
    () =>
      Object.fromEntries(
        Object.values(grouped)
          .flat()
          .map((record) => [record.id, record]),
      ) as Record<string, StudentRecordItem>,
    [grouped],
  );

  const activePreviewId = manualPreviewId ?? previewRecordId ?? null;
  const previewRecord = activePreviewId ? recordById[activePreviewId] ?? null : null;

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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setManualPreviewId(record.id);
                          onPreviewRecordHandled?.();
                        }}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                      </Button>
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

      <Dialog
        open={Boolean(previewRecord)}
        onOpenChange={(open) => {
          if (open) return;
          if (manualPreviewId) {
            setManualPreviewId(null);
            return;
          }
          onPreviewRecordHandled?.();
        }}
      >
        <DialogContent className="w-[min(96vw,72rem)] max-w-5xl p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>{previewRecord?.title ?? "Record Preview"}</DialogTitle>
            <DialogDescription>
              {previewRecord ? `${templateLabel(previewRecord.recordType)} · ${new Date(previewRecord.generatedAt).toLocaleString()}` : ""}
            </DialogDescription>
          </DialogHeader>

          {previewRecord ? (
            <div className="space-y-3">
              <div className="h-[70svh] overflow-hidden rounded-lg border border-border">
                <iframe
                  title={`${previewRecord.title} Preview`}
                  src={previewRecord.fileUrl}
                  className="h-full w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <a
                  href={previewRecord.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Open in new tab
                </a>
                <a href={previewRecord.fileUrl} download={previewRecord.fileName}>
                  <Button type="button" size="sm">
                    <Download className="mr-1 h-3.5 w-3.5" /> Download
                  </Button>
                </a>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

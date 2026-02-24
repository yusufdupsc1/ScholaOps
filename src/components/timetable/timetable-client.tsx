// src/components/timetable/timetable-client.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  type TimetableFormData,
} from "@/server/actions/timetable";

type Subject = { id: string; name: string; code: string };
type Teacher = { id: string; firstName: string; lastName: string };
type Class = { id: string; name: string; grade: string; section: string };
type TimetableEntry = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  subject: { name: string; code: string };
  teacher: { firstName: string; lastName: string } | null;
  class: { name: string };
};
type DaySchedule = { day: string; dayIndex: number; entries: TimetableEntry[] };

interface Props {
  classes: Class[];
  timetable: DaySchedule[];
  selectedClassId: string;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function TimetableForm({
  initial,
  classes,
  onSuccess,
}: {
  initial?: TimetableEntry;
  classes: Class[];
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<TimetableFormData>({
    classId: initial?.class.name
      ? classes.find((c) => c.name === initial.class.name)?.id || ""
      : "",
    subjectId: "",
    teacherId: "",
    dayOfWeek: initial?.dayOfWeek ?? 1,
    startTime: initial?.startTime ?? "08:00",
    endTime: initial?.endTime ?? "09:00",
    roomNumber: initial?.roomNumber ?? "",
  });

  const set = (k: keyof TimetableFormData, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = initial
        ? await updateTimetableEntry(initial.id, form)
        : await createTimetableEntry(form);
      if (res.success) {
        toast.success(initial ? "Timetable updated" : "Timetable entry added");
        onSuccess();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Class *</Label>
        <Select
          value={form.classId}
          onValueChange={(v) => set("classId", v)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Day *</Label>
        <Select
          value={String(form.dayOfWeek)}
          onValueChange={(v) => set("dayOfWeek", Number(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((d, i) => (
              <SelectItem key={i} value={String(i)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start Time *</Label>
          <Input
            type="time"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>End Time *</Label>
          <Input
            type="time"
            value={form.endTime}
            onChange={(e) => set("endTime", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Room</Label>
        <Input
          value={form.roomNumber ?? ""}
          onChange={(e) => set("roomNumber", e.target.value)}
          placeholder="e.g. Room 101"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : initial ? "Update Entry" : "Add Entry"}
      </Button>
    </form>
  );
}

export function TimetableClient({
  classes,
  timetable,
  selectedClassId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null);
  const [, startTransition] = useTransition();

  const handleClassChange = (classId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (classId) params.set("classId", classId);
    else params.delete("classId");
    router.push(`?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this timetable entry?")) return;
    startTransition(async () => {
      const res = await deleteTimetableEntry(id);
      if (res.success) toast.success("Entry deleted");
      else toast.error(res.error);
    });
  };

  return (
    <>
      <PageHeader title="Timetable" description="Manage class schedules">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditEntry(null)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
              </DialogTitle>
            </DialogHeader>
            <TimetableForm
              initial={editEntry ?? undefined}
              classes={classes}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <Select
          value={selectedClassId || "all"}
          onValueChange={handleClassChange}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {timetable.map(({ day, dayIndex, entries }) => (
          <div
            key={dayIndex}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div
              className={`px-4 py-3 border-b ${dayIndex === 0 || dayIndex === 6 ? "bg-muted/50" : "bg-primary/10"}`}
            >
              <h3 className="font-semibold text-sm">{day}</h3>
              <p className="text-xs text-muted-foreground">
                {entries.length} periods
              </p>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {entries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No classes
                </p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-border bg-background p-2 text-xs hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {entry.startTime} - {entry.endTime}
                      </span>
                    </div>
                    <p className="font-semibold">{entry.subject.name}</p>
                    {entry.teacher && (
                      <p className="text-muted-foreground">
                        {entry.teacher.firstName} {entry.teacher.lastName}
                      </p>
                    )}
                    {entry.roomNumber && (
                      <p className="text-muted-foreground">
                        {entry.roomNumber}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditEntry(entry);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

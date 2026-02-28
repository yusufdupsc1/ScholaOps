"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MANUAL_TEMPLATE_OPTIONS } from "@/lib/contracts/v1/students-records";

const TEMPLATE_LABELS: Record<(typeof MANUAL_TEMPLATE_OPTIONS)[number], string> = {
  ID_CARD: "ID Card",
  RESULT_SHEET: "Result Sheet Report",
  ATTENDANCE_RECORD: "Attendance Record",
  BEHAVIOR_TRACKING: "Behavior Tracking Report",
  FINAL_EXAM_CERTIFICATE: "Final Exam Certificate",
  CHARACTER_CERTIFICATE: "Character Certificate",
  EXTRA_SKILLS_CERTIFICATE: "Extra Skills Certificate",
  TRANSFER_CERTIFICATE: "Transfer Certificate",
};

interface TemplateSelectorProps {
  value: string;
  onChange: (value: (typeof MANUAL_TEMPLATE_OPTIONS)[number]) => void;
}

export function templateLabel(value: string) {
  const key = value as keyof typeof TEMPLATE_LABELS;
  return TEMPLATE_LABELS[key] ?? value.replaceAll("_", " ");
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label>Template *</Label>
      <Select value={value} onValueChange={(v) => onChange(v as (typeof MANUAL_TEMPLATE_OPTIONS)[number])}>
        <SelectTrigger>
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          {MANUAL_TEMPLATE_OPTIONS.map((item) => (
            <SelectItem key={item} value={item}>
              {templateLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

import type { RecordPeriodType, StudentRecordType } from "@prisma/client";

interface SubjectRow {
  name: string;
  score: number;
  maxScore: number;
}

interface SignatoryFields {
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  coSignatoryName?: string | null;
  coSignatoryTitle?: string | null;
  certificateFooter?: string | null;
}

export interface StudentRecordPdfContext {
  template: StudentRecordType;
  periodType: RecordPeriodType;
  periodLabel: string;
  institutionName: string;
  institutionAddress?: string | null;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    className?: string | null;
  };
  subjects: SubjectRow[];
  attendance: {
    present: number;
    absent: number;
    late: number;
  };
  generatedAt: Date;
  signatory: SignatoryFields;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdfBuffer(lines: string[]): Buffer {
  const textOps = ["BT", "/F1 12 Tf", "50 790 Td"];
  for (const line of lines) {
    textOps.push(`(${escapePdfText(line)}) Tj`);
    textOps.push("0 -16 Td");
  }
  textOps.push("ET");

  const stream = textOps.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((obj, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

function titleForTemplate(template: StudentRecordType) {
  const labels: Record<StudentRecordType, string> = {
    ID_CARD: "ID Card",
    RESULT_SHEET: "Result Sheet Report",
    ATTENDANCE_RECORD: "Attendance Record",
    BEHAVIOR_TRACKING: "Behavior Tracking Report",
    FINAL_EXAM_CERTIFICATE: "Final Exam Certificate",
    CHARACTER_CERTIFICATE: "Character Certificate",
    EXTRA_SKILLS_CERTIFICATE: "Extra Skills Certificate",
    TRANSFER_CERTIFICATE: "Transfer Certificate",
    WEEKLY_PROGRESS: "Weekly Progress Record",
    MONTHLY_PROGRESS: "Monthly Progress Record",
    QUARTERLY_PROGRESS: "Quarterly Progress Record",
    ANNUAL_FINAL_REPORT: "Annual Final Progress Report",
  };
  return labels[template];
}

function periodLabelValue(periodType: RecordPeriodType, provided: string) {
  if (provided.trim()) return provided.trim();

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");

  if (periodType === "WEEKLY") return `Week ${yyyy}-${mm}-${dd}`;
  if (periodType === "MONTHLY") return `Month ${yyyy}-${mm}`;
  if (periodType === "QUARTERLY") return `Quarter ${yyyy} Q${Math.ceil((now.getUTCMonth() + 1) / 3)}`;
  if (periodType === "ANNUAL") return `Annual ${yyyy}`;
  return `Custom ${yyyy}-${mm}-${dd}`;
}

function safeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildStudentRecordPdf(context: StudentRecordPdfContext) {
  const title = titleForTemplate(context.template);
  const effectivePeriod = periodLabelValue(context.periodType, context.periodLabel);
  const studentName = `${context.student.firstName} ${context.student.lastName}`;

  const totalScore = context.subjects.reduce((sum, row) => sum + row.score, 0);
  const maxScore = context.subjects.reduce((sum, row) => sum + row.maxScore, 0);
  const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(2) : "0.00";

  const lines = [
    context.institutionName,
    context.institutionAddress ? `Address: ${context.institutionAddress}` : "",
    title,
    `Generated: ${context.generatedAt.toISOString().slice(0, 10)}`,
    `Period: ${effectivePeriod}`,
    "",
    `Student: ${studentName}`,
    `Student ID: ${context.student.studentId}`,
    `Class: ${context.student.className ?? "N/A"}`,
    "",
    `Attendance: Present ${context.attendance.present}, Absent ${context.attendance.absent}, Late ${context.attendance.late}`,
    `Result Snapshot: ${totalScore}/${maxScore} (${percentage}%)`,
    "",
    "Subjects:",
    ...context.subjects.map((row) => `- ${row.name}: ${row.score}/${row.maxScore}`),
    "",
    context.signatory.signatoryName
      ? `Signed by: ${context.signatory.signatoryName} (${context.signatory.signatoryTitle ?? "Authority"})`
      : "Signed by: Institution Authority",
    context.signatory.coSignatoryName
      ? `Co-signed by: ${context.signatory.coSignatoryName} (${context.signatory.coSignatoryTitle ?? ""})`
      : "",
    context.signatory.certificateFooter ?? "Generated by scholaOps",
  ].filter(Boolean);

  const pdf = buildPdfBuffer(lines);
  const fileName = `${safeToken(context.student.studentId)}-${safeToken(context.template)}-${safeToken(effectivePeriod)}.pdf`;

  return {
    title,
    periodLabel: effectivePeriod,
    fileName,
    fileUrl: `data:application/pdf;base64,${pdf.toString("base64")}`,
    size: pdf.byteLength,
  };
}

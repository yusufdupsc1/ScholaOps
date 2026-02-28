export const dashboardMock = {
  kpis: [
    { label: "Students", value: "90" },
    { label: "Teachers", value: "4" },
    { label: "Present Today", value: "10" },
    { label: "Pending Fees", value: "BDT 246,800" },
  ],
  attendance: [
    { date: "2026-02-22", status: "PRESENT", count: 25 },
    { date: "2026-02-23", status: "ABSENT", count: 2 },
  ],
} as const;

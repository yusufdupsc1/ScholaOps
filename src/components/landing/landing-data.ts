import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CreditCard,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";

export type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const featureItems: FeatureItem[] = [
  {
    title: "Unified Directory",
    description:
      "Manage students, guardians, and staff with one source of truth for every profile.",
    icon: Users,
  },
  {
    title: "Attendance + Alerts",
    description:
      "Track daily presence and trigger timely follow-ups for absences and late arrivals.",
    icon: CalendarCheck2,
  },
  {
    title: "Finance Operations",
    description:
      "Issue invoices, record payments, and monitor outstanding balances in real time.",
    icon: CreditCard,
  },
  {
    title: "Academic Core",
    description:
      "Run classes, gradebooks, and report workflows with clean teacher-first UX.",
    icon: BookOpen,
  },
  {
    title: "Decision Analytics",
    description:
      "Turn operational data into weekly insights for principals and administrators.",
    icon: BarChart3,
  },
  {
    title: "Secure by Design",
    description:
      "Role-aware access controls and audit-ready actions across critical workflows.",
    icon: ShieldCheck,
  },
];

export const roleHighlights = [
  {
    role: "Administrators",
    outcome: "Daily finance + attendance snapshot with urgent actions first.",
  },
  {
    role: "Teachers",
    outcome: "Fast class workflows for attendance, grades, and announcements.",
  },
  {
    role: "Families",
    outcome: "Clear view of progress, fees, schedules, and school communication.",
  },
];

export const trustStats = [
  { label: "Attendance Logged", value: "98.2%" },
  { label: "Fee Collection Visibility", value: "100%" },
  { label: "Average Daily Active Staff", value: "87%" },
];

export const pricingTiers = [
  {
    name: "Starter",
    price: "BDT 0",
    cadence: "for pilot schools",
    cta: "Start pilot",
    href: "/auth/register",
    features: ["Up to 300 students", "Core SIS + attendance", "Basic reporting"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "BDT 12,000",
    cadence: "per month",
    cta: "Start growth plan",
    href: "/auth/register",
    features: [
      "Up to 2,000 students",
      "Finance + invoicing workflows",
      "Advanced analytics dashboard",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual contract",
    cta: "Talk to sales",
    href: "/auth/register",
    features: ["Multi-campus support", "Priority onboarding", "Dedicated success team"],
    highlighted: false,
  },
];

export const testimonialItems = [
  {
    quote:
      "ScholaOps gave our principal office a single dashboard for attendance, fees, and operations by 8:30 AM every day.",
    author: "Farhana Rahman",
    role: "Vice Principal, Northbridge Academy",
  },
  {
    quote:
      "Teachers adopted it quickly because classroom workflows are simple and status-driven instead of menu-heavy.",
    author: "Nafis Ahmed",
    role: "Academic Coordinator, Eastfield School",
  },
  {
    quote:
      "Families now get faster answers because admin and finance data are finally connected.",
    author: "Sadia Karim",
    role: "School Operations Lead, Greenline International",
  },
];

export const heroHighlights = [
  {
    label: "Live Tiles",
    value: "Attendance, dues, tasks",
    icon: CalendarCheck2,
  },
  {
    label: "Role-aware Views",
    value: "Admin, teacher, family",
    icon: Users,
  },
  {
    label: "Audit-ready Actions",
    value: "Secure, traceable workflows",
    icon: MessageSquareText,
  },
];

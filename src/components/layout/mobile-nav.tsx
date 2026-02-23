"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Users, Calendar } from "lucide-react";
import type { Session } from "next-auth";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students", icon: GraduationCap },
  { href: "/dashboard/teachers", label: "Teachers", icon: Users },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
];

export function MobileNav({ session: _session }: { session: Session }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid h-14 grid-cols-4 border-t border-border bg-background lg:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-black" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

import type { Metadata } from "next";

import { CTASection } from "@/components/landing/cta-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { PricingPlans } from "@/components/landing/pricing-plans";
import { RoleModules } from "@/components/landing/role-modules";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustStrip } from "@/components/landing/trust-strip";

export const metadata: Metadata = {
  title: "scholaOps — Precision School Management",
  description:
    "Role-aware school ERP for attendance, academics, finance, and communication.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <LandingHeader />
      <main>
        <Hero />
        <TrustStrip />
        <RoleModules />
        <FeatureGrid />
        <PricingPlans />
        <Testimonials />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}

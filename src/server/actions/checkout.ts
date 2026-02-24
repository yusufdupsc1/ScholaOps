// src/server/actions/checkout.ts
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import Stripe from "stripe";

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
};

const CreateCheckoutSchema = z.object({
  feeId: z.string().min(1, "Fee ID is required"),
});

type ActionResult<T = void> =
  | { success: true; data?: T; url?: string; error?: never }
  | { success: false; error: string; data?: never };

async function getAuthContext() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string }
    | undefined;

  if (!user?.id || !user.institutionId) {
    throw new Error("Unauthorized");
  }
  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
  };
}

export async function createCheckoutSession(
  feeId: string,
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return { success: false, error: "Stripe is not configured" };
    }

    const parsed = CreateCheckoutSchema.safeParse({ feeId });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Invalid fee ID",
      };
    }

    const { institutionId, userId } = await getAuthContext();

    const fee = await db.fee.findFirst({
      where: { id: parsed.data.feeId, institutionId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!fee) {
      return { success: false, error: "Fee not found" };
    }

    const institution = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return { success: false, error: "Institution not found" };
    }

    const unpaidAmount = Number(fee.amount);
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: institution.currency.toLowerCase(),
            product_data: {
              name: fee.title,
              description: `Term: ${fee.term}, Academic Year: ${fee.academicYear}`,
            },
            unit_amount: Math.round(unpaidAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/finance?payment=success&feeId=${fee.id}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/finance?payment=cancelled&feeId=${fee.id}`,
      metadata: {
        feeId: fee.id,
        studentId: fee.studentId || "",
        institutionId,
        userId,
      },
      customer_email: fee.student?.email || undefined,
    });

    return {
      success: true,
      data: { sessionId: session.id },
      url: session.url,
    };
  } catch (error) {
    console.error("[CREATE_CHECKOUT_SESSION]", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

export async function createBulkCheckoutSession(
  feeIds: string[],
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return { success: false, error: "Stripe is not configured" };
    }

    const { institutionId, userId } = await getAuthContext();

    const fees = await db.fee.findMany({
      where: {
        id: { in: feeIds },
        institutionId,
        status: { in: ["UNPAID", "PARTIAL"] },
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (fees.length === 0) {
      return { success: false, error: "No valid fees found" };
    }

    const institution = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return { success: false, error: "Institution not found" };
    }

    const lineItems = fees.map((fee) => ({
      price_data: {
        currency: institution.currency.toLowerCase(),
        product_data: {
          name: fee.title,
          description: `Student: ${fee.student?.firstName} ${fee.student?.lastName}`,
        },
        unit_amount: Math.round(Number(fee.amount) * 100),
      },
      quantity: 1,
    }));

    const totalAmount = fees.reduce((sum, fee) => sum + Number(fee.amount), 0);

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/finance?payment=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/finance?payment=cancelled`,
      metadata: {
        feeIds: feeIds.join(","),
        institutionId,
        userId,
        type: "BULK_PAYMENT",
      },
    });

    return {
      success: true,
      data: { sessionId: session.id },
      url: session.url,
    };
  } catch (error) {
    console.error("[CREATE_BULK_CHECKOUT_SESSION]", error);
    return { success: false, error: "Failed to create bulk checkout session" };
  }
}

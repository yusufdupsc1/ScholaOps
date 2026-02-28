"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/server/actions/checkout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeePaymentActionsProps {
  feeId: string;
  className?: string;
}

export function FeePaymentActions({ feeId, className }: FeePaymentActionsProps) {
  const [stripeCurrency, setStripeCurrency] = useState<"USD" | "EUR">("USD");
  const [gateway, setGateway] = useState<"STRIPE" | "SSLCOMMERZ" | null>(null);
  const [pending, startTransition] = useTransition();

  function beginCheckout(targetGateway: "STRIPE" | "SSLCOMMERZ") {
    setGateway(targetGateway);
    startTransition(async () => {
      const result = await createCheckoutSession({
        feeId,
        gateway: targetGateway,
        currency: targetGateway === "STRIPE" ? stripeCurrency : undefined,
      });

      if (!result.success) {
        toast.error("Failed to initialize payment");
        setGateway(null);
        return;
      }

      if (!result.url) {
        toast.error("Failed to initialize payment");
        setGateway(null);
        return;
      }

      window.location.href = result.url;
    });
  }

  return (
    <div className={className}>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => beginCheckout("SSLCOMMERZ")}
        >
          {pending && gateway === "SSLCOMMERZ" ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CreditCard className="mr-1 h-3.5 w-3.5" />
          )}
          Pay in BD (SSLCommerz)
        </Button>

        <div className="flex items-center gap-2">
          <Select
            value={stripeCurrency}
            onValueChange={(value) => setStripeCurrency(value as "USD" | "EUR")}
          >
            <SelectTrigger className="h-8 w-[86px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => beginCheckout("STRIPE")}
            className="flex-1"
          >
            {pending && gateway === "STRIPE" ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CreditCard className="mr-1 h-3.5 w-3.5" />
            )}
            Pay {stripeCurrency} (Stripe)
          </Button>
        </div>
      </div>
    </div>
  );
}

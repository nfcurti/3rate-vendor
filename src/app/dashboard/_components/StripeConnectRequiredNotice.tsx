import Link from "next/link";
import {
  STRIPE_REQUIRED_FOR_PRODUCT_MESSAGE,
} from "@/lib/business-stripe";

export function StripeConnectRequiredNotice() {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700"
    >
      {STRIPE_REQUIRED_FOR_PRODUCT_MESSAGE}{" "}
      <Link
        href="/dashboard/impostazioni?tab=pagamenti"
        className="underline hover:cursor-pointer hover:text-red-800"
      >
        Vai a Impostazioni → Pagamenti
      </Link>
    </div>
  );
}

import { requireUser } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type { Opportunity, Transaction } from "@/lib/types";
import { SandboxCheckout } from "@/components/sandbox-checkout";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sandbox checkout" };

export default async function SandboxPaymentPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  await requireUser(`/pay/sandbox/${reference}`);

  const response = await apiFetch<{
    data: { transaction: Transaction; opportunity: Opportunity | null; signature: string | null };
  }>(`payments/sandbox/${reference}`);

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14">
      <SandboxCheckout
        transaction={response.data.transaction}
        opportunity={response.data.opportunity}
        signature={response.data.signature}
      />
    </div>
  );
}

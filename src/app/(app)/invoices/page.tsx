import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function InvoicesPage() {
  return (
    <ComingSoon
      icon={Receipt}
      title="Invoices & payments"
      phase="Coming in Phase 4"
      description="Invoices with health-fund item codes, GST handling, payment tracking and emailable receipts."
    />
  );
}

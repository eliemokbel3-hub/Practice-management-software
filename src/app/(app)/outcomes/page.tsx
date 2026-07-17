import { ClipboardList } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function OutcomesPage() {
  return (
    <ComingSoon
      icon={ClipboardList}
      title="Outcome measures"
      phase="Coming in Phase 6"
      description="Send standard questionnaires (ODI, NDI, PSFS, LEFS and more) to patients by link — auto-scored, with progress graphed over time."
    />
  );
}

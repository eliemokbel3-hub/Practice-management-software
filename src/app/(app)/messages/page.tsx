import { MessageSquare } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function MessagesPage() {
  return (
    <ComingSoon
      icon={MessageSquare}
      title="Messages"
      phase="Coming in Phase 6"
      description="Built-in messaging between accounts linked to your clinic."
    />
  );
}

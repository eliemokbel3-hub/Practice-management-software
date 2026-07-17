import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      phase="Unlocks once the database is connected"
      description="Clinic details, practitioner profile, appointment types and templates will live here."
    />
  );
}

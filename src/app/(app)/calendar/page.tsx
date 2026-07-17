import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Calendar & appointments"
      phase="Coming in Phase 2"
      description="Your diary: book, reschedule and cancel appointments, with fully customizable appointment types, working hours and blocked time."
    />
  );
}

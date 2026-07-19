"use client";

// Cancel / reschedule controls on the emailed manage link.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, XCircle } from "lucide-react";
import SlotPicker from "../../components/slot-picker";
import { cancelBookingAction, rescheduleBookingAction } from "../../actions";

export default function ManageBooking({
  token,
  slug,
  appointmentTypeId,
  timeZone,
}: {
  token: string;
  slug: string;
  appointmentTypeId: string;
  timeZone: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "reschedule" | "confirm-cancel">(
    "idle"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setBusy(true);
    setError(null);
    const result = await cancelBookingAction(token);
    setBusy(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong — please try again.");
      setMode("idle");
    }
  }

  async function handleReschedule(startsAt: string) {
    setBusy(true);
    setError(null);
    const result = await rescheduleBookingAction(token, startsAt);
    setBusy(false);
    if (result.ok) {
      setMode("idle");
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong — please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-danger">{error}</p>}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("reschedule")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <CalendarClock size={15} /> Choose a new time
          </button>
          <button
            type="button"
            onClick={() => setMode("confirm-cancel")}
            className="flex items-center gap-2 rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            <XCircle size={15} /> Cancel appointment
          </button>
        </div>
      )}

      {mode === "confirm-cancel" && (
        <div className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-surface p-5">
          <p className="text-sm font-medium">
            Are you sure you want to cancel this appointment?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              Yes, cancel it
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={busy}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
            >
              Keep my appointment
            </button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Pick a new time:</p>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="text-sm text-muted hover:text-foreground"
            >
              Never mind
            </button>
          </div>
          {busy ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
              <Loader2 size={16} className="animate-spin" /> Moving your
              appointment…
            </div>
          ) : (
            <SlotPicker
              slug={slug}
              appointmentTypeId={appointmentTypeId}
              timeZone={timeZone}
              onPick={(slot) => handleReschedule(slot.startsAt)}
            />
          )}
        </div>
      )}
    </div>
  );
}

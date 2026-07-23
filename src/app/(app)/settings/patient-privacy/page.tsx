import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPrivacySettings } from "@/lib/data/clinic";
import { savePrivacyAction } from "./actions";

export default async function PatientPrivacyPage() {
  const { privacyNote, requireConsent } = await getPrivacySettings();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Patient privacy</h1>
        <p className="mt-1 text-sm text-muted">
          How you tell patients their information is handled, shown on your
          public booking page.
        </p>
      </div>

      <form action={savePrivacyAction} className="flex flex-col gap-5">
        <section className="flex flex-col gap-3 card p-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="privacyNote" className="text-sm font-medium">
              Privacy note
            </label>
            <textarea
              id="privacyNote"
              name="privacyNote"
              rows={5}
              defaultValue={privacyNote ?? ""}
              placeholder="e.g. We collect your details only to provide your care and never share them without your consent. See our privacy policy at…"
              className="w-full resize-y input-base"
            />
            <p className="text-xs text-faint">
              Shown to patients on your booking page.
            </p>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="requireConsent"
              defaultChecked={requireConsent}
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
            />
            <span>
              Require patients to agree before booking online
              <span className="mt-0.5 block text-xs text-faint">
                Adds a tick-box they must accept, referencing your privacy note.
              </span>
            </span>
          </label>
        </section>

        <div className="flex justify-end">
          <button className="btn-primary px-5">
            Save privacy settings
          </button>
        </div>
      </form>
    </div>
  );
}

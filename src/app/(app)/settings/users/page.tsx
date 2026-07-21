import Link from "next/link";
import { ArrowLeft, Pencil, ShieldCheck } from "lucide-react";
import { listStaff } from "@/lib/data/team";
import { getCurrentProfile } from "@/lib/supabase/server";
import { AddStaffForm } from "./add-staff-form";
import { ResetPasswordButton } from "./reset-password-button";
import { toggleStaffActiveAction } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  practitioner: "Practitioner",
  reception: "Reception",
};

export default async function UsersPage() {
  const [staff, profile] = await Promise.all([listStaff(), getCurrentProfile()]);
  const isOwner = profile?.role === "owner";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          Users &amp; practitioners
        </h1>
        <p className="mt-1 text-sm text-muted">
          The people who can sign in to your clinic, their roles and the
          services each practitioner offers.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
        {staff.map((s) => (
          <li
            key={s.id}
            className={`flex items-center justify-between gap-3 px-5 py-3 ${
              s.isActive ? "" : "opacity-50"
            }`}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                {s.firstName} {s.lastName}
                {s.isOwner && (
                  <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-soft-foreground">
                    <ShieldCheck size={10} /> Owner
                  </span>
                )}
                {s.isSelf && <span className="text-xs text-faint">(you)</span>}
              </p>
              <p className="truncate text-xs text-faint">
                {[ROLE_LABEL[s.role], s.title, s.email]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {isOwner && (
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/settings/users/${s.id}/edit`}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
                  >
                    <Pencil size={12} /> Edit
                  </Link>
                  {!s.isSelf && (
                    <form
                      action={toggleStaffActiveAction.bind(null, s.id, !s.isActive)}
                    >
                      <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover">
                        {s.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  )}
                </div>
                {!s.isSelf && (
                  <ResetPasswordButton staffId={s.id} email={s.email} />
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {isOwner ? (
        <AddStaffForm />
      ) : (
        <p className="text-sm text-faint">
          Only the account owner can add or change team members.
        </p>
      )}
    </div>
  );
}

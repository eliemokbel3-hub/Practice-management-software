import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  getStaffMember,
  listPractitionerTypeIds,
} from "@/lib/data/team";
import { listAppointmentTypes } from "@/lib/data/appointment-types";
import { getCurrentProfile } from "@/lib/supabase/server";
import { transferOwnershipAction, updateStaffAction } from "../../actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [member, profile, types, memberTypeIds] = await Promise.all([
    getStaffMember(id),
    getCurrentProfile(),
    listAppointmentTypes(),
    listPractitionerTypeIds(id),
  ]);
  if (!member) notFound();
  if (profile?.role !== "owner") {
    return (
      <p className="text-sm text-muted">
        Only the account owner can edit team members.
      </p>
    );
  }
  const save = updateStaffAction.bind(null, member.id);
  const selected = new Set(memberTypeIds);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/settings/users"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Users &amp; practitioners
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          {member.firstName} {member.lastName}
        </h1>
        <p className="mt-1 text-sm text-muted">{member.email}</p>
      </div>

      <form action={save} className="flex flex-col gap-5">
        <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">First name</label>
            <input name="firstName" required defaultValue={member.firstName} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Last name</label>
            <input name="lastName" required defaultValue={member.lastName} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Title</label>
            <input name="title" defaultValue={member.title ?? ""} placeholder="Osteopath" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">AHPRA number</label>
            <input name="ahpraNumber" defaultValue={member.ahpraNumber ?? ""} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Role</label>
            <select
              name="role"
              defaultValue={member.role}
              disabled={member.isOwner}
              className={inputCls}
            >
              <option value="practitioner">Practitioner</option>
              <option value="reception">Reception</option>
              <option value="owner">Owner</option>
            </select>
            {member.isOwner && (
              <p className="text-xs text-faint">
                The owner&apos;s role changes only by transferring ownership.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
            Services offered
          </h2>
          <p className="text-sm text-muted">
            Which appointment types this practitioner provides (used by online
            booking).
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {types.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="types"
                  value={t.id}
                  defaultChecked={selected.has(t.id)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                {t.name}
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
            Save changes
          </button>
        </div>
      </form>

      {!member.isOwner && member.isActive && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={15} /> Account ownership
          </h2>
          <p className="text-sm text-muted">
            Make {member.firstName} the account owner. You&apos;ll become a
            practitioner and lose owner-only controls.
          </p>
          <form action={transferOwnershipAction.bind(null, member.id)}>
            <button className="self-start rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft">
              Transfer ownership to {member.firstName}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

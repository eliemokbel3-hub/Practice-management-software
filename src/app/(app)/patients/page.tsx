import Link from "next/link";
import { Plus, Search, TriangleAlert } from "lucide-react";
import { listPatients } from "@/lib/data/patients";
import { ageFromDob, fullName } from "@/lib/types";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string }>;
}) {
  const { q = "", archived } = await searchParams;
  const includeArchived = archived === "1";
  const patients = await listPatients({ query: q, includeArchived });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Patients</h1>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} /> New patient
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name, phone, email or suburb…"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none placeholder:text-faint focus:border-ring"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="archived"
            value="1"
            defaultChecked={includeArchived}
            className="accent-primary"
          />
          Include archived
        </label>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Suburb</th>
              <th className="px-4 py-3 font-medium">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => {
              const age = ageFromDob(p.dateOfBirth);
              return (
                <tr
                  key={p.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/patients/${p.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {fullName(p)}
                    </Link>
                    {p.archivedAt && (
                      <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs text-faint">
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{age ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{p.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{p.suburb ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.alerts ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning-soft-foreground">
                        <TriangleAlert size={12} /> {p.alerts}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {patients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  No patients found{q ? ` for “${q}”` : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-faint">
        {patients.length} patient{patients.length === 1 ? "" : "s"}
        {includeArchived ? " (including archived)" : ""}
      </p>
    </div>
  );
}

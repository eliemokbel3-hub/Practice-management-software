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
      <div className="animate-fade-up flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
            Patients
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {patients.length} {patients.length === 1 ? "record" : "records"}
            {q ? ` matching “${q}”` : ""}
          </p>
        </div>
        <Link href="/patients/new" className="btn-primary">
          <Plus size={16} /> New patient
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name, phone, email or suburb…"
            className="input-base w-full pl-9"
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
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

      <div className="card animate-fade-up-delayed overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-xs uppercase tracking-wide text-faint">
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
                      className="group inline-flex items-center gap-2.5 font-medium"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary-soft-foreground">
                        {p.firstName[0]}
                        {p.lastName[0]}
                      </span>
                      <span className="text-foreground transition-colors group-hover:text-primary">
                        {fullName(p)}
                      </span>
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

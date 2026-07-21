"use client";

// Basic patient CSV import: read the file in the browser, map common columns,
// preview the count, then insert. A gentle first step toward a full Cliniko
// import.

import { useState } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { importPatientsAction, type ImportPatientRow } from "./actions";

// Minimal CSV parser handling quoted fields and commas within quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

function pick(headers: string[], row: string[], names: string[]): string {
  for (const n of names) {
    const idx = headers.findIndex(
      (h) => h.trim().toLowerCase().replace(/[\s_]+/g, "") === n
    );
    if (idx >= 0) return row[idx] ?? "";
  }
  return "";
}

export function ImportForm() {
  const [rows, setRows] = useState<ImportPatientRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDone(null);
    setError(null);
    setParseError(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setParseError("That file has no data rows.");
      setRows([]);
      return;
    }
    const headers = parsed[0];
    const mapped = parsed.slice(1).map((r) => ({
      firstName: pick(headers, r, ["firstname", "first", "givenname"]),
      lastName: pick(headers, r, ["lastname", "last", "surname", "familyname"]),
      email: pick(headers, r, ["email", "emailaddress"]),
      phone: pick(headers, r, ["phone", "mobile", "phonenumber", "cell"]),
      dateOfBirth: pick(headers, r, ["dateofbirth", "dob", "birthdate"]),
    }));
    const valid = mapped.filter((r) => r.firstName.trim() && r.lastName.trim());
    setRows(valid);
    if (valid.length === 0)
      setParseError(
        "Couldn't find first/last name columns. Expected headers like first_name, last_name, email, phone, date_of_birth."
      );
  }

  async function doImport() {
    setBusy(true);
    setError(null);
    const result = await importPatientsAction(rows);
    setBusy(false);
    if (result.ok) {
      setDone(result.count ?? 0);
      setRows([]);
      setFileName(null);
    } else setError(result.error ?? "Import failed.");
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex cursor-pointer items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
        <Upload size={15} /> Choose CSV file
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
      </label>

      {fileName && (
        <p className="text-sm text-muted">
          <span className="font-medium">{fileName}</span> — {rows.length} patient
          {rows.length === 1 ? "" : "s"} ready to import.
        </p>
      )}
      {parseError && <p className="text-sm text-danger">{parseError}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-faint">
              <tr>
                <th className="px-3 py-2">First</th>
                <th className="px-3 py-2">Last</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3 py-1.5">{r.firstName}</td>
                  <td className="px-3 py-1.5">{r.lastName}</td>
                  <td className="px-3 py-1.5">{r.email}</td>
                  <td className="px-3 py-1.5">{r.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 5 && (
            <p className="px-3 py-2 text-xs text-faint">
              …and {rows.length - 5} more.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {done !== null && (
        <p className="flex items-center gap-1.5 text-sm text-primary">
          <Check size={15} /> Imported {done} patient{done === 1 ? "" : "s"}.
        </p>
      )}

      {rows.length > 0 && (
        <button
          onClick={doImport}
          disabled={busy}
          className="flex items-center gap-2 self-start rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" />}
          Import {rows.length} patient{rows.length === 1 ? "" : "s"}
        </button>
      )}
    </div>
  );
}

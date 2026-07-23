import type { Patient } from "@/lib/types";
import type { CustomField } from "@/lib/data/custom-fields";

const inputCls =
  "w-full input-base";
const labelCls = "text-sm font-medium";

function Field({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Text({
  label,
  name,
  value,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  value?: string | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={required ? `${label} *` : label} name={name}>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className={inputCls}
      />
    </Field>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Choice({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string | null;
  options: string[];
}) {
  // Keep any existing value even if it's no longer in the managed list.
  const all = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <Field label={label} name={name}>
      <select
        id={name}
        name={name}
        defaultValue={value ?? ""}
        className={inputCls}
      >
        <option value="">—</option>
        {all.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CustomFieldInput({
  field,
  value,
}: {
  field: CustomField;
  value: string;
}) {
  const name = `custom_${field.id}`;
  if (field.fieldType === "checkbox") {
    return (
      <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name={name}
          defaultChecked={value === "Yes"}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        {field.label}
      </label>
    );
  }
  return (
    <Field label={field.label} name={name}>
      {field.fieldType === "paragraph" ? (
        <textarea id={name} name={name} rows={3} defaultValue={value} className={inputCls} />
      ) : field.fieldType === "select" ? (
        <select id={name} name={name} defaultValue={value} className={inputCls}>
          <option value="">—</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={field.fieldType === "date" ? "date" : "text"}
          defaultValue={value}
          className={inputCls}
        />
      )}
    </Field>
  );
}

export function PatientForm({
  patient,
  action,
  submitLabel,
  referralSources = [],
  concessionTypes = [],
  customFields = [],
}: {
  patient?: Patient;
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  referralSources?: string[];
  concessionTypes?: string[];
  customFields?: CustomField[];
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <Section title="Personal details">
        <Text label="First name" name="firstName" value={patient?.firstName} required />
        <Text label="Last name" name="lastName" value={patient?.lastName} required />
        <Text label="Preferred name" name="preferredName" value={patient?.preferredName} />
        <Text label="Date of birth" name="dateOfBirth" type="date" value={patient?.dateOfBirth} />
        <Field label="Sex" name="sex">
          <select
            id="sex"
            name="sex"
            defaultValue={patient?.sex ?? ""}
            className={inputCls}
          >
            <option value="">—</option>
            <option>Female</option>
            <option>Male</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
          </select>
        </Field>
        <Text label="Occupation" name="occupation" value={patient?.occupation} />
      </Section>

      <Section title="Contact">
        <Text label="Phone" name="phone" type="tel" value={patient?.phone} />
        <Text label="Email" name="email" type="email" value={patient?.email} />
        <div className="sm:col-span-2">
          <Text label="Street address" name="addressLine1" value={patient?.addressLine1} />
        </div>
        <Text label="Suburb" name="suburb" value={patient?.suburb} />
        <div className="grid grid-cols-2 gap-4">
          <Text label="State" name="state" value={patient?.state} placeholder="VIC" />
          <Text label="Postcode" name="postcode" value={patient?.postcode} />
        </div>
      </Section>

      <Section title="Emergency contact">
        <Text label="Name" name="emergencyContactName" value={patient?.emergencyContactName} />
        <Text label="Phone" name="emergencyContactPhone" type="tel" value={patient?.emergencyContactPhone} />
        <Text
          label="Relationship"
          name="emergencyContactRelationship"
          value={patient?.emergencyContactRelationship}
        />
      </Section>

      <Section title="Clinical">
        <div className="sm:col-span-2">
          <Field label="Alerts" name="alerts">
            <input
              id="alerts"
              name="alerts"
              defaultValue={patient?.alerts ?? ""}
              placeholder="e.g. On anticoagulants — no high-velocity techniques"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Medical history" name="medicalHistory">
            <textarea
              id="medicalHistory"
              name="medicalHistory"
              rows={4}
              defaultValue={patient?.medicalHistory ?? ""}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      <Section title="Other">
        <Choice
          label="Referral source"
          name="referralSource"
          value={patient?.referralSource}
          options={referralSources}
        />
        <Choice
          label="Concession"
          name="concession"
          value={patient?.concession}
          options={concessionTypes}
        />
        <Text label="Health fund" name="healthFundName" value={patient?.healthFundName} />
        <Text
          label="Health fund member no."
          name="healthFundMemberNumber"
          value={patient?.healthFundMemberNumber}
        />
      </Section>

      {customFields.length > 0 && (
        <Section title="Additional information">
          {customFields.map((f) => (
            <CustomFieldInput
              key={f.id}
              field={f}
              value={patient?.custom?.[f.id] ?? ""}
            />
          ))}
        </Section>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary px-5"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

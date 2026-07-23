import { listRecallTypes } from "@/lib/data/lists";
import { SettingsList } from "@/components/settings-list";
import {
  createRecallTypeAction,
  deleteRecallTypeAction,
  toggleRecallTypeAction,
} from "./actions";

function intervalLabel(days: number): string {
  if (days % 365 === 0) return `${days / 365} year${days === 365 ? "" : "s"}`;
  if (days % 30 === 0) return `${days / 30} months`;
  if (days % 7 === 0) return `${days / 7} weeks`;
  return `${days} days`;
}

export default async function RecallTypesPage() {
  const items = await listRecallTypes(true);
  return (
    <SettingsList
      title="Recall types"
      description="Reminders to bring patients back — e.g. a 6-month review. Used when setting a recall on a patient."
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        isActive: i.isActive,
        meta: (
          <span>
            Every {intervalLabel(i.intervalDays)}
            {i.message ? ` · “${i.message}”` : ""}
          </span>
        ),
      }))}
      addPlaceholder="e.g. 3-month review"
      addFields={
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            Recall after
            <input
              type="number"
              name="intervalDays"
              min={1}
              defaultValue={182}
              className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring"
            />
            days
          </label>
          <input
            name="message"
            placeholder="Message to the patient (optional)"
            className="input-base"
          />
        </div>
      }
      createAction={createRecallTypeAction}
      toggleAction={toggleRecallTypeAction}
      deleteAction={deleteRecallTypeAction}
      note="Automatic sending of recalls arrives with SMS/email scheduling; for now these define your recall options."
    />
  );
}

import { BODY_REGIONS, listBodyCharts } from "@/lib/data/templates";
import { SettingsList } from "@/components/settings-list";
import {
  createBodyChartAction,
  deleteBodyChartAction,
  toggleBodyChartAction,
} from "./actions";

const inputCls =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring";

export default async function BodyChartsPage() {
  const charts = await listBodyCharts(true);
  const regionLabel = (v: string) =>
    BODY_REGIONS.find((r) => r.value === v)?.label ?? v;

  return (
    <SettingsList
      title="Body chart templates"
      description="Named body diagrams for marking findings on a patient. Choose one when annotating a treatment note."
      items={charts.map((c) => ({
        id: c.id,
        name: c.name,
        isActive: c.isActive,
        meta: regionLabel(c.region),
      }))}
      addPlaceholder="Chart name, e.g. Lumbar spine"
      addFields={
        <label className="flex items-center gap-2 text-sm text-muted">
          Region
          <select name="region" defaultValue="full_body" className={inputCls}>
            {BODY_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      }
      createAction={createBodyChartAction}
      toggleAction={toggleBodyChartAction}
      deleteAction={deleteBodyChartAction}
      note="Drawing on charts within a note arrives with the clinical-notes drawing tool; these define your available charts."
    />
  );
}

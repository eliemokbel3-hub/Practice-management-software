import { listBlockTypes } from "@/lib/data/lists";
import { SettingsList } from "@/components/settings-list";
import {
  createBlockTypeAction,
  deleteBlockTypeAction,
  toggleBlockTypeAction,
} from "./actions";

export default async function BlockTypesPage() {
  const items = await listBlockTypes(true);
  return (
    <SettingsList
      title="Unavailable block types"
      description="Reasons for blocking out time — offered when you block time on the calendar."
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        isActive: i.isActive,
        meta: (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded"
              style={{ backgroundColor: i.color }}
            />
            {i.color}
          </span>
        ),
      }))}
      addPlaceholder="e.g. Professional development"
      addFields={
        <label className="flex items-center gap-2 text-sm text-muted">
          Colour
          <input
            type="color"
            name="color"
            defaultValue="#94a3b8"
            className="h-8 w-12 cursor-pointer rounded border border-border bg-surface"
          />
        </label>
      }
      createAction={createBlockTypeAction}
      toggleAction={toggleBlockTypeAction}
      deleteAction={deleteBlockTypeAction}
    />
  );
}

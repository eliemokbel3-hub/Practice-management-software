import { listConcessionTypes } from "@/lib/data/lists";
import { SettingsList } from "@/components/settings-list";
import {
  createConcessionTypeAction,
  deleteConcessionTypeAction,
  toggleConcessionTypeAction,
} from "./actions";

export default async function ConcessionTypesPage() {
  const items = await listConcessionTypes(true);
  return (
    <SettingsList
      title="Concession types"
      description="Discount categories like Pensioner or Student — recorded on a patient's file."
      items={items.map((i) => ({ id: i.id, name: i.name, isActive: i.isActive }))}
      addPlaceholder="e.g. Aged pension"
      createAction={createConcessionTypeAction}
      toggleAction={toggleConcessionTypeAction}
      deleteAction={deleteConcessionTypeAction}
    />
  );
}

import { listReferralSources } from "@/lib/data/lists";
import { SettingsList } from "@/components/settings-list";
import {
  createReferralSourceAction,
  deleteReferralSourceAction,
  toggleReferralSourceAction,
} from "./actions";

export default async function ReferralSourcesPage() {
  const items = await listReferralSources(true);
  return (
    <SettingsList
      title="Referral sources"
      description="How patients find you — offered as a dropdown when adding or editing a patient."
      items={items.map((i) => ({ id: i.id, name: i.name, isActive: i.isActive }))}
      addPlaceholder="e.g. Local gym"
      createAction={createReferralSourceAction}
      toggleAction={toggleReferralSourceAction}
      deleteAction={deleteReferralSourceAction}
    />
  );
}

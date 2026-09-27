import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ClassesManager } from "@/components/classes/classes-manager";
import type { ClassRoom } from "@/lib/types";

export default async function ClassesPage() {
  const supabase = createClient();

  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .order("class_name")
    .order("section");

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Manage class sections used in the timetable."
      />
      <ClassesManager classes={(classes ?? []) as ClassRoom[]} />
    </div>
  );
}

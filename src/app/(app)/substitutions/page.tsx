import { createClient } from "@/lib/supabase/server";
import { SubstitutionsTable } from "@/components/substitutions/substitutions-table";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import type { SubstitutionDetailed } from "@/lib/types";

export default async function SubstitutionsPage() {
  const supabase = createClient();

  const { data: substitutions } = await supabase
    .from("substitutions")
    .select(
      `*, original_teacher:teachers!substitutions_original_teacher_id_fkey(*), substitute_teacher:teachers!substitutions_substitute_teacher_id_fkey(*), timetable:timetable(*, teacher:teachers!timetable_teacher_id_fkey(*), class:classes!timetable_class_id_fkey(*), subject:subjects!timetable_subject_id_fkey(*))`
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (substitutions ?? []) as SubstitutionDetailed[];

  if (!rows.length) {
    return (
      <div>
        <PageHeader
          title="Substitutions"
          description="Track assigned substitutes and mark periods as completed."
        />
        <EmptyState
          title="No substitutions yet"
          description="Assign substitutes from the Absences page when a teacher is marked absent."
        />
      </div>
    );
  }

  return <SubstitutionsTable substitutions={rows} />;
}

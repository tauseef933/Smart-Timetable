import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { TeachersManager } from "@/components/teachers/teachers-manager";
import type { Subject, TeacherWithSubjects } from "@/lib/types";

type TeacherRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  teacher_subjects: { subject_id: string; subjects: Subject | null }[];
};

function mapTeachers(rows: TeacherRow[]): TeacherWithSubjects[] {
  return rows.map(({ teacher_subjects, ...teacher }) => ({
    ...teacher,
    subjects: teacher_subjects
      .map((ts) => ts.subjects)
      .filter((s): s is Subject => s != null),
  }));
}

export default async function TeachersPage() {
  const supabase = createClient();

  const [{ data: teacherRows }, { data: subjects }] = await Promise.all([
    supabase
      .from("teachers")
      .select(`*, teacher_subjects(subject_id, subjects(*))`)
      .order("full_name"),
    supabase.from("subjects").select("*").order("name"),
  ]);

  const teachers = mapTeachers((teacherRows ?? []) as TeacherRow[]);

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Manage faculty profiles and subject assignments."
      />
      <TeachersManager teachers={teachers} subjects={subjects ?? []} />
    </div>
  );
}

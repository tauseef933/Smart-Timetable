import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { TimetableGrid } from "@/components/timetable/timetable-grid";
import type {
  ClassRoom,
  Subject,
  Teacher,
  TimetableSlotDetailed,
} from "@/lib/types";

export default async function TimetablePage() {
  const supabase = createClient();

  const [
    { data: slots },
    { data: teachers },
    { data: classes },
    { data: subjects },
  ] = await Promise.all([
    supabase
      .from("timetable")
      .select(
        `*, teacher:teachers(*), class:classes(*), subject:subjects(*)`
      )
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("teachers")
      .select("*")
      .eq("is_active", true)
      .order("full_name"),
    supabase.from("classes").select("*").order("class_name").order("section"),
    supabase.from("subjects").select("*").order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Weekly schedule by period and day."
      />
      <TimetableGrid
        slots={(slots ?? []) as TimetableSlotDetailed[]}
        teachers={(teachers ?? []) as Teacher[]}
        classes={(classes ?? []) as ClassRoom[]}
        subjects={(subjects ?? []) as Subject[]}
      />
    </div>
  );
}

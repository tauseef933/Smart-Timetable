import { createClient } from "@/lib/supabase/server";
import { AbsencesManager } from "@/components/absences/absences-manager";
import type { AbsenceDetailed, Teacher } from "@/lib/types";

export default async function AbsencesPage() {
  const supabase = createClient();

  const [{ data: teachers }, { data: absences }] = await Promise.all([
    supabase
      .from("teachers")
      .select("*")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("absences")
      .select("*, teacher:teachers(*)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <AbsencesManager
      teachers={(teachers ?? []) as Teacher[]}
      absences={(absences ?? []) as AbsenceDetailed[]}
    />
  );
}

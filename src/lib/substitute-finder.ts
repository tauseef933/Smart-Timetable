import type {
  DayOfWeek,
  SlotSuggestion,
  SubstituteCandidate,
  Teacher,
  TimetableSlotDetailed,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const WEEKDAY_MAP: Record<number, DayOfWeek | null> = {
  0: null,
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export function getDayOfWeek(dateStr: string): DayOfWeek | null {
  const d = new Date(dateStr + "T12:00:00");
  return WEEKDAY_MAP[d.getDay()] ?? null;
}

function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

export async function findSubstitutesForAbsence(
  teacherId: string,
  date: string
): Promise<{ suggestions: SlotSuggestion[]; error?: string }> {
  const day = getDayOfWeek(date);
  if (!day) {
    return { suggestions: [], error: "No classes on Sunday." };
  }

  const supabase = createClient();

  const { data: slots, error: slotsError } = await supabase
    .from("timetable")
    .select(
      `
      *,
      teacher:teachers!timetable_teacher_id_fkey(*),
      class:classes!timetable_class_id_fkey(*),
      subject:subjects!timetable_subject_id_fkey(*)
    `
    )
    .eq("teacher_id", teacherId)
    .eq("day_of_week", day);

  if (slotsError) {
    return { suggestions: [], error: "Could not load timetable slots." };
  }

  if (!slots || slots.length === 0) {
    return { suggestions: [] };
  }

  const typedSlots = slots as unknown as TimetableSlotDetailed[];

  const monthStart = date.slice(0, 8) + "01";
  const monthEndDate = new Date(date.slice(0, 7) + "-01T12:00:00");
  monthEndDate.setMonth(monthEndDate.getMonth() + 1);
  const monthEnd = monthEndDate.toISOString().slice(0, 10);

  const [
    { data: allTeachers },
    { data: teacherSubjects },
    { data: dayTimetable },
    { data: absences },
    { data: existingSubs },
    { data: monthSubs },
  ] = await Promise.all([
    supabase.from("teachers").select("*").eq("is_active", true),
    supabase.from("teacher_subjects").select("teacher_id, subject_id"),
    supabase
      .from("timetable")
      .select("teacher_id, start_time, end_time")
      .eq("day_of_week", day),
    supabase.from("absences").select("teacher_id").eq("date", date),
    supabase
      .from("substitutions")
      .select("substitute_teacher_id, timetable_id, timetable:timetable!substitutions_timetable_id_fkey(start_time, end_time)")
      .eq("date", date),
    supabase
      .from("substitutions")
      .select("substitute_teacher_id")
      .gte("date", monthStart)
      .lt("date", monthEnd),
  ]);

  const absentSet = new Set((absences ?? []).map((a) => a.teacher_id));
  absentSet.add(teacherId);

  const subjectMap = new Map<string, Set<string>>();
  for (const ts of teacherSubjects ?? []) {
    if (!subjectMap.has(ts.teacher_id)) subjectMap.set(ts.teacher_id, new Set());
    subjectMap.get(ts.teacher_id)!.add(ts.subject_id);
  }

  const monthCounts = new Map<string, number>();
  for (const s of monthSubs ?? []) {
    monthCounts.set(
      s.substitute_teacher_id,
      (monthCounts.get(s.substitute_teacher_id) ?? 0) + 1
    );
  }

  const suggestions: SlotSuggestion[] = [];

  for (const slot of typedSlots) {
    const busyTeachers = new Set<string>();

    for (const t of dayTimetable ?? []) {
      if (
        timesOverlap(slot.start_time, slot.end_time, t.start_time, t.end_time)
      ) {
        busyTeachers.add(t.teacher_id);
      }
    }

    for (const sub of existingSubs ?? []) {
      const subSlot = sub.timetable as unknown as {
        start_time: string;
        end_time: string;
      } | null;
      if (
        subSlot &&
        timesOverlap(
          slot.start_time,
          slot.end_time,
          subSlot.start_time,
          subSlot.end_time
        )
      ) {
        busyTeachers.add(sub.substitute_teacher_id);
      }
    }

    const candidates: SubstituteCandidate[] = ((allTeachers ?? []) as Teacher[])
      .filter(
        (t) =>
          t.id !== teacherId &&
          !absentSet.has(t.id) &&
          !busyTeachers.has(t.id)
      )
      .map((teacher) => {
        const sameSubject =
          subjectMap.get(teacher.id)?.has(slot.subject_id) ?? false;
        const substitutionsThisMonth = monthCounts.get(teacher.id) ?? 0;
        return { teacher, sameSubject, substitutionsThisMonth, rank: 0 };
      })
      .sort((a, b) => {
        // Priority 1: same subject; Priority 2: fewest subs this month
        if (a.sameSubject !== b.sameSubject) return a.sameSubject ? -1 : 1;
        return a.substitutionsThisMonth - b.substitutionsThisMonth;
      })
      .slice(0, 3)
      .map((c, i) => ({ ...c, rank: i + 1 }));

    suggestions.push({ slot, candidates });
  }

  return { suggestions };
}

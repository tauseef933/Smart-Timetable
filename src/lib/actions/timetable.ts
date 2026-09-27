"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DAYS_OF_WEEK, type ActionResult, type DayOfWeek } from "@/lib/types";

function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

export async function createTimetableSlotAction(input: {
  teacher_id: string;
  class_id: string;
  subject_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_number?: string;
}): Promise<ActionResult<{ id: string }>> {
  if (!input.teacher_id || !input.class_id || !input.subject_id)
    return { success: false, error: "Teacher, class, and subject are required." };
  if (!DAYS_OF_WEEK.includes(input.day_of_week))
    return { success: false, error: "Invalid day of week." };
  if (!input.start_time || !input.end_time)
    return { success: false, error: "Start and end time are required." };
  if (input.start_time >= input.end_time)
    return { success: false, error: "End time must be after start time." };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("timetable")
    .select("id, start_time, end_time")
    .eq("teacher_id", input.teacher_id)
    .eq("day_of_week", input.day_of_week);

  const overlap = (existing ?? []).some((slot) =>
    timesOverlap(
      input.start_time,
      input.end_time,
      slot.start_time,
      slot.end_time
    )
  );

  if (overlap) {
    return {
      success: false,
      error: "This teacher already has a class overlapping this time slot.",
    };
  }

  const { data, error } = await supabase
    .from("timetable")
    .insert({
      teacher_id: input.teacher_id,
      class_id: input.class_id,
      subject_id: input.subject_id,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      room_number: input.room_number?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Could not create timetable slot." };

  revalidatePath("/timetable");
  return { success: true, data: { id: data.id } };
}

export async function deleteTimetableSlotAction(
  id: string
): Promise<ActionResult> {
  const supabase = createClient();

  const { count } = await supabase
    .from("substitutions")
    .select("id", { count: "exact", head: true })
    .eq("timetable_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: "Cannot delete a slot that has substitution history.",
    };
  }

  const { error } = await supabase.from("timetable").delete().eq("id", id);
  if (error) return { success: false, error: "Could not delete slot." };

  revalidatePath("/timetable");
  return { success: true };
}

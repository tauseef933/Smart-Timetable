"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findSubstitutesForAbsence, getDayOfWeek } from "@/lib/substitute-finder";
import { sendSubstituteEmail } from "@/lib/email";
import type {
  ActionResult,
  AppSettings,
  SlotSuggestion,
  Teacher,
  TimetableSlotDetailed,
} from "@/lib/types";

export async function createAbsenceAction(input: {
  teacher_id: string;
  date: string;
  reason?: string;
}): Promise<ActionResult<{ absenceId: string; suggestions: SlotSuggestion[] }>> {
  if (!input.teacher_id) return { success: false, error: "Select a teacher." };
  if (!input.date) return { success: false, error: "Select a date." };

  const day = getDayOfWeek(input.date);
  if (!day) return { success: false, error: "College is closed on Sundays." };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("absences")
    .select("id")
    .eq("teacher_id", input.teacher_id)
    .eq("date", input.date)
    .maybeSingle();

  if (existing)
    return { success: false, error: "This teacher is already marked absent for that date." };

  const { data, error } = await supabase
    .from("absences")
    .insert({
      teacher_id: input.teacher_id,
      date: input.date,
      reason: input.reason?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Could not record absence." };

  const { suggestions, error: findError } = await findSubstitutesForAbsence(
    input.teacher_id,
    input.date
  );

  if (findError)
    return { success: false, error: findError };

  revalidatePath("/absences");
  revalidatePath("/dashboard");
  return {
    success: true,
    data: { absenceId: data.id, suggestions },
  };
}

export async function getSuggestionsAction(
  teacherId: string,
  date: string
): Promise<ActionResult<SlotSuggestion[]>> {
  const { suggestions, error } = await findSubstitutesForAbsence(teacherId, date);
  if (error) return { success: false, error };
  return { success: true, data: suggestions };
}

export async function confirmSubstitutionAction(input: {
  timetable_id: string;
  original_teacher_id: string;
  substitute_teacher_id: string;
  date: string;
}): Promise<ActionResult<{ emailSent: boolean; emailError?: string }>> {
  if (
    !input.timetable_id ||
    !input.original_teacher_id ||
    !input.substitute_teacher_id ||
    !input.date
  ) {
    return { success: false, error: "Missing substitution details." };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("substitutions")
    .select("id")
    .eq("timetable_id", input.timetable_id)
    .eq("date", input.date)
    .maybeSingle();

  if (existing)
    return { success: false, error: "A substitute is already assigned for this period." };

  const { data: sub, error } = await supabase
    .from("substitutions")
    .insert({
      timetable_id: input.timetable_id,
      original_teacher_id: input.original_teacher_id,
      substitute_teacher_id: input.substitute_teacher_id,
      date: input.date,
      status: "assigned",
    })
    .select("id")
    .single();

  if (error || !sub)
    return { success: false, error: "Could not assign substitute." };

  const [{ data: slot }, { data: substitute }, { data: original }, { data: settings }] =
    await Promise.all([
      supabase
        .from("timetable")
        .select(
          `*, teacher:teachers!timetable_teacher_id_fkey(*), class:classes!timetable_class_id_fkey(*), subject:subjects!timetable_subject_id_fkey(*)`
        )
        .eq("id", input.timetable_id)
        .single(),
      supabase
        .from("teachers")
        .select("*")
        .eq("id", input.substitute_teacher_id)
        .single(),
      supabase
        .from("teachers")
        .select("*")
        .eq("id", input.original_teacher_id)
        .single(),
      supabase.from("app_settings").select("*").limit(1).single(),
    ]);

  let emailSent = false;
  let emailError: string | undefined;

  if (slot && substitute && original && settings) {
    const result = await sendSubstituteEmail({
      substitute: substitute as Teacher,
      originalTeacher: original as Teacher,
      slot: slot as unknown as TimetableSlotDetailed,
      date: input.date,
      settings: settings as AppSettings,
    });
    emailSent = result.success;
    emailError = result.error;
    if (result.success) {
      await supabase
        .from("substitutions")
        .update({ status: "notified" })
        .eq("id", sub.id);
    }
  }

  revalidatePath("/absences");
  revalidatePath("/substitutions");
  revalidatePath("/dashboard");

  return { success: true, data: { emailSent, emailError } };
}

export async function deleteAbsenceAction(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("absences").delete().eq("id", id);
  if (error) return { success: false, error: "Could not delete absence." };
  revalidatePath("/absences");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSubstitutionStatusAction(
  id: string,
  status: "assigned" | "notified" | "completed"
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("substitutions")
    .update({ status })
    .eq("id", id);
  if (error) return { success: false, error: "Could not update status." };
  revalidatePath("/substitutions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSubstitutionAction(
  id: string
): Promise<ActionResult> {
  if (!id) return { success: false, error: "Missing substitution id." };

  const supabase = createClient();
  const { error } = await supabase.from("substitutions").delete().eq("id", id);
  if (error) return { success: false, error: "Could not delete substitution." };

  revalidatePath("/substitutions");
  revalidatePath("/absences");
  revalidatePath("/dashboard");
  return { success: true };
}

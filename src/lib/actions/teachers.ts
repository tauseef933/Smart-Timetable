"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils-app";
import type { ActionResult } from "@/lib/types";

export async function createTeacherAction(input: {
  full_name: string;
  email: string;
  phone?: string;
  subject_ids: string[];
}): Promise<ActionResult<{ id: string }>> {
  const full_name = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;

  if (!full_name) return { success: false, error: "Full name is required." };
  if (!isValidEmail(email))
    return { success: false, error: "Enter a valid email address." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("teachers")
    .insert({ full_name, email, phone, is_active: true })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { success: false, error: "A teacher with this email already exists." };
    return { success: false, error: "Could not create teacher." };
  }

  if (input.subject_ids.length > 0) {
    const rows = input.subject_ids.map((subject_id) => ({
      teacher_id: data.id,
      subject_id,
    }));
    const { error: tsError } = await supabase
      .from("teacher_subjects")
      .insert(rows);
    if (tsError)
      return { success: false, error: "Teacher created but subjects failed to save." };
  }

  revalidatePath("/teachers");
  revalidatePath("/dashboard");
  return { success: true, data: { id: data.id } };
}

export async function updateTeacherAction(input: {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  subject_ids: string[];
}): Promise<ActionResult> {
  const full_name = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;

  if (!full_name) return { success: false, error: "Full name is required." };
  if (!isValidEmail(email))
    return { success: false, error: "Enter a valid email address." };

  const supabase = createClient();
  const { error } = await supabase
    .from("teachers")
    .update({ full_name, email, phone, is_active: input.is_active })
    .eq("id", input.id);

  if (error) {
    if (error.code === "23505")
      return { success: false, error: "A teacher with this email already exists." };
    return { success: false, error: "Could not update teacher." };
  }

  await supabase.from("teacher_subjects").delete().eq("teacher_id", input.id);
  if (input.subject_ids.length > 0) {
    const rows = input.subject_ids.map((subject_id) => ({
      teacher_id: input.id,
      subject_id,
    }));
    const { error: tsError } = await supabase
      .from("teacher_subjects")
      .insert(rows);
    if (tsError)
      return { success: false, error: "Teacher updated but subjects failed to save." };
  }

  revalidatePath("/teachers");
  revalidatePath("/timetable");
  return { success: true };
}

export async function deactivateTeacherAction(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("teachers")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { success: false, error: "Could not deactivate teacher." };
  revalidatePath("/teachers");
  return { success: true };
}

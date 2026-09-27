"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function createClassAction(input: {
  class_name: string;
  section: string;
}): Promise<ActionResult<{ id: string }>> {
  const class_name = input.class_name.trim();
  const section = input.section.trim().toUpperCase();

  if (!class_name) return { success: false, error: "Class name is required." };
  if (!section) return { success: false, error: "Section is required." };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("class_name", class_name)
    .eq("section", section)
    .maybeSingle();

  if (existing)
    return { success: false, error: "This class and section already exists." };

  const { data, error } = await supabase
    .from("classes")
    .insert({ class_name, section })
    .select("id")
    .single();

  if (error) return { success: false, error: "Could not create class." };

  revalidatePath("/classes");
  return { success: true, data: { id: data.id } };
}

export async function updateClassAction(input: {
  id: string;
  class_name: string;
  section: string;
}): Promise<ActionResult> {
  const class_name = input.class_name.trim();
  const section = input.section.trim().toUpperCase();

  if (!class_name) return { success: false, error: "Class name is required." };
  if (!section) return { success: false, error: "Section is required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("classes")
    .update({ class_name, section })
    .eq("id", input.id);

  if (error) return { success: false, error: "Could not update class." };
  revalidatePath("/classes");
  revalidatePath("/timetable");
  return { success: true };
}

export async function deleteClassAction(id: string): Promise<ActionResult> {
  const supabase = createClient();

  const { count } = await supabase
    .from("timetable")
    .select("id", { count: "exact", head: true })
    .eq("class_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: "Cannot delete a class that has timetable slots. Remove those first.",
    };
  }

  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) return { success: false, error: "Could not delete class." };

  revalidatePath("/classes");
  return { success: true };
}

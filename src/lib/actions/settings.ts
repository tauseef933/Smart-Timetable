"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function updateSettingsAction(input: {
  college_name: string;
  college_logo_url?: string;
  email_from_name?: string;
}): Promise<ActionResult> {
  const college_name = input.college_name.trim();
  if (!college_name)
    return { success: false, error: "College name is required." };

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("app_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const payload = {
    college_name,
    college_logo_url: input.college_logo_url?.trim() || null,
    email_from_name: input.email_from_name?.trim() || "Timetable Admin",
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("app_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { success: false, error: "Could not save settings." };
  } else {
    const { error } = await supabase.from("app_settings").insert(payload);
    if (error) return { success: false, error: "Could not save settings." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

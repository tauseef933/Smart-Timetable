"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils-app";
import type { ActionResult } from "@/lib/types";

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateAdminEmailAction(input: {
  new_email: string;
  current_password: string;
}): Promise<ActionResult<{ needsConfirmation?: boolean }>> {
  const new_email = input.new_email.trim().toLowerCase();
  const current_password = input.current_password;

  if (!new_email) {
    return { success: false, error: "Enter the new email address." };
  }
  if (!isValidEmail(new_email)) {
    return {
      success: false,
      error: `“${new_email}” is not a valid email format.`,
    };
  }
  if (!current_password) {
    return { success: false, error: "Current password is required to confirm this change." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "You must be signed in." };
  }

  const currentEmail = user.email.trim().toLowerCase();
  if (currentEmail === new_email) {
    return {
      success: false,
      error: "Enter a different email — that is already your sign-in email.",
    };
  }

  // Re-authenticate before sensitive account change
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current_password,
  });
  if (authError) {
    return {
      success: false,
      error: "Current password is incorrect. Use the password you sign in with.",
    };
  }

  const { data, error } = await supabase.auth.updateUser({
    email: new_email,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return {
        success: false,
        error: "That email is already used by another account.",
      };
    }
    if (msg.includes("invalid") || msg.includes("validate")) {
      return {
        success: false,
        error: `Could not update to “${new_email}”. Check the address, or change the email in Supabase Dashboard → Authentication → Users.`,
      };
    }
    return {
      success: false,
      error: error.message || "Could not update email.",
    };
  }

  // If Supabase requires confirmation, email on the session may still be the old one
  const updated = data.user?.email?.toLowerCase();
  const needsConfirmation = updated !== new_email;

  return {
    success: true,
    data: { needsConfirmation },
  };
}

export async function updateAdminPasswordAction(input: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<ActionResult> {
  const { current_password, new_password, confirm_password } = input;

  if (!current_password || !new_password || !confirm_password) {
    return { success: false, error: "All password fields are required." };
  }
  if (new_password.length < 8) {
    return {
      success: false,
      error: "New password must be at least 8 characters.",
    };
  }
  if (new_password !== confirm_password) {
    return { success: false, error: "New passwords do not match." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "You must be signed in." };
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current_password,
  });
  if (authError) {
    return {
      success: false,
      error: "Current password is incorrect. Use the password you sign in with.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: new_password });
  if (error) {
    return {
      success: false,
      error: error.message || "Could not update password.",
    };
  }

  return { success: true };
}

import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import type { AppSettings } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = createClient();

  const [
    { data: settings },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.from("app_settings").select("*").limit(1).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const emailConfigured = Boolean(
    process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim()
  );

  return (
    <SettingsForm
      settings={(settings as AppSettings | null) ?? null}
      emailConfigured={emailConfigured}
      adminEmail={user?.email ?? ""}
    />
  );
}

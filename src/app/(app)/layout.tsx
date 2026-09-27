import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("college_name")
    .limit(1)
    .maybeSingle();

  return (
    <AppShell
      collegeName={settings?.college_name || "Greenfield College"}
      email={user?.email || "admin"}
    >
      {children}
    </AppShell>
  );
}

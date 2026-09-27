"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { updateSettingsAction } from "@/lib/actions/settings";
import {
  updateAdminEmailAction,
  updateAdminPasswordAction,
} from "@/lib/actions/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AppSettings } from "@/lib/types";

interface SettingsFormProps {
  settings: AppSettings | null;
  emailConfigured: boolean;
  adminEmail: string;
}

export function SettingsForm({
  settings,
  emailConfigured,
  adminEmail,
}: SettingsFormProps) {
  const router = useRouter();
  const [collegeName, setCollegeName] = useState(
    settings?.college_name ?? "Greenfield College"
  );
  const [logoUrl, setLogoUrl] = useState(settings?.college_logo_url ?? "");
  const [emailFromName, setEmailFromName] = useState(
    settings?.email_from_name ?? "Timetable Admin"
  );
  const [isPending, startTransition] = useTransition();

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountPending, startAccountTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSettingsAction({
        college_name: collegeName,
        college_logo_url: logoUrl || undefined,
        email_from_name: emailFromName || undefined,
      });
      if (!result.success) {
        toast.error(result.error || "Could not save settings.");
        return;
      }
      toast.success("Settings saved.");
    });
  }

  function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    startAccountTransition(async () => {
      const result = await updateAdminEmailAction({
        new_email: newEmail,
        current_password: emailPassword,
      });
      if (!result.success) {
        toast.error(result.error || "Could not update email.");
        return;
      }
      if (result.data?.needsConfirmation) {
        toast.success(
          `Confirmation sent to ${newEmail}. Open that inbox and confirm, then sign in with the new email.`
        );
      } else {
        toast.success(`Sign-in email updated to ${newEmail}.`);
      }
      setEmailPassword("");
      setNewEmail("");
      router.refresh();
    });
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    startAccountTransition(async () => {
      const result = await updateAdminPasswordAction({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      if (!result.success) {
        toast.error(result.error || "Could not update password.");
        return;
      }
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="College branding, account security, and email preferences."
      />

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            emailConfigured
              ? "bg-teal-50 text-teal-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">Gmail SMTP</p>
          <p className="text-xs text-slate-500">
            Configured via server environment variables{" "}
            <code className="rounded bg-slate-100 px-1">GMAIL_USER</code> and{" "}
            <code className="rounded bg-slate-100 px-1">GMAIL_APP_PASSWORD</code>
            . Not editable in the app.
          </p>
        </div>
        {emailConfigured ? (
          <Badge className="gap-1 bg-teal-700 hover:bg-teal-700">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 text-amber-800">
            <AlertCircle className="h-3 w-3" />
            Not configured
          </Badge>
        )}
      </div>

      <div className="grid max-w-3xl gap-6">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              College profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="college_name">College name</Label>
                <Input
                  id="college_name"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college_logo_url">Logo URL (optional)</Label>
                <Input
                  id="college_logo_url"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_from_name">Email sender name</Label>
                <Input
                  id="email_from_name"
                  value={emailFromName}
                  onChange={(e) => setEmailFromName(e.target.value)}
                  placeholder="Timetable Admin"
                />
                <p className="text-xs text-slate-500">
                  Display name shown on substitute notification emails.
                </p>
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-teal-700 hover:bg-teal-800"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save settings"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Shield className="h-4 w-4 text-teal-700" />
              Admin account
            </CardTitle>
            <p className="text-sm text-slate-500">
              Change the email or password used to sign in to this system.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <form onSubmit={handleEmailChange} className="space-y-4">
              <p className="text-sm font-medium text-slate-800">Sign-in email</p>
              <p className="text-xs text-slate-500">
                Current sign-in email:{" "}
                <span className="font-medium text-slate-700">{adminEmail}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="new_email">New email</Label>
                <Input
                  id="new_email"
                  type="text"
                  inputMode="email"
                  autoComplete="off"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  required
                />
                <p className="text-xs text-slate-500">
                  Type a <strong>new</strong> address (not the current one). You
                  may need to confirm it from your inbox.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_password">Current password</Label>
                <Input
                  id="email_password"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={accountPending}
              >
                {accountPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update email"
                )}
              </Button>
            </form>

            <div className="border-t border-slate-100 pt-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <p className="text-sm font-medium text-slate-800">
                  Sign-in password
                </p>
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm new password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800"
                  disabled={accountPending}
                >
                  {accountPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

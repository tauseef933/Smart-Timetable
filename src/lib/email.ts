import nodemailer from "nodemailer";
import type { TimetableSlotDetailed, Teacher, AppSettings } from "@/lib/types";

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendSubstituteEmail(params: {
  substitute: Teacher;
  originalTeacher: Teacher;
  slot: TimetableSlotDetailed;
  date: string;
  settings: AppSettings;
}): Promise<{ success: boolean; error?: string }> {
  const { substitute, originalTeacher, slot, date, settings } = params;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return {
      success: false,
      error: "Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.",
    };
  }

  const collegeName = settings.college_name || "College";
  const fromName = settings.email_from_name || "Timetable Admin";
  const classLabel = `${slot.class.class_name} – Section ${slot.class.section}`;
  const timeLabel = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(15,55,75,0.08);">
          <tr>
            <td style="background:#0f766e;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${collegeName}</h1>
              <p style="margin:6px 0 0;color:#ccfbf1;font-size:13px;">Substitute Teacher Assignment</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#134e4a;font-size:15px;">Dear ${substitute.full_name},</p>
              <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
                You have been assigned as a substitute for <strong>${originalTeacher.full_name}</strong>. Please find the details below:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:8px;border:1px solid #99f6e4;">
                <tr><td style="padding:16px 20px;">
                  <p style="margin:0 0 8px;color:#0f766e;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;font-weight:600;">Assignment Details</p>
                  <p style="margin:0 0 6px;color:#134e4a;font-size:14px;"><strong>Subject:</strong> ${slot.subject.name}</p>
                  <p style="margin:0 0 6px;color:#134e4a;font-size:14px;"><strong>Class:</strong> ${classLabel}</p>
                  <p style="margin:0 0 6px;color:#134e4a;font-size:14px;"><strong>Date:</strong> ${date}</p>
                  <p style="margin:0 0 6px;color:#134e4a;font-size:14px;"><strong>Time:</strong> ${timeLabel}</p>
                  <p style="margin:0;color:#134e4a;font-size:14px;"><strong>Room:</strong> ${slot.room_number || "TBA"}</p>
                </td></tr>
              </table>
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                Please arrive a few minutes early. Contact the admin office if you have any questions.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated message from ${collegeName} Timetable System.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${fromName}" <${process.env.GMAIL_USER}>`,
      to: substitute.email,
      subject: `Substitute Assignment – ${slot.subject.name} (${date})`,
      html,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { success: false, error: message };
  }
}

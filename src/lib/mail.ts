import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.SMTP_FROM ?? 'noreply@skillforge.lk';
const APP    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${APP}/verify-email?token=${token}`;
  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: 'Verify your SkillForge email',
    html:    `<p>Click to verify: <a href="${link}">${link}</a></p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${APP}/reset-password?token=${token}`;
  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: 'Reset your SkillForge password',
    html:    `<p>Click to reset: <a href="${link}">${link}</a></p>`,
  });
}

export async function sendSessionReminderEmail(
  email: string,
  expertName: string,
  sessionDate: string,
) {
  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: 'Upcoming Expert Session Reminder',
    html:    `<p>Your session with ${expertName} is on ${sessionDate}.</p>`,
  });
}

export async function sendBookingNotificationEmail(opts: {
  expertEmail:     string;
  expertName:      string;
  userName:        string;
  userEmail:       string;
  scheduledDate:   string;
  durationMinutes: number;
  skillDomain?:    string | null;
  notes?:          string | null;
  sessionId:       string;
}) {
  const {
    expertEmail, expertName, userName, userEmail,
    scheduledDate, durationMinutes, skillDomain, notes, sessionId,
  } = opts;

  const dateStr = new Date(scheduledDate).toLocaleString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const topic    = skillDomain ?? 'General session';
  const notesRow = notes
    ? `<tr>
         <td style="padding:8px 0;color:#6b7280;font-size:14px;width:130px">Message</td>
         <td style="padding:8px 0;font-size:14px;color:#111827">${notes.replace(/</g, '&lt;')}</td>
       </tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr>
          <td align="center" style="padding-bottom:24px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#4f46e5;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle">
                  <span style="color:#fff;font-size:18px;font-weight:bold;line-height:36px">&#9733;</span>
                </td>
                <td style="padding-left:10px;font-size:20px;font-weight:bold;color:#111827">SkillForge</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:32px">

            <!-- Icon + title -->
            <div style="text-align:center;margin-bottom:24px">
              <div style="display:inline-block;background:#eef2ff;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:26px;text-align:center">&#128197;</div>
              <h1 style="margin:16px 0 4px;font-size:22px;color:#111827">New Session Booking</h1>
              <p style="margin:0;color:#6b7280;font-size:14px">Hi ${expertName}, someone has booked a session with you.</p>
            </div>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px">

            <!-- Details table -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;width:130px">From</td>
                <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600">${userName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px">Email</td>
                <td style="padding:8px 0;font-size:14px">
                  <a href="mailto:${userEmail}" style="color:#4f46e5;text-decoration:none">${userEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px">Topic</td>
                <td style="padding:8px 0;font-size:14px;color:#111827">${topic}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px">Date &amp; Time</td>
                <td style="padding:8px 0;font-size:14px;color:#111827">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px">Duration</td>
                <td style="padding:8px 0;font-size:14px;color:#111827">${durationMinutes} minutes</td>
              </tr>
              ${notesRow}
            </table>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">

            <!-- Reply CTA -->
            <p style="margin:0 0 20px;font-size:14px;color:#374151">
              You can reply directly to this email to contact <strong>${userName}</strong>, or reach them at
              <a href="mailto:${userEmail}" style="color:#4f46e5">${userEmail}</a>.
            </p>

            <div style="text-align:center">
              <a href="mailto:${userEmail}"
                 style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;
                        padding:12px 28px;border-radius:8px;text-decoration:none">
                Reply to ${userName}
              </a>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:20px;text-align:center;color:#9ca3af;font-size:12px">
            Session ID: ${sessionId} &nbsp;·&nbsp; SkillForge &nbsp;·&nbsp;
            <a href="${APP}" style="color:#9ca3af">${APP}</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from:     `${userName} via SkillForge <${FROM}>`,
    to:       expertEmail,
    reply_to: userEmail,
    subject:  `New booking: ${topic} on ${new Date(scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    html,
  });
}

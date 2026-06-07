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

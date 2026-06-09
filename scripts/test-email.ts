/**
 * Quick smoke-test for the Resend email service.
 * Usage:  npx tsx scripts/test-email.ts your@email.com
 *
 * NOTE: When using onboarding@resend.dev as SMTP_FROM, Resend only allows
 * sending to the email address you registered your Resend account with.
 */
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config({ path: '.env.local' });

const apiKey  = process.env.RESEND_API_KEY;
const from    = process.env.SMTP_FROM ?? 'onboarding@resend.dev';
const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const to      = process.argv[2];

if (!apiKey || apiKey === 're_...') {
  console.error('ERROR: RESEND_API_KEY is not set in .env.local');
  process.exit(1);
}

if (!to) {
  console.error('Usage: npx tsx scripts/test-email.ts your@email.com');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function main() {
  console.log(`Sending test email...`);
  console.log(`  From : ${from}`);
  console.log(`  To   : ${to}`);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: 'SkillForge — Email service test',
    html: `
      <p>This is a test email from SkillForge.</p>
      <p>If you received this, your Resend integration is working correctly.</p>
      <p>App URL: <a href="${appUrl}">${appUrl}</a></p>
    `,
  });

  if (error) {
    console.error('\nFAILED:', error.message ?? JSON.stringify(error));
    console.error('\nCommon causes:');
    console.error('  • SMTP_FROM domain not verified in Resend dashboard');
    console.error('  • When using onboarding@resend.dev, you can only send to your Resend account email');
    console.error('  • Invalid or expired API key');
    process.exit(1);
  }

  console.log('\nSUCCESS! Email sent.');
  console.log('  Message ID:', data?.id);
}

main();

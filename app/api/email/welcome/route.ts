import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  console.log('Welcome email route hit with body:', rawBody)
  const { email, name } = JSON.parse(rawBody) as { email: string; name?: string };

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const firstName = name?.split(' ')[0] || 'there';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 24px;">
      Hey ${firstName},
    </p>

    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 24px;">
      Welcome to AURI. Really glad you're here.
    </p>

    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 24px;">
      <strong>What AURI does:</strong> it reads your resume and a real job description, then tells you exactly what's matching, what's missing, and what to fix — so your application actually gets past the ATS filter.
    </p>

    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 8px;">
      <strong>The one thing I'd do first:</strong>
    </p>
    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 24px;">
      Run a resume scan against a real job description. Paste in a job posting you actually want, upload your resume, and hit scan. You'll see your ATS score and a list of specific gaps to close. It takes about 30 seconds and it's free.
    </p>

    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 24px;">
      → <a href="https://www.auri-resume.com/dashboard" style="color:#6366F1;text-decoration:none;font-weight:600;">Go to your dashboard</a>
    </p>

    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 8px;">
      If you have questions or run into anything, just reply to this email — I read every one.
    </p>

    <p style="font-size:16px;line-height:1.6;color:#111111;margin:24px 0 0;">
      Lucas,<br>
      <span style="color:#888888;">founder of AURI</span>
    </p>

    <hr style="border:none;border-top:1px solid #eeeeee;margin:40px 0 24px;">

    <p style="font-size:12px;line-height:1.6;color:#aaaaaa;margin:0;">
      You received this because you created an AURI account.<br>
      To unsubscribe or manage your email preferences, contact
      <a href="mailto:support@auri-resume.com" style="color:#aaaaaa;">support@auri-resume.com</a>.
    </p>

  </div>
</body>
</html>
`.trim();

  const text = `
Hey ${firstName},

Welcome to AURI. Really glad you're here.

What AURI does: it reads your resume and a real job description, then tells you exactly what's matching, what's missing, and what to fix — so your application actually gets past the ATS filter.

The one thing I'd do first:

Run a resume scan against a real job description. Paste in a job posting you actually want, upload your resume, and hit scan. You'll see your ATS score and a list of specific gaps to close. It takes about 30 seconds and it's free.

→ https://www.auri-resume.com/dashboard

If you have questions or run into anything, just reply to this email — I read every one.

Lucas, founder of AURI

---
You received this because you created an AURI account.
To unsubscribe or manage your email preferences, contact support@auri-resume.com.
`.trim();

  const { error } = await resend.emails.send({
    from: 'Lucas at AURI <hello@auri-resume.com>',
    to: email,
    subject: 'Welcome to AURI — here\'s where to start',
    html,
    text,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

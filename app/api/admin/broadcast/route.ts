import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminAuth } from '@/lib/firebaseAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_HTML = `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
  <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">AURI just got a lot better.</h1>
  <p style="color: #6b6b80; font-size: 14px; margin-bottom: 32px;">A quick update from Lucas, AURI founder</p>

  <p>Hey {{name}},</p>

  <p>A lot has changed since you signed up. Here's what's new:</p>

  <ul style="padding-left: 20px; line-height: 1.8;">
    <li>🌐 New home — we're now live at <a href="https://auri-resume.com">auri-resume.com</a></li>
    <li>🐛 Easy Tune editor bug fixed — edits now save correctly</li>
    <li>💼 Beta users have landed interviews at Amazon and leading tech companies</li>
  </ul>

  <p>If you haven't logged in recently, now's a good time. The product is meaningfully better than when you first signed up.</p>

  <p style="margin-top: 32px;">
    <a href="https://auri-resume.com/login" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Log back in →</a>
  </p>

  <p style="margin-top: 40px; font-size: 13px; color: #6b6b80;">
    Know someone job searching? Send them to auri-resume.com<br><br>
    — Lucas<br>
    Founder, AURI<br><br>
    <a href="https://auri-resume.com" style="color: #6366f1;">auri-resume.com</a>
  </p>
</div>`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBroadcast() {
  if (!adminAuth) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  const users: { email: string; name: string }[] = [];
  let pageToken: string | undefined;
  do {
    const result = await adminAuth.listUsers(1000, pageToken);
    for (const user of result.users) {
      if (!user.email) continue;
      const firstName = (user.displayName ?? '').split(' ')[0] || 'there';
      users.push({ email: user.email, name: firstName });
    }
    pageToken = result.pageToken;
  } while (pageToken);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const user of users) {
    const html = EMAIL_HTML.replace('{{name}}', user.name);

    const { error } = await resend.emails.send({
      from: 'Lucas at AURI <hello@auri-resume.com>',
      to: user.email,
      subject: 'AURI just got a lot better — here\'s what\'s new',
      html,
    });

    if (error) {
      failed++;
      errors.push(`${user.email}: ${error.message}`);
    } else {
      sent++;
    }

    await sleep(100);
  }

  return NextResponse.json({ sent, failed, errors });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.BROADCAST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runBroadcast();
}

export async function POST(req: NextRequest) {
  console.log('[broadcast] BROADCAST_SECRET:', process.env.BROADCAST_SECRET);
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^bearer\s+/i, '').trim();
  console.log('[broadcast] extracted token:', JSON.stringify(token), '| expected:', JSON.stringify(process.env.BROADCAST_SECRET));
  if (!token || token !== process.env.BROADCAST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runBroadcast();
}

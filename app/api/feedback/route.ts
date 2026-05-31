import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const category = formData.get('category') as string | null;
  const message = formData.get('message') as string | null;
  const userEmail = formData.get('userEmail') as string | null;
  const file = formData.get('file') as File | null;

  if (!category || !message || !userEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  type ResendAttachment = { filename: string; content: Buffer };
  const attachments: ResendAttachment[] = [];

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({ filename: file.name, content: buffer });
  }

  const { error } = await resend.emails.send({
    from: 'AURI Feedback <hello@auri-resume.com>',
    to: 'support@auri-resume.com',
    replyTo: userEmail,
    subject: `[${category}] Feedback from ${userEmail}`,
    html: `<div style="font-family: sans-serif; max-width: 560px;">
      <h2 style="margin-bottom: 4px;">${category}</h2>
      <p style="color: #888; margin-top: 0;">Feedback from the AURI dashboard</p>
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; background: #f5f5f5; padding: 12px; border-radius: 6px;">${message}</p>
      ${file ? `<p style="color: #888; font-size: 13px;">Attachment: ${file.name}</p>` : ''}
    </div>`,
    ...(attachments.length > 0 ? { attachments } : {}),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

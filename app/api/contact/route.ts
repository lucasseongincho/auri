import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json() as { name: string; email: string; message: string };

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'AURI Contact <hello@auri-resume.com>',
    to: 'support@auri-resume.com',
    replyTo: email,
    subject: `Contact form: ${name}`,
    html: `<div style="font-family: sans-serif; max-width: 560px;">
      <h2 style="margin-bottom: 4px;">New contact message</h2>
      <p style="color: #888; margin-top: 0;">From the AURI contact form</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${message}</p>
    </div>`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

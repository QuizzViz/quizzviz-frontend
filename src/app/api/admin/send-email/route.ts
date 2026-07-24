import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';

const SUPPORT_SENDER_EMAIL = 'support@quizzviz.com';

export async function POST(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipient_email, subject, message } = await request.json();

    if (!recipient_email || typeof recipient_email !== 'string' || !recipient_email.includes('@')) {
      return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 });
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SEND_EMAILS_SERVICE_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender_email: SUPPORT_SENDER_EMAIL,
        recipient_email: recipient_email.trim(),
        subject: subject.trim().substring(0, 200),
        message: message.trim().substring(0, 10000),
        email_type: 'admin_notice',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || `Failed to send email. Status: ${response.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}

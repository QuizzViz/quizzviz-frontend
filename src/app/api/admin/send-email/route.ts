import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';

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

    // /send-admin-message is a dedicated endpoint on the mail service for
    // outbound admin-to-customer messages — plain QuizzViz-branded email
    // (logo + wordmark, message, footer). It's distinct from /send-email,
    // which is for inbound contact/feedback/bug-report notifications TO the
    // QuizzViz team and renders a "New Contact Message" / From-To-Date
    // wrapper that isn't appropriate for a message going the other direction.
    const response = await fetch(`${process.env.NEXT_PUBLIC_SEND_EMAILS_SERVICE_URL}/send-admin-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        recipient_email: recipient_email.trim(),
        subject: subject.trim().substring(0, 200),
        message: message.trim().substring(0, 10000),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const upstreamMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      return NextResponse.json(
        { error: `Mail service rejected the request (${response.status}): ${upstreamMessage}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}

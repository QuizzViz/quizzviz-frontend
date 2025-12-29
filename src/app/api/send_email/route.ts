import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
const FEEDBACK_RECIPIENT_EMAIL = 'syedshahmirsultan@gmail.com';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'You must be signed in to submit feedback' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const { subject, message, email_type, userEmail, email } = await request.json();
    
    // Validate request body
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    const senderEmail = userEmail || email;
    if (!senderEmail || typeof senderEmail !== 'string' || !senderEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'A valid email is required' },
        { status: 400 }
      );
    }

    // Prepare the email data
    const emailData = {
      sender_email: senderEmail,
      recipient_email: FEEDBACK_RECIPIENT_EMAIL,
      message: message.substring(0, 5000),
      subject: `[QuizzViz ${email_type || 'Contact'}] ${subject}`.substring(0, 100),
      email_type: email_type || 'contact'
    };

    console.log('Sending email with data:', emailData);

    // Send the email using the external service
    const response = await fetch(`${process.env.NEXT_PUBLIC_SEND_EMAILS_SERVICE_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Email service error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      throw new Error(
        errorData.message || 
        `Failed to send email. Status: ${response.status} ${response.statusText}`
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your message! We will get back to you soon.'
    });

  } catch (error) {
    console.error('Error processing request:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}

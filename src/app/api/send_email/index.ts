import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';

const FEEDBACK_RECIPIENT_EMAIL = 'syedshahmirsultan@gmail.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    // Get user session
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'You must be signed in to submit feedback' 
      });
    }
    
    // Get user data from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userEmail = user.emailAddresses?.[0]?.emailAddress;

    // Validate request body
    const { subject, message,email_type } = req.body;
    
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject is required' 
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    // Prepare the email data in the exact format expected by the backend
    const emailData = {
      sender_email: userEmail,
      recipient_email: FEEDBACK_RECIPIENT_EMAIL,
      message: message.substring(0, 5000), // Limit message length
      subject: `[QuizzViz Feedback] ${subject}`.substring(0, 100), // Limit subject length
      email_type: email_type  
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
        `Failed to send feedback. Status: ${response.status} ${response.statusText}`
      );
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Thank you for your feedback! We appreciate your input.' 
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred. Please try again later.'
    });
  }
}

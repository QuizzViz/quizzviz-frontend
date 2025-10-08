import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';

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
    
    // For now, we'll use a placeholder email since we're having issues with clerkClient
    // In a production environment, you should properly get the user's email
    const userEmail = `user-${userId}@quizzviz.com`;

    // Validate request body
    const { subject, message } = req.body;
    
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

    // Prepare the email data
    const emailData = {
      sender_email: userEmail,
      recipient_email: FEEDBACK_RECIPIENT_EMAIL,
      subject: `[QuizzViz Feedback] ${subject}`.substring(0, 100), // Limit subject length
      message: message.substring(0, 5000) // Limit message length
    };

    // Send the email using the external service
    const response = await fetch('https://quizzviz-send-emails.up.railway.app/feedback', {
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

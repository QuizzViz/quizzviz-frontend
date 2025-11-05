import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      recipient_email, 
      user_name, 
      quiz_title, 
      expiry_date 
    } = req.body;

    // Validate required fields
    if (!recipient_email || !user_name || !quiz_title || !expiry_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recipient_email, user_name, quiz_title, and expiry_date are required'
      });
    }

    // Format the date for display
    const formattedDate = new Date(expiry_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    // Send the email using the external service
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SEND_EMAILS_SERVICE_URL}/send-quiz-expired-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          recipient_email,
          user_name,
          quiz_title,
          expiry_date: formattedDate
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Email service error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      throw new Error(
        errorData.message || 
        `Failed to send quiz expired email. Status: ${response.status} ${response.statusText}`
      );
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Quiz expiration notification sent successfully' 
    });

  } catch (error) {
    console.error('Error sending quiz expired email:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while sending the quiz expiration notification.'
    });
  }
}

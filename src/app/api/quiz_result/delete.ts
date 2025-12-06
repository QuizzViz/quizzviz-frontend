import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL}`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { quiz_id, username, email } = req.query;

  try {
    let url = '';
    
    if (username && email) {
      // Delete specific user result
      url = `${API_BASE_URL}/result/quiz/${quiz_id}/username/${encodeURIComponent(username as string)}/email/${encodeURIComponent(email as string)}`;
    } else if (quiz_id) {
      // Delete all results for a quiz
      url = `${API_BASE_URL}/result/quiz/${quiz_id}`;
    } else {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error deleting quiz result:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

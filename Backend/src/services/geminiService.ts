import dotenv from 'dotenv';
import { Review, UserProfile } from '../types';

dotenv.config();

export async function getAnalysis(
  reviews: Review[],
  userProfile: UserProfile,
  asin: string
): Promise<string> {

  const reviewText = reviews
    .map((r, i) => `Review ${i + 1} (${r.rating}/5, ${r.date}):\n${r.body}`)
    .join('\n\n');

  const prompt = `
    You are an expert product analyst. Analyze the following Amazon product reviews and provide a personalized analysis for this specific user.

    User Profile:
    - Age: ${userProfile.age}
    - Gender: ${userProfile.gender}
    - Use Case: ${userProfile.useCase}

    Product ASIN: ${asin}

    Reviews:
    ${reviewText}

    Provide a detailed analysis including:
    1. Overall verdict for this specific user based on their profile
    2. Pros (relevant to this user)
    3. Cons (relevant to this user)
    4. Usability for their specific use case
    5. Final recommendation

    Keep the analysis concise, personalized and actionable.
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini API');
  }

  return text;
}
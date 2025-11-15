const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateAIRecommendation(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No recommendation available';
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Unable to generate recommendation at this time';
  }
}

export async function parseVoiceCommand(transcript: string): Promise<{
  action: 'create' | 'complete' | 'update' | 'unknown';
  taskTitle?: string;
  priority?: number;
  dueDate?: string;
}> {
  const prompt = `Parse this voice command for task management and return JSON only:
"${transcript}"

Return format:
{
  "action": "create|complete|update|unknown",
  "taskTitle": "extracted task title",
  "priority": 1-4 (1=critical, 2=high, 3=medium, 4=low),
  "dueDate": "YYYY-MM-DD format if mentioned"
}`;

  try {
    const response = await generateAIRecommendation(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Parse error:', error);
  }

  return { action: 'unknown' };
}

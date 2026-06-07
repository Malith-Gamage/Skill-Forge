import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnswerAnalysis {
  score: number;        // 1–10
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  feedback: string;     // 1–2 sentence summary
  suggestions: string[];
}

export async function analyzeAnswer(
  questionTitle: string,
  questionContent: string,
  answerContent: string,
): Promise<AnswerAnalysis> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a technical answer quality reviewer. Analyse the given answer in the context of the question and return a JSON object with: score (integer 1-10), quality ("Excellent"|"Good"|"Fair"|"Poor"), feedback (1-2 sentence plain-text summary), suggestions (array of short improvement strings, empty array if score >= 8).',
      },
      {
        role: 'user',
        content: `Question title: ${questionTitle}\n\nQuestion details: ${questionContent}\n\nAnswer: ${answerContent}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 300,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return JSON.parse(content) as AnswerAnalysis;
}

export async function generateRoadmap(skill: string): Promise<{
  title: string;
  checkpoints: { title: string; order_index: number; coins_awarded: number; tasks: string[] }[];
}> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a learning path expert. Return a JSON object with title (string) and checkpoints (array of {title, order_index, coins_awarded, tasks}). Generate 5-8 checkpoints, each with 2-4 short task title strings in the tasks array.',
      },
      {
        role: 'user',
        content: `Create a skill roadmap for: ${skill}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return JSON.parse(content);
}

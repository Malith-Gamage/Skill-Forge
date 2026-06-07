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

export interface RoadmapResource {
  title: string;
  type: 'VIDEO' | 'ARTICLE' | 'COURSE' | 'PODCAST';
  url: string;
}

export interface GeneratedCheckpoint {
  title: string;
  description: string;
  order_index: number;
  coins_awarded: number;
  tasks: string[];
  resources: RoadmapResource[];
}

export interface GeneratedRoadmap {
  title: string;
  checkpoints: GeneratedCheckpoint[];
}

export async function generateRoadmap(skill: string): Promise<GeneratedRoadmap> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a learning path expert. Return a JSON object with title (string) and checkpoints (array of 5-8 items).

Each checkpoint must have:
- title (string)
- description (string): A 3-4 sentence learning plan for the user. Explain what they will learn in this checkpoint, the key concepts they will master, and practical advice on how to approach completing it. Write it directly to the learner (use "you" / "you'll").
- order_index (integer starting at 0)
- coins_awarded (integer 50-200)
- tasks (array of 2-4 short task title strings)
- resources: an array of exactly 3 objects. Each object MUST have three fields: "title" (string), "type" (string), "url" (string). One must have type "VIDEO", one "COURSE", one "ARTICLE". Example format:
  [
    { "title": "Watch: Python Basics Tutorial", "type": "VIDEO", "url": "https://www.youtube.com/results?search_query=python+basics+tutorial" },
    { "title": "Course: Learn Python on Coursera", "type": "COURSE", "url": "https://www.coursera.org/search?query=python+basics" },
    { "title": "Read: Python Docs — Getting Started", "type": "ARTICLE", "url": "https://docs.python.org/3/tutorial/index.html" }
  ]

STRICT URL RULES:
- VIDEO type: always https://www.youtube.com/results?search_query=TOPIC+tutorial (replace TOPIC with checkpoint subject, + between words)
- COURSE type: use one of — https://www.coursera.org/search?query=TOPIC  or  https://www.udemy.com/courses/search/?q=TOPIC  or  https://www.edx.org/search?q=TOPIC
- ARTICLE type: use a real stable URL — MDN (developer.mozilla.org), official language/framework docs, or freeCodeCamp (freecodecamp.org/news/...)`,
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

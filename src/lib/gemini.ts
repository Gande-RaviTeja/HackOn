import Groq from 'groq-sdk';

const apiKey = process.env.GEMINI_API_KEY || '';

// We reuse GEMINI_API_KEY env var name but now it holds a Groq key
let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export function isGeminiConfigured(): boolean {
  return !!(apiKey && apiKey !== 'demo_key' && apiKey.length > 10);
}

// Chat completion using Groq (Llama 3)
export async function groqChat(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  question: string
): Promise<string> {
  const groq = getGroq();

  const chatMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: question },
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: chatMessages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content || 'No response generated.';
}

// Simple text generation (for summaries, quizzes, recommendations)
export async function groqGenerate(prompt: string): Promise<string> {
  const groq = getGroq();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content || '';
}

// Legacy wrappers for backward compatibility
export function getGeminiFlash() {
  return {
    generateContent: async (prompt: string) => {
      const text = await groqGenerate(prompt);
      return {
        response: {
          text: () => text,
        },
      };
    },
    startChat: ({ history }: { history: { role: string; parts: { text: string }[] }[] }) => {
      // Convert Gemini history format to Groq messages
      const systemMsg = history.length > 0 ? history[0].parts[0].text : '';
      const chatHistory = history.slice(2).map(h => ({
        role: h.role === 'model' ? 'assistant' as const : 'user' as const,
        content: h.parts[0].text,
      }));

      return {
        sendMessage: async (message: string) => {
          const answer = await groqChat(systemMsg, chatHistory, message);
          return {
            response: {
              text: () => answer,
            },
          };
        },
      };
    },
  };
}

export function getGeminiPro() {
  // Use the same model but with lower temperature for quizzes
  return {
    generateContent: async (prompt: string) => {
      const groq = getGroq();
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
      });
      const text = completion.choices[0]?.message?.content || '';
      return {
        response: {
          text: () => text,
        },
      };
    },
  };
}

// Embeddings - Groq doesn't offer embeddings, so we use a simple hash-based approach
// For production, you'd use a dedicated embedding API
export async function embedText(text: string): Promise<number[]> {
  // Simple TF-based embedding for basic vector search
  // This creates a 768-dimension vector from text for compatibility
  const dimension = 768;
  const embedding = new Array(dimension).fill(0);

  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash + word.charCodeAt(j)) | 0;
    }
    const index = Math.abs(hash) % dimension;
    embedding[index] += 1;
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimension; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

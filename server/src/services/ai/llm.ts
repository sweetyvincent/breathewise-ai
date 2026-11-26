import OpenAI from 'openai';
import type { LlmClient } from './llmTypes';

export type { ChatMessage, LlmClient } from './llmTypes';

export function createOpenAiClient(apiKey: string, model: string): LlmClient {
  const client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 1 });
  return {
    model,
    async completeJson({ system, user, maxTokens = 1800 }) {
      const res = await client.chat.completions.create({
        model,
        temperature: 0.3,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const content = res.choices[0]?.message?.content;
      if (!content) throw new Error('empty completion');
      return JSON.parse(content) as unknown;
    },
    async chat({ system, messages, maxTokens = 600 }) {
      const res = await client.chat.completions.create({
        model,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: system }, ...messages],
      });
      const content = res.choices[0]?.message?.content?.trim();
      if (!content) throw new Error('empty completion');
      return content;
    },
  };
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Minimal LLM port so the rest of the app (and the tests) never depend on a vendor SDK. */
export interface LlmClient {
  readonly model: string;
  completeJson(args: { system: string; user: string; maxTokens?: number }): Promise<unknown>;
  chat(args: { system: string; messages: ChatMessage[]; maxTokens?: number }): Promise<string>;
}

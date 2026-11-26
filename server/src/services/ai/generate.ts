/** Runs one structured LLM call: schema validation, safety screen, server-side finalize, rules fallback. */
import type { z } from 'zod';
import { logger } from '../../lib/logger';
import { screenValue } from './guardrails';
import type { LlmClient } from './llmTypes';

export type GeneratedBy = 'openai' | 'rules';
export type FallbackReason = 'no_api_key' | 'ai_error' | 'invalid_output' | 'safety_screen';

export interface Generated<T> {
  data: T;
  generatedBy: GeneratedBy;
  model?: string;
  fallbackReason?: FallbackReason;
}

/**
 * Ask the LLM for structured JSON, then: validate against a zod schema → safety/anti-fabrication screen →
 * deterministic post-processing. On ANY failure we return the rule-based result instead, so users always get
 * a safe, validated answer, and the response says which engine produced it.
 */
export async function generateStructured<T>(opts: {
  llm?: LlmClient;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  fallback: () => T;
  /** Overrides model output with server-computed facts (risk level, calculated numbers…). */
  finalize: (data: T) => T;
  actualAqi?: number;
  label: string;
}): Promise<Generated<T>> {
  const rules = (reason: FallbackReason): Generated<T> => ({ data: opts.fallback(), generatedBy: 'rules', fallbackReason: reason });
  if (!opts.llm) return rules('no_api_key');
  try {
    const raw = await opts.llm.completeJson({ system: opts.system, user: opts.user });
    const parsed = opts.schema.safeParse(raw);
    if (!parsed.success) {
      logger.warn('ai output failed schema validation', { label: opts.label, issues: parsed.error.issues.length });
      return rules('invalid_output');
    }
    const screen = screenValue(parsed.data, { actualAqi: opts.actualAqi });
    if (!screen.ok) {
      logger.warn('ai output rejected by safety screen', { label: opts.label, reason: screen.reason });
      return rules('safety_screen');
    }
    return { data: opts.finalize(parsed.data), generatedBy: 'openai', model: opts.llm.model };
  } catch (err) {
    logger.warn('ai call failed', { label: opts.label, reason: err instanceof Error ? err.name : 'unknown' });
    return rules('ai_error');
  }
}

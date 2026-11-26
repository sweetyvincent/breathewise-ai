import { parseOrThrow } from '../lib/errors';
import { chatRequestSchema, dailyPlanRequestSchema, indoorRequestSchema, mobilityRequestSchema } from '../schemas';
import type { ContextLoader } from './context';
import { aiMeta, dataQuality } from './presenters';
import { needUser, type CallUser, type CoreDeps } from './types';

const CHAT_HISTORY_LIMIT = 50;
const CHAT_DISCLAIMER = 'BreatheBot offers general information, not medical advice. Follow official local health advisories.';

/** The AI-assisted features: daily plan, indoor advice, mobility advice and the BreatheBot chat. */
export function createRecommendationHandlers(d: CoreDeps, ctx: ContextLoader) {
  return {
    async dailyPlan(input: unknown, user?: CallUser) {
      const b = parseOrThrow(dailyPlanRequestSchema, input);
      const env = await ctx.loadContext(b.location, b.demo);
      const out = await d.ai.dailyPlan(b.profile, env);
      if (user) void d.store.saveDailyPlan(user.id, out.data).catch(() => undefined);
      return { plan: out.data, ...aiMeta(out), dataQuality: dataQuality(env) };
    },

    async indoor(input: unknown) {
      const b = parseOrThrow(indoorRequestSchema, input);
      const env = await ctx.loadContext(b.location, b.demo);
      const out = await d.ai.indoor(b.home, env);
      return { recommendations: out.data, ...aiMeta(out), dataQuality: dataQuality(env) };
    },

    async mobility(input: unknown) {
      const b = parseOrThrow(mobilityRequestSchema, input);
      const env = await ctx.loadContext(b.location, b.demo);
      const out = await d.ai.mobility(b, env);
      return { result: out.data, ...aiMeta(out), dataQuality: dataQuality(env) };
    },

    async chat(input: unknown, user?: CallUser) {
      const b = parseOrThrow(chatRequestSchema, input);
      const env = b.location ? await ctx.loadContext(b.location, b.demo).catch(() => null) : null;
      const out = await d.ai.chat({ messages: b.messages, ctx: env, profile: b.profile });
      if (user && (await ctx.privacyOf(user.id)).saveChatHistory !== false) {
        const lastUserMessage = b.messages[b.messages.length - 1]?.content ?? '';
        void d.store.addChat({ userId: user.id, message: lastUserMessage, response: out.reply }).catch(() => undefined);
      }
      return {
        reply: out.reply,
        generatedBy: out.generatedBy,
        dataQuality: env ? dataQuality(env) : null,
        disclaimer: CHAT_DISCLAIMER,
      };
    },

    async chatHistory(user: CallUser | undefined) {
      const rows = await d.store.listChat(needUser(user).id, CHAT_HISTORY_LIMIT);
      return { history: rows.map((c) => ({ id: c.id, message: c.message, response: c.response, createdAt: c.createdAt })) };
    },
  };
}

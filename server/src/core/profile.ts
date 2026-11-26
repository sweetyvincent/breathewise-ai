import { parseOrThrow } from '../lib/errors';
import { storedProfileSchema } from '../schemas';
import { toPublicUser } from './presenters';
import { needUser, type CallUser, type CoreDeps } from './types';

/** The signed-in user's profile and preferences. */
export function createProfileHandlers(d: CoreDeps) {
  return {
    async getProfile(user: CallUser | undefined) {
      const u = needUser(user);
      const existing = await d.store.getUser(u.id);
      // First visit: create an empty profile record.
      const record = existing ?? (await d.store.upsertUser({ id: u.id, name: u.demo ? 'Demo user' : '', email: u.email, preferences: {} }));
      return { profile: toPublicUser(record), demo: u.demo };
    },

    async putProfile(input: unknown, user: CallUser | undefined) {
      const u = needUser(user);
      const b = parseOrThrow(storedProfileSchema, input);
      const saved = await d.store.upsertUser({
        id: u.id,
        name: b.name,
        email: u.email,
        location: b.location,
        ageGroup: b.ageGroup,
        occupation: b.occupation,
        preferences: b.preferences,
      });
      return { profile: toPublicUser(saved) };
    },
  };
}

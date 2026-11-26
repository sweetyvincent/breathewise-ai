import { OFFICIAL_ADVISORY_NOTE } from '../rules/common';

const MENTIONS_ADVISORY = /official|local (health|advis)|health (department|authorit)/i;

/** Model-written notes must always point people to official advice; append the standard sentence if it is missing. */
export const ensureAdvisory = (note: string) => (MENTIONS_ADVISORY.test(note) ? note : `${note} ${OFFICIAL_ADVISORY_NOTE}`.trim());

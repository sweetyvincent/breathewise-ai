import { Bike, Flame, Megaphone, type LucideIcon } from 'lucide-react';

export interface Challenge {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
}

export interface Initiative {
  title: string;
  text: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'noburn',
    icon: Flame,
    title: 'No-Burn Week',
    text: 'Pledge not to burn leaves, waste or wood, and encourage three neighbours to do the same.',
  },
  {
    id: 'transit',
    icon: Bike,
    title: 'Green Commute Week',
    text: 'Use metro, bus, carpool or an active commute (when air allows) for 5 days.',
  },
  { id: 'idle', icon: Megaphone, title: 'Engine Off Pledge', text: 'Switch off your engine at crossings, school gates and while waiting.' },
];

export const INITIATIVES: Initiative[] = [
  {
    title: 'Resident-association dust control',
    text: 'Ask builders in your area to cover sites and sprinkle water; keep a shared log of requests.',
  },
  { title: 'Carpool & shuttle boards', text: 'Set up a society notice board or group for shared rides to offices, campuses and schools.' },
  {
    title: 'Tree & green-belt care',
    text: 'Protect existing street trees and green belts. They help with shade and dust, though they are not a substitute for cutting emissions.',
  },
  { title: 'Safe waste collection', text: 'Organise regular leaf and waste pick-ups so nobody feels they must burn it.' },
];

export const AWARENESS_TIPS = [
  'Avoid burning waste, leaves or wood. Report open burning to your local authority or municipal helpline.',
  'Keep vehicles serviced, tyres inflated, and avoid idling.',
  'Choose shared or electric mobility for regular trips where practical.',
  'Check the AQI before organising outdoor events for children or older adults.',
];

/** Where the joined-challenge ids are remembered between visits. */
export const CHALLENGES_STORAGE_KEY = 'bw.challenges';

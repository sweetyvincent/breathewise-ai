import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHALLENGES } from './content';

interface ChallengesSectionProps {
  joined: string[];
  onToggle: (id: string) => void;
}

export function ChallengesSection({ joined, onToggle }: ChallengesSectionProps) {
  return (
    <section aria-labelledby="chal-h" className="mt-10">
      <h2 id="chal-h" className="mb-3 text-xl font-bold">
        Community challenges
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {CHALLENGES.map(({ id, icon: Icon, title, text }) => {
          const isJoined = joined.includes(id);
          return (
            <li key={id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-5 text-emerald-700" aria-hidden="true" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{text}</p>
                  <Button variant={isJoined ? 'default' : 'outline'} size="sm" aria-pressed={isJoined} onClick={() => onToggle(id)}>
                    <Trophy />
                    {isJoined ? 'Joined (tap to leave)' : 'Join challenge'}
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

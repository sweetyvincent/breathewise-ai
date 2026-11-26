import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanNotesProps {
  indoorTips: string[];
  sustainableActions: string[];
}

/** Two short lists that sit under the day plan. */
export function PlanNotes({ indoorTips, sustainableActions }: PlanNotesProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <NoteList title="Indoor tips" items={indoorTips} />
      <NoteList title="Sustainable actions" items={sustainableActions} />
    </div>
  );
}

interface NoteListProps {
  title: string;
  items: string[];
}

function NoteList({ title, items }: NoteListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

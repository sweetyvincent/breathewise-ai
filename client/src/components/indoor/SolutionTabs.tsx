import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { IndoorPlan } from '@/lib/types';
import { SolutionList } from './SolutionList';

/** Free / low-budget / advanced solutions in tabs, with counts in the labels. */
export function SolutionTabs({ solutions }: { solutions: IndoorPlan['solutions'] }) {
  return (
    <Tabs defaultValue="free">
      <TabsList aria-label="Solution categories">
        <TabsTrigger value="free">Free ({solutions.free.length})</TabsTrigger>
        <TabsTrigger value="low">Low-budget ({solutions.low_budget.length})</TabsTrigger>
        <TabsTrigger value="adv">Advanced ({solutions.advanced.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="free">
        <SolutionList items={solutions.free} />
      </TabsContent>
      <TabsContent value="low">
        <SolutionList items={solutions.low_budget} />
      </TabsContent>
      <TabsContent value="adv">
        <SolutionList items={solutions.advanced} />
      </TabsContent>
    </Tabs>
  );
}

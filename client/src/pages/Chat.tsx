/** BreatheBot chat with suggested questions, loading and error states. */
import { Bot, Send, Trash2, User } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChatMarkdown } from '@/components/ChatMarkdown';
import { DataBadge, EngineBadge } from '@/components/DataBadge';
import { LocationBar } from '@/components/LocationBar';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, Spinner } from '@/components/ui/feedback';
import { Input, Label } from '@/components/ui/form';
import { useLocationCtx } from '@/context/LocationContext';
import { ApiError, api } from '@/lib/api';
import { loadSavedProfile } from '@/lib/profile';
import type { DataSource } from '@/lib/types';
import { safeStorage } from '@/lib/utils';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  engine?: 'openai' | 'rules';
  source?: DataSource | null;
}

export const SUGGESTIONS = [
  'Is it safe to go outside today?',
  'Should my children play outdoors?',
  'How can I protect my family from winter smog?',
  'Is opening windows a good idea right now?',
  'How can I improve air quality in my bedroom?',
  'Which is better: an air purifier or an air conditioner?',
  'What should I do if AQI reaches 300?',
  'How can I commute with less pollution exposure?',
  'What are the most affordable ways to protect my family?',
];

const WELCOME: Msg = {
  role: 'assistant',
  content:
    "Hi, I'm **BreatheBot**. Ask me about today's air quality and what to do about it. I use the location you've selected and never make up readings. I share general information, not medical advice.",
};

export default function Chat() {
  const { location, effectiveDemo } = useLocationCtx();
  const [messages, setMessages] = useState<Msg[]>(() => safeStorage.get<Msg[]>('bw.chat', [WELCOME]));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    safeStorage.set('bw.chat', messages.slice(-40));
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loading]);

  const send = async (text: string, base: Msg[] = messages) => {
    const q = text.trim();
    if (!q || loading) return;
    const next: Msg[] = [...base, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setError(null);
    setLastQuestion(q);
    setLoading(true);
    try {
      const history = next
        .filter((m) => m !== WELCOME)
        .slice(-12)
        .map(({ role, content }) => ({ role, content }));
      const res = await api.chat({ messages: history, location, profile: loadSavedProfile() ?? undefined, demo: effectiveDemo });
      setMessages([...next, { role: 'assistant', content: res.reply, engine: res.generatedBy, source: res.dataQuality?.source ?? null }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.friendly : 'BreatheBot could not answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };
  const clear = () => {
    setMessages([WELCOME]);
    setError(null);
    safeStorage.remove('bw.chat');
  };
  const retry = () => {
    if (lastQuestion) void send(lastQuestion, messages.slice(0, -1));
  };

  return (
    <>
      <PageHeader
        title="BreatheBot"
        description={`Ask anything about air quality. Answers use the latest data for ${location.name}.`}
        icon={<Bot className="size-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={clear}>
            <Trash2 />
            Clear conversation
          </Button>
        }
      />
      <LocationBar />

      <Card className="flex h-[60vh] min-h-[420px] flex-col overflow-hidden">
        <div role="log" aria-live="polite" aria-label="Conversation with BreatheBot" className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-primary'}`}
                aria-hidden="true"
              >
                {m.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
              </span>
              <div
                className={`max-w-[85%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                <span className="sr-only">{m.role === 'user' ? 'You said: ' : 'BreatheBot said: '}</span>
                {m.role === 'user' ? <p>{m.content}</p> : <ChatMarkdown text={m.content} />}
                {m.role === 'assistant' && m.engine && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.source && <DataBadge source={m.source} />}
                    <EngineBadge generatedBy={m.engine} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary" aria-hidden="true">
                <Bot className="size-4" />
              </span>
              <div className="rounded-lg bg-muted p-3">
                <Spinner label="BreatheBot is thinking…" />
              </div>
            </div>
          )}
          {error && (
            <Alert tone="danger" title="Couldn’t get an answer">
              <p>{error}</p>
              <Button size="sm" variant="outline" className="mt-2 bg-white" onClick={retry}>
                Try again
              </Button>
            </Alert>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t bg-card p-3">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Suggested questions">
            {SUGGESTIONS.map((s) => (
              <Button key={s} size="sm" variant="secondary" className="shrink-0" disabled={loading} onClick={() => void send(s)}>
                {s}
              </Button>
            ))}
          </div>
          <form onSubmit={submit} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="chat-input" className="sr-only">
                Your question
              </Label>
              <Input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about air quality…"
                maxLength={1500}
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send />
              Send
            </Button>
          </form>
        </div>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        BreatheBot offers general information, not medical advice. In poor air, follow official local health advisories. Conversations are
        stored on this device, and on your account only if you allow it in Settings.
      </p>
    </>
  );
}

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AqiGauge } from '@/components/AqiGauge';
import { buildTrend } from '@/components/charts/TrendChart';
import { ChatMarkdown } from '@/components/ChatMarkdown';
import { DataBadge, EngineBadge } from '@/components/DataBadge';
import { bandFor } from '@/lib/aqi';
import { timeAgo } from '@/lib/utils';
import type { AirQuality } from '@/lib/types';

describe('AqiGauge', () => {
  it('exposes the value and category to assistive tech (not colour alone)', () => {
    render(<AqiGauge aqi={258} label="Poor" color="#EA580C" />);
    expect(screen.getByRole('img', { name: /index 258 out of 500, category Poor/i })).toBeInTheDocument();
  });
});

describe('bandFor', () => {
  it.each([
    [0, 'Good'],
    [50, 'Good'],
    [51, 'Satisfactory'],
    [200, 'Moderate'],
    [201, 'Poor'],
    [301, 'Very Poor'],
    [450, 'Severe'],
  ])('%s → %s', (aqi, label) => {
    expect(bandFor(aqi).label).toBe(label);
  });
});

describe('ChatMarkdown', () => {
  it('renders bold and bullet lists', () => {
    render(<ChatMarkdown text={'**Right now:** AQI 258\n- Keep windows closed\n- Use a purifier'} />);
    expect(screen.getByText('Right now:').tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('never injects HTML: markup from a model reply is shown as inert text', () => {
    const { container } = render(<ChatMarkdown text={'<img src=x onerror=alert(1)> <script>alert(1)</script>'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>');
  });
});

describe('badges', () => {
  it('always labels simulated data as simulated', () => {
    render(<DataBadge source="simulated" />);
    expect(screen.getByText(/Simulated demo data/i)).toBeInTheDocument();
  });
  it('labels live data as live', () => {
    render(<DataBadge source="live" />);
    expect(screen.getByText(/Live data/i)).toBeInTheDocument();
  });
  it('tells the user when the rules engine answered', () => {
    render(<EngineBadge generatedBy="rules" fallbackReason="no_api_key" />);
    expect(screen.getByText(/Smart rules engine/i)).toBeInTheDocument();
  });
});

describe('buildTrend', () => {
  it('splits observed/past from forecast/outlook and joins them at the boundary', () => {
    const now = Date.parse('2026-11-18T10:00:00Z');
    const mk = (h: number, kind: 'observed' | 'forecast') => ({
      time: new Date(now + h * 3600_000).toISOString(),
      aqi: 100 + h,
      pm25: 50,
      kind,
    });
    const air = {
      fetchedAt: new Date(now).toISOString(),
      hourly: [mk(-2, 'observed'), mk(-1, 'observed'), mk(0, 'observed'), mk(1, 'forecast'), mk(2, 'forecast')],
    } as unknown as AirQuality;
    const rows = buildTrend(air);
    expect(rows.filter((r) => r.past !== null)).toHaveLength(3);
    expect(rows.filter((r) => r.ahead !== null)).toHaveLength(3); // 2 forecast + the joining point
    expect(rows[2]?.ahead).toBe(rows[2]?.past);
  });
});

describe('timeAgo', () => {
  it('formats freshness', () => {
    const now = Date.parse('2026-11-18T12:00:00Z');
    expect(timeAgo('2026-11-18T11:58:00Z', now)).toBe('2 min ago');
    expect(timeAgo('2026-11-18T09:00:00Z', now)).toBe('3 h ago');
    expect(timeAgo('2026-11-18T12:00:00Z', now)).toBe('just now');
  });
});

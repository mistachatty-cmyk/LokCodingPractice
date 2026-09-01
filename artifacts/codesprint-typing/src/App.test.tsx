import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { paletteCatalog } from './App';
import { accuracyBucket, trackEvent } from './lib/analytics';
import { curatedLiveStudioChallengeCatalog, getLiveStudioPeriodKey, projectLiveStudioPreview, resolveLiveStudioChallenge, selectLiveStudioChallenge } from './liveStudioData';

const localSnippet = {
  id: 'custom-regression-drill',
  title: 'Tiny regression drill',
  language: 'TypeScript',
  tier: 'Small',
  description: 'A short fixture for keyboard regression checks.',
  code: 'abc',
  custom: true,
};

function resetBrowser() {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
  document.documentElement.removeAttribute('style');
  Reflect.deleteProperty(window, 'umami');
  vi.stubGlobal('crypto', { randomUUID: () => 'regression-run-id' });
}

function renderPracticeWithLocalSnippet() {
  window.localStorage.setItem('codesprint_custom_snippets', JSON.stringify([localSnippet]));
  return render(<App />);
}

function navigate(testId: string) {
  fireEvent.click(screen.getAllByTestId(testId)[0]);
}

describe('typing drill regressions', () => {
  beforeEach(resetBrowser);

  it('starts a drill, shows correct and incorrect feedback, supports backspace, and records completion scoring', async () => {
    renderPracticeWithLocalSnippet();

    const snippetSelect = screen.getByTestId('select-practice-snippet') as HTMLSelectElement;
    fireEvent.change(snippetSelect, { target: { value: localSnippet.id } });
    fireEvent.click(screen.getByTestId('button-start-run'));

    const input = screen.getByTestId('input-code-capture');
    fireEvent.keyDown(input, { key: 'a' });
    expect(document.querySelectorAll('.code-correct')).toHaveLength(1);
    expect(document.querySelectorAll('.code-wrong')).toHaveLength(0);

    fireEvent.keyDown(input, { key: 'x' });
    await waitFor(() => {
      expect(document.querySelectorAll('.code-wrong')).toHaveLength(1);
      expect(screen.getByTestId('metric-accuracy').textContent).toContain('50%');
    });

    fireEvent.keyDown(input, { key: 'Backspace' });
    await waitFor(() => {
      expect(document.querySelectorAll('.code-wrong')).toHaveLength(0);
      expect(document.querySelectorAll('.code-correct')).toHaveLength(1);
    });

    fireEvent.keyDown(input, { key: 'b' });
    await waitFor(() => expect(document.querySelectorAll('.code-correct')).toHaveLength(2));
    fireEvent.keyDown(input, { key: 'c' });
    await waitFor(() => expect(screen.getByText('Run complete')).toBeTruthy());
    expect(screen.getByTestId('metric-earned').textContent).toMatch(/^\+/);

    const runs = JSON.parse(window.localStorage.getItem('codesprint_runs') ?? '[]');
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      snippetTitle: localSnippet.title,
      tier: localSnippet.tier,
      accuracy: 75,
      points: expect.any(Number),
    });
    expect(runs[0].points).toBeGreaterThan(0);
  });

  it('abandons an active run without saving a result', () => {
    renderPracticeWithLocalSnippet();

    fireEvent.change(screen.getByTestId('select-practice-snippet'), { target: { value: localSnippet.id } });
    fireEvent.click(screen.getByTestId('button-start-run'));
    fireEvent.keyDown(screen.getByTestId('input-code-capture'), { key: 'a' });
    fireEvent.click(screen.getByTestId('button-abandon-run'));

    expect(screen.getByTestId('button-start-run')).toBeTruthy();
    expect(screen.queryByTestId('input-code-capture')).toBeNull();
    expect(JSON.parse(window.localStorage.getItem('codesprint_runs') ?? '[]')).toEqual([]);
  });
});

describe('local library and workspace regressions', () => {
  beforeEach(resetBrowser);

  it('adds a local snippet and persists it in the browser library', async () => {
    render(<App />);
    navigate('link-nav-snippet-library');

    fireEvent.click(screen.getByTestId('button-add-snippet'));
    fireEvent.change(screen.getByTestId('input-snippet-title'), { target: { value: 'Response parser' } });
    fireEvent.change(screen.getByTestId('input-snippet-language'), { target: { value: 'TypeScript' } });
    fireEvent.change(screen.getByTestId('textarea-snippet-code'), { target: { value: 'return response.json();' } });
    fireEvent.click(screen.getByTestId('button-save-snippet'));

    expect(screen.getByText('Response parser')).toBeTruthy();
    expect(screen.getByTestId('status-notice').textContent).toContain('Snippet added');
    await waitFor(() => {
      const snippets = JSON.parse(window.localStorage.getItem('codesprint_custom_snippets') ?? '[]');
      expect(snippets).toEqual([
        expect.objectContaining({
          title: 'Response parser',
          language: 'TypeScript',
          tier: 'Small',
          code: 'return response.json();',
          custom: true,
        }),
      ]);
    });
  });

  it('switches palettes and persists the active CSS tokens', async () => {
    render(<App />);
    navigate('link-nav-workspace');

    fireEvent.click(screen.getByTestId('button-theme-ember'));
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('12 78% 72%');
    expect(JSON.parse(window.localStorage.getItem('codesprint_theme') ?? 'null')).toBe('ember');

    fireEvent.click(screen.getByTestId('button-theme-mint'));
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('148 56% 72%');
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('codesprint_theme') ?? 'null')).toBe('mint'));
  });

  it('browses tiered static and animated palettes with locked tiers', () => {
    expect(paletteCatalog).toHaveLength(20);
    expect(new Set(paletteCatalog.map(palette => palette.tier))).toEqual(new Set(['Small', 'Medium', 'Hard', 'Advanced', 'Legendary']));
    expect(paletteCatalog.some(palette => palette.animated)).toBe(true);
    expect(paletteCatalog.some(palette => !palette.animated)).toBe(true);

    render(<App />);
    navigate('link-nav-workspace');

    expect(screen.getByTestId('text-palette-count').textContent).toContain('20 palettes');
    expect((screen.getByTestId('button-palette-tier-hard') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('button-palette-filter-animated'));
    expect(screen.getByTestId('text-palette-count').textContent).toContain('10 / 20');
    fireEvent.click(screen.getByTestId('button-palette-level-2'));
    expect(screen.getByTestId('text-palette-count').textContent).toContain('5 / 20');
    expect(JSON.parse(window.localStorage.getItem('codesprint_palette_filter') ?? 'null')).toBe('Animated');
    expect(JSON.parse(window.localStorage.getItem('codesprint_palette_level') ?? 'null')).toBe(2);
  });

  it('persists explicit reduced motion and preserves legacy palette ids', async () => {
    window.localStorage.setItem('codesprint_theme', JSON.stringify('mint'));
    render(<App />);
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('148 56% 72%');
    navigate('link-nav-workspace');

    fireEvent.click(screen.getByTestId('button-motion-off'));
    expect(screen.getByTestId('text-motion-status').textContent).toContain('Motion is disabled');
    expect(document.querySelector('.motion-reduced')).toBeTruthy();
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('codesprint_motion') ?? 'null')).toBe('off'));
  });

  it('keeps animated palettes still when the browser requests reduced motion', () => {
    const previousMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    try {
      render(<App />);
      navigate('link-nav-workspace');
      fireEvent.click(screen.getByTestId('button-theme-ember'));
      expect(document.querySelector('[data-palette-id]')?.classList.contains('palette-animated')).toBe(false);
      expect(screen.getByTestId('text-motion-status').textContent).toContain('System reduced motion');
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: previousMatchMedia });
    }
  });
});

describe('live code visualizer studio', () => {
  beforeEach(resetBrowser);

  it('ships a broad valid curated catalog across tiers, languages, and visualizers', () => {
    expect(curatedLiveStudioChallengeCatalog).toHaveLength(30);
    expect(new Set(curatedLiveStudioChallengeCatalog.map(challenge => challenge.tier))).toEqual(new Set(['Small', 'Medium', 'Hard', 'Advanced', 'Legendary']));
    expect(new Set(curatedLiveStudioChallengeCatalog.map(challenge => challenge.language))).toEqual(new Set(['TypeScript', 'JavaScript', 'SQL', 'Shell', 'Python', 'React']));
    expect(new Set(curatedLiveStudioChallengeCatalog.map(challenge => challenge.visualizer))).toEqual(new Set(['counter', 'palette', 'tasks', 'terminal', 'rankings']));
    for (const challenge of curatedLiveStudioChallengeCatalog) {
      const partial = projectLiveStudioPreview(challenge, challenge.code.slice(0, Math.max(1, Math.floor(challenge.code.length / 2))));
      const complete = projectLiveStudioPreview(challenge, challenge.code);
      expect(partial.kind).toBe(challenge.visualizer);
      expect(partial.status).not.toBe(complete.status);
    }
  });

  it('selects a stable scheduled challenge and projects partial code safely', () => {
    const date = new Date(2026, 7, 31, 12, 0, 0);
    expect(selectLiveStudioChallenge('Daily', 'Small', date).id).toBe(selectLiveStudioChallenge('Daily', 'Small', date).id);
    expect(getLiveStudioPeriodKey('Weekly', date)).toBe('2026-08-31');
    expect(getLiveStudioPeriodKey('Monthly', date)).toBe('2026-08');

    const challenge = selectLiveStudioChallenge('Daily', 'Small', date);
    const partial = projectLiveStudioPreview(challenge, challenge.code.slice(0, 3));
    const complete = projectLiveStudioPreview(challenge, challenge.code);
    expect(partial.status).not.toBe(complete.status);
    expect(partial.kind).toBe(challenge.visualizer);
    expect(complete.status).toMatch(/ready|complete|reached|inspect|settle|share/i);
  });

  it('selects a contract-valid generated challenge for the requested tier', async () => {
    const generated = {
      id: 'generated-small-counter-20260831',
      title: 'Shape the score pulse',
      language: 'TypeScript',
      tier: 'Small',
      description: 'Turn one bounded score update into a readable signal.',
      objective: 'Return a score that never exceeds the safe ceiling.',
      visualizer: 'counter',
      code: "const nextScore = Math.min(100, score + 10);\nreturn nextScore;",
      estimatedSeconds: 25,
    };
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ challenge: generated, source: 'generated' }),
    }) as unknown as typeof globalThis.fetch;

    const selection = await resolveLiveStudioChallenge('Daily', 'Small', new Date(2026, 7, 31), fetcher);

    expect(selection.source).toBe('generated');
    expect(selection.challenge).toEqual(generated);
    expect(fetcher).toHaveBeenCalledWith('/api/live-studio/challenge', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"tier":"Small"'),
    }));
  });

  it('falls back to the curated challenge when generated metadata is invalid', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        challenge: {
          id: 'generated-small-palette-20260831',
          title: 'Broken palette',
          language: 'TypeScript',
          tier: 'Small',
          code: "const colors = ['#79e3d2'];\nreturn colors;",
          visualizer: 'palette',
          visualizerData: { colors: ['#79e3d2'] },
        },
      }),
    }) as unknown as typeof globalThis.fetch;
    const date = new Date(2026, 7, 31);

    const selection = await resolveLiveStudioChallenge('Daily', 'Small', date, fetcher);

    expect(selection.source).toBe('curated-fallback');
    expect(selection.challenge.id).toBe(selectLiveStudioChallenge('Daily', 'Small', date).id);
    expect(selection.message).toContain('contract validation');
  });

  it('renders the curated target immediately when the generator is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('generator offline')));
    render(<App />);
    navigate('link-nav-live-studio');

    expect(screen.getByTestId('status-live-generation').textContent).toContain('curated catalog');
    expect(screen.getByTestId('text-live-library-count').textContent).toContain('6 / 30');
    await waitFor(() => expect(screen.getByTestId('status-live-generation').textContent).toContain('curated fallback'));
    vi.unstubAllGlobals();
  });

  it('filters the curated library and resets an active session when a target changes', () => {
    render(<App />);
    navigate('link-nav-live-studio');
    fireEvent.change(screen.getByTestId('input-live-library-search'), { target: { value: 'Python' } });

    expect(screen.getByTestId('text-live-library-count').textContent).toContain('1 / 30');
    expect(screen.getByTestId('button-live-library-small-python-directory')).toBeTruthy();
    expect(screen.queryByTestId('button-live-library-small-react-badge')).toBeNull();

    fireEvent.click(screen.getByTestId('button-live-start'));
    fireEvent.change(screen.getByTestId('input-live-code'), { target: { value: 'from' } });
    expect((screen.getByTestId('input-live-code') as HTMLTextAreaElement).value).toBe('from');
    fireEvent.click(screen.getByTestId('button-live-library-small-python-directory'));

    expect((screen.getByTestId('input-live-code') as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByRole('heading', { name: 'List the workspace' })).toBeTruthy();
  });

  it('exposes cadence tabs and resets only after an explicit Daily day selection', () => {
    render(<App />);
    navigate('link-nav-live-studio');

    expect(screen.getByRole('tab', { name: 'Daily' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('daily-day-rail')).toBeTruthy();
    fireEvent.click(screen.getByTestId('button-live-start'));
    fireEvent.change(screen.getByTestId('input-live-code'), { target: { value: 'const' } });
    expect((screen.getByTestId('input-live-code') as HTMLTextAreaElement).value).toBe('const');

    const currentDay = new Date().getDate();
    const nextDay = currentDay === 31 ? 30 : currentDay + 1;
    fireEvent.click(screen.getByTestId(`button-live-day-${nextDay}`));

    expect((screen.getByTestId('input-live-code') as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByTestId('text-live-cadence-context').textContent).toContain(`Day ${nextDay}`);
    expect(screen.getByTestId(`button-live-day-${nextDay}`).getAttribute('aria-selected')).toBe('true');
  });

  it('creates and persists a live build, then exposes share fallbacks', async () => {
    const track = vi.fn();
    Object.defineProperty(window, 'umami', { configurable: true, value: { track } });
    render(<App />);
    navigate('link-nav-live-studio');

    fireEvent.click(screen.getByTestId('button-live-start'));
    const challenge = selectLiveStudioChallenge('Daily', 'Small');
    const input = screen.getByTestId('input-live-code');
    fireEvent.change(input, { target: { value: challenge.code.slice(0, 4) } });
    expect(screen.getByTestId('text-live-preview-output')).toBeTruthy();
    expect(screen.getByTestId('text-live-safety-note')).toBeTruthy();

    fireEvent.change(input, { target: { value: challenge.code } });
    fireEvent.click(screen.getByTestId('button-live-complete'));

    await waitFor(() => {
      expect(screen.getByTestId('button-live-share')).toBeTruthy();
      expect(JSON.parse(window.localStorage.getItem('codesprint_live_builds') ?? '[]')).toHaveLength(1);
    });
    expect(track).toHaveBeenCalledWith('live_studio_session_started', {
      cadence: 'Daily',
      tier: 'Small',
      language: expect.any(String),
      visualizer: expect.any(String),
    });
    expect(track).toHaveBeenCalledWith('live_studio_result_created', {
      cadence: 'Daily',
      tier: 'Small',
      language: expect.any(String),
      visualizer: expect.any(String),
      accuracy_bucket: '95_100',
    });
    expect(screen.getByTestId('link-live-share-x').getAttribute('href')).toContain('twitter.com/intent/tweet');
    expect(screen.getByTestId('link-live-share-linkedin').getAttribute('href')).toContain('linkedin.com/sharing');

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    fireEvent.click(screen.getByTestId('button-live-copy-share'));
    await waitFor(() => expect(screen.getByTestId('status-live-share').textContent).toContain('copied'));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('live_studio_share_action', {
      action: 'copy_link',
      outcome: 'success',
      cadence: 'Daily',
      tier: 'Small',
      language: expect.any(String),
      visualizer: expect.any(String),
      accuracy_bucket: '95_100',
    });
  });
});

describe('analytics safety', () => {
  beforeEach(resetBrowser);

  it('buckets accuracy and never lets an unavailable tracker break the app', () => {
    expect(accuracyBucket(79.9)).toBe('0_79');
    expect(accuracyBucket(80)).toBe('80_94');
    expect(accuracyBucket(95)).toBe('95_100');

    expect(() => trackEvent('test_event', { safe: true })).not.toThrow();

    const track = vi.fn(() => { throw new Error('tracker unavailable'); });
    Object.defineProperty(window, 'umami', { configurable: true, value: { track } });
    expect(() => trackEvent('test_event', { safe: true })).not.toThrow();
    expect(track).toHaveBeenCalledTimes(1);
  });
});
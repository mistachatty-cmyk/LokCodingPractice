import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  Activity,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  Command,
  Gauge,
  Keyboard,
  Layers3,
  LockKeyhole,
  Play,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Terminal,
  TimerReset,
  Trophy,
  Zap,
} from 'lucide-react';

export type LiveStudioCadence = 'Daily' | 'Weekly' | 'Monthly';
export type LiveStudioTier = 'Small' | 'Medium' | 'Hard' | 'Advanced' | 'Legendary';
export type LiveStudioVisualizerKind = 'counter' | 'palette' | 'tasks' | 'terminal' | 'rankings';

export type LiveStudioChallenge = {
  id: string;
  title: string;
  language: string;
  tier: LiveStudioTier;
  code: string;
  description?: string;
  objective?: string;
  visualizer?: LiveStudioVisualizerKind;
  visualizerData?: { labels?: string[]; colors?: string[] };
  estimatedSeconds?: number;
};

export type LiveStudioSafePreview = {
  kind?: LiveStudioVisualizerKind;
  title?: string;
  status?: string;
  output?: string[];
  metrics?: Array<{ label: string; value: string }>;
  items?: Array<{ label: string; value: string }>;
  progress?: number;
  color?: string;
  accent?: 'mint' | 'amber' | 'rose';
};

export type LiveStudioGenerationState = 'loading' | 'generated' | 'curated-fallback' | 'curated';

export type LiveStudioResult = {
  id?: string;
  challengeId?: string;
  title?: string;
  tier?: LiveStudioTier;
  cadence?: LiveStudioCadence;
  wpm?: number;
  accuracy?: number;
  elapsedSeconds?: number;
  points?: number;
  completedAt?: string;
};

export type LiveStudioProps = {
  challenges?: LiveStudioChallenge[];
  curatedChallenges?: LiveStudioChallenge[];
  cadence?: LiveStudioCadence;
  tier?: LiveStudioTier;
  challengeId?: string;
  typedValue?: string;
  safePreview?: LiveStudioSafePreview | null;
  result?: LiveStudioResult | null;
  isRunning?: boolean;
  elapsedSeconds?: number;
  wpm?: number;
  accuracy?: number;
  errorCount?: number;
  unlockedTiers?: LiveStudioTier[];
  onCadenceChange?: (cadence: LiveStudioCadence) => void;
  onTierChange?: (tier: LiveStudioTier) => void;
  onChallengeChange?: (challengeId: string) => void;
  onLibrarySelect?: (challengeId: string, tier: LiveStudioTier) => void;
  onTypedChange?: (value: string) => void;
  onReset?: () => void;
  onComplete?: (result: LiveStudioResult) => void;
  onShare?: (result: LiveStudioResult | null) => void;
  onCopyShare?: () => void;
  onExternalShare?: (action: 'x' | 'linkedin') => void;
  onStart?: () => void;
  shareUrl?: string;
  shareText?: string;
  shareStatus?: string;
  generationState?: LiveStudioGenerationState;
  generationMessage?: string;
  className?: string;
};

const fallbackChallenges: LiveStudioChallenge[] = [
  {
    id: 'safe-cache',
    title: 'Cache the edge',
    language: 'TypeScript',
    tier: 'Small',
    description: 'Shape a tiny local-first cache without losing the happy path.',
    code: `const next = cache.get(key) ?? await load(key);
cache.set(key, next);
return next;`,
    estimatedSeconds: 28,
  },
  {
    id: 'query-pipeline',
    title: 'Query pipeline',
    language: 'TypeScript',
    tier: 'Medium',
    description: 'Filter, map, and keep the result readable under pressure.',
    code: `const ready = records
  .filter(record => record.status === 'ready')
  .map(({ id, title }) => ({ id, title }));`,
    estimatedSeconds: 38,
  },
  {
    id: 'retry-window',
    title: 'Retry with backoff',
    language: 'TypeScript',
    tier: 'Hard',
    description: 'A durable request loop with one clear exit condition.',
    code: `for (let attempt = 0; attempt < 3; attempt++) {
  try { return await request(); }
  catch { await wait(2 ** attempt * 250); }
}`,
    estimatedSeconds: 48,
  },
  {
    id: 'debounced-state',
    title: 'Debounced state',
    language: 'React',
    tier: 'Advanced',
    description: 'Keep the timer explicit and the render path quiet.',
    code: `useEffect(() => {
  const timer = setTimeout(() => save(value), 240);
  return () => clearTimeout(timer);
}, [value]);`,
    estimatedSeconds: 54,
  },
  {
    id: 'rollout-watch',
    title: 'Rollout watch',
    language: 'Shell',
    tier: 'Legendary',
    description: 'A measured command sequence for a high-stakes deploy.',
    code: `kubectl rollout status deployment/api --timeout=120s
kubectl get pods -l app=api -o wide`,
    estimatedSeconds: 45,
  },
];

const tierMeta: Record<LiveStudioTier, { code: string; subtitle: string; points: number; color: string; unlock: number }> = {
  Small: { code: '01', subtitle: 'Warm-up syntax', points: 50, color: '#79e3d2', unlock: 0 },
  Medium: { code: '02', subtitle: 'Everyday fluency', points: 90, color: '#9ebcf4', unlock: 0 },
  Hard: { code: '03', subtitle: 'Production patterns', points: 150, color: '#f2bd70', unlock: 100 },
  Advanced: { code: '04', subtitle: 'Deep work mode', points: 230, color: '#e798a9', unlock: 500 },
  Legendary: { code: '05', subtitle: 'The long compile', points: 400, color: '#c6a4ed', unlock: 1200 },
};

const cadences: Array<{ value: LiveStudioCadence; detail: string }> = [
  { value: 'Daily', detail: 'a focused rep' },
  { value: 'Weekly', detail: 'a deeper session' },
  { value: 'Monthly', detail: 'a long compile' },
];

const keyboardRows = [
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
}

function displayKey(value: string) {
  if (value === ' ') return 'SPACE';
  if (value === '\n') return 'RETURN';
  if (value === '\t') return 'TAB';
  return value.toUpperCase();
}

function StatTile({ icon: Icon, label, value, detail, tone = 'mint' }: { icon: typeof Gauge; label: string; value: string; detail: string; tone?: 'mint' | 'amber' | 'rose' }) {
  const toneClass = tone === 'amber' ? 'text-[hsl(var(--accent))]' : tone === 'rose' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--primary))]';
  return (
    <div className="border-l border-[hsl(var(--border))] pl-3.5" data-testid={`metric-live-${label.toLowerCase()}`}>
      <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">
        <Icon size={12} className={toneClass} />
        {label}
      </div>
      <div className="mt-1 font-mono text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">{value}</div>
      <div className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{detail}</div>
    </div>
  );
}

function SafeProjection({ preview }: { preview?: LiveStudioSafePreview | null }) {
  const kind = preview?.kind ?? 'terminal';
  const progress = Math.max(0, Math.min(100, preview?.progress ?? 0));
  const items = preview?.items ?? [];
  const output = preview?.output?.length ? preview.output : ['projection.connect()', 'waiting for a clean signal…'];
  const metric = preview?.metrics?.[0];

  if (kind === 'counter') {
    return (
      <div className="space-y-4" aria-live="polite" data-testid="text-live-preview-output">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-3xl font-bold text-[hsl(var(--primary))]">{metric?.value ?? `${progress}%`}</div>
            <div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">safe state value</div>
          </div>
          <div className="grid size-14 place-items-center rounded-full border-4 border-[hsl(var(--primary)/.18)]" style={{ background: `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--muted)) 0)` }}>
            <div className="grid size-9 place-items-center rounded-full bg-[hsl(var(--background))] font-mono text-[9px]">{Math.round(progress)}%</div>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        <div className="grid grid-cols-2 gap-2">{(preview?.metrics ?? []).slice(1, 3).map(item => <div key={item.label} className="rounded-lg border border-[hsl(var(--border))] px-2.5 py-2"><div className="font-mono text-[8px] uppercase text-[hsl(var(--muted-foreground))]">{item.label}</div><div className="mt-1 text-[11px] font-semibold">{item.value}</div></div>)}</div>
      </div>
    );
  }

  if (kind === 'palette') {
    return (
      <div className="space-y-4" aria-live="polite" data-testid="text-live-preview-output">
        <div className="flex items-center gap-2">{items.map(item => <div key={item.label} className="flex-1"><div className="h-12 rounded-lg border border-white/10" style={{ backgroundColor: item.value }} /><div className="mt-1 truncate font-mono text-[8px] text-[hsl(var(--muted-foreground))]">{item.label}</div></div>)}</div>
        <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2 font-mono text-[9px]"><span className="text-[hsl(var(--muted-foreground))]">palette tokens parsed</span><span className="text-[hsl(var(--primary))]">{items.length} colors</span></div>
      </div>
    );
  }

  if (kind === 'tasks') {
    return (
      <div className="space-y-2 font-mono text-[10px]" aria-live="polite" data-testid="text-live-preview-output">
        {(items.length ? items : [{ label: 'Parse target', value: 'queued' }, { label: 'Project state', value: 'queued' }, { label: 'Create result', value: 'queued' }]).map(item => {
          const done = item.value === 'done';
          return <div key={item.label} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2"><span className={done ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}>{done ? '✓' : '·'} {item.label}</span><span className={done ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}>{item.value}</span></div>;
        })}
      </div>
    );
  }

  if (kind === 'rankings') {
    return (
      <div className="space-y-2 font-mono text-[10px]" aria-live="polite" data-testid="text-live-preview-output">
        {(items.length ? items : [{ label: 'waiting for rows', value: '—' }]).map((item, index) => <div key={item.label} className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] px-3 py-2"><span className="text-[hsl(var(--muted-foreground)/.6)]">0{index + 1}</span><span className="flex-1 truncate">{item.label}</span><span className="text-[hsl(var(--primary))]">{item.value}</span></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-2 font-mono text-[10px] leading-5" aria-live="polite" data-testid="text-live-preview-output">
      {output.map((line, index) => <div key={`${line}-${index}`} className={cn('flex gap-3', index === output.length - 1 ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]')}><span className="select-none text-[hsl(var(--muted-foreground)/.55)]">{(index + 1).toString().padStart(2, '0')}</span><span className="truncate">{line}</span></div>)}
    </div>
  );
}

function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">
      <span className="text-[hsl(var(--primary))]">{number}</span>
      <span className="h-px w-5 bg-[hsl(var(--border))]" />
      {children}
    </div>
  );
}

export default function LiveStudio({
  challenges = fallbackChallenges,
  cadence = 'Daily',
  tier = 'Small',
  challengeId,
  typedValue = '',
  safePreview,
  result = null,
  isRunning = true,
  elapsedSeconds = 0,
  wpm = 0,
  accuracy = 100,
  errorCount = 0,
  unlockedTiers = ['Small', 'Medium'],
  onCadenceChange,
  onTierChange,
  onChallengeChange,
  onTypedChange,
  onReset,
  onComplete,
  onShare,
  onCopyShare,
  onExternalShare,
  onLibrarySelect,
  onStart,
  shareUrl,
  shareText,
  shareStatus,
  generationState = 'generated',
  generationMessage,
  className,
  curatedChallenges = [],
}: LiveStudioProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const availableChallenges = challenges.length ? challenges : fallbackChallenges;
  const librarySource = curatedChallenges.length ? curatedChallenges : availableChallenges;
  const tierChallenges = useMemo(() => availableChallenges.filter(challenge => challenge.tier === tier), [availableChallenges, tier]);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryTier, setLibraryTier] = useState<LiveStudioTier | 'All'>(tier);
  const [libraryLanguage, setLibraryLanguage] = useState('All');
  const [libraryVisualizer, setLibraryVisualizer] = useState('All');
  useEffect(() => setLibraryTier(tier), [tier]);
  const filteredLibrary = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    return librarySource.filter(challenge => {
      const matchesQuery = !query || [challenge.title, challenge.language, challenge.description, challenge.objective, challenge.code].some(value => value?.toLowerCase().includes(query));
      const matchesTier = libraryTier === 'All' || challenge.tier === libraryTier;
      const matchesLanguage = libraryLanguage === 'All' || challenge.language === libraryLanguage;
      const matchesVisualizer = libraryVisualizer === 'All' || challenge.visualizer === libraryVisualizer;
      return matchesQuery && matchesTier && matchesLanguage && matchesVisualizer;
    });
  }, [libraryLanguage, libraryQuery, librarySource, libraryTier, libraryVisualizer]);
  const libraryLanguages = useMemo(() => ['All', ...Array.from(new Set(librarySource.map(challenge => challenge.language)))], [librarySource]);
  const libraryVisualizers = ['All', 'counter', 'palette', 'tasks', 'rankings', 'terminal'];
  const activeChallenge = tierChallenges.find(challenge => challenge.id === challengeId) ?? tierChallenges[0] ?? availableChallenges[0];
  const target = activeChallenge?.code ?? '';
  const typed = typedValue.slice(0, target.length);
  const complete = Boolean(target) && typed === target;
  const progress = target ? Math.min(100, (typed.length / target.length) * 100) : 0;
  const expected = target[typed.length] ?? '';
  const currentLine = target.slice(0, typed.length).split('\n').length;
  const status = result ? 'Result created' : complete ? 'Ready to finish' : isRunning ? 'Listening for input' : 'Studio ready';
  const derivedResult: LiveStudioResult = {
    ...result,
    challengeId: result?.challengeId ?? activeChallenge?.id,
    title: result?.title ?? activeChallenge?.title,
    tier: result?.tier ?? tier,
    cadence: result?.cadence ?? cadence,
    wpm: result?.wpm ?? wpm,
    accuracy: result?.accuracy ?? accuracy,
    elapsedSeconds: result?.elapsedSeconds ?? elapsedSeconds,
  };
  const handleTypedChange = (event: ChangeEvent<HTMLTextAreaElement>) => onTypedChange?.(event.target.value.slice(0, target.length));
  const selectChallenge = (event: ChangeEvent<HTMLSelectElement>) => onChallengeChange?.(event.target.value);
  useEffect(() => {
    if (isRunning && !result) textareaRef.current?.focus();
  }, [isRunning, result]);

  return (
    <div className={cn('relative overflow-hidden pb-8', className)} data-testid="live-studio">
      <div className="pointer-events-none absolute -right-36 -top-32 size-[460px] rounded-full bg-[hsl(var(--primary)/.05)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-32 -left-52 size-[360px] rounded-full bg-[hsl(var(--accent)/.035)] blur-3xl" />

      <header className="rise relative mb-8 flex flex-col justify-between gap-6 border-b border-[hsl(var(--border))] pb-7 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.23em] text-[hsl(var(--primary))]">
            <span className="blink size-1.5 rounded-full bg-[hsl(var(--primary))]" />
            Live Studio <span className="text-[hsl(var(--muted-foreground))]">/ local first</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-bold tracking-[-.055em] text-[hsl(var(--foreground))] md:text-5xl">
            Make the syntax <span className="text-[hsl(var(--primary))]">instinctive.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Pick a cadence, type the exact target, and watch a safe projection take shape as your hands find the rhythm.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.58)] px-3.5 py-3" data-testid="status-live-studio">
          <span className={cn('grid size-8 place-items-center rounded-lg', result ? 'bg-[hsl(var(--accent)/.14)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]')}>
            {result ? <Trophy size={16} /> : <Activity size={16} />}
          </span>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">Studio status</div>
            <div className="mt-0.5 text-xs font-semibold">{status}</div>
          </div>
          <span className={cn('ml-2 size-1.5 rounded-full', result ? 'bg-[hsl(var(--accent))]' : complete ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--primary))] blink')} />
        </div>
      </header>

      <section className="rise rise-delay-1 relative mb-7 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <SectionLabel number="01">Set your cadence</SectionLabel>
          <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Choose cadence">
            {cadences.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => onCadenceChange?.(option.value)}
                className={cn('group rounded-xl border px-3 py-3.5 text-left transition-all duration-200', cadence === option.value ? 'border-[hsl(var(--primary)/.6)] bg-[hsl(var(--primary)/.1)] shadow-[inset_0_-2px_0_hsl(var(--primary))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.48)] hover:-translate-y-0.5 hover:border-[hsl(var(--foreground)/.3)]')}
                data-testid={`button-cadence-${option.value.toLowerCase()}`}
                aria-pressed={cadence === option.value}
              >
                <span className={cn('block font-mono text-[11px] font-bold', cadence === option.value ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]')}>{option.value}</span>
                <span className="mt-1 block text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">{option.detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel number="02">Choose the pressure</SectionLabel>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {(Object.keys(tierMeta) as LiveStudioTier[]).map(candidate => {
              const meta = tierMeta[candidate];
              const unlocked = unlockedTiers.includes(candidate);
              const selected = tier === candidate;
              return (
                <button
                  key={candidate}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onTierChange?.(candidate)}
                  className={cn('group relative min-w-0 overflow-hidden rounded-xl border px-2 py-3 text-left transition-all duration-200', selected ? 'border-[hsl(var(--primary)/.65)] bg-[hsl(var(--primary)/.1)]' : unlocked ? 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.48)] hover:-translate-y-0.5 hover:border-[hsl(var(--foreground)/.3)]' : 'cursor-not-allowed border-[hsl(var(--border)/.6)] bg-[hsl(var(--card)/.25)] opacity-50')}
                  data-testid={`button-live-tier-${candidate.toLowerCase()}`}
                  aria-pressed={selected}
                  aria-label={unlocked ? `${candidate} tier` : `${candidate} tier locked`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[9px]" style={{ color: unlocked ? meta.color : undefined }}>{meta.code}</span>
                    {unlocked ? <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} /> : <LockKeyhole size={11} />}
                  </div>
                  <div className="truncate text-[11px] font-semibold">{candidate}</div>
                  <div className="mt-1 font-mono text-[9px] text-[hsl(var(--muted-foreground))]">{unlocked ? `${meta.points} pts` : `unlock ${meta.unlock}`}</div>
                  {selected && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[hsl(var(--primary))]" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rise rise-delay-2 relative mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionLabel number="03">Select a target</SectionLabel>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--primary)/.3)] bg-[hsl(var(--primary)/.08)] text-[hsl(var(--primary))]">
              <Code2 size={19} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{activeChallenge?.title ?? 'No target loaded'}</h2>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{activeChallenge?.description ?? 'Choose a target to begin your studio session.'}</p>
              {activeChallenge?.objective && <p className="mt-2 text-xs font-medium text-[hsl(var(--primary))]">Build objective: {activeChallenge.objective}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]" role="status" data-testid="status-live-generation">
                <span className={cn('rounded-md border px-2 py-1 font-mono uppercase tracking-[.08em]', generationState === 'loading' ? 'border-[hsl(var(--accent)/.35)] text-[hsl(var(--accent))]' : generationState === 'curated-fallback' ? 'border-[hsl(var(--destructive)/.35)] text-[hsl(var(--destructive))]' : 'border-[hsl(var(--primary)/.35)] text-[hsl(var(--primary))]')}>
                  {generationState === 'loading' ? 'checking rotation' : generationState === 'curated-fallback' ? 'curated fallback' : generationState === 'curated' ? 'curated catalog' : 'generated draft'}
                </span>
                {generationMessage && <span className="text-[hsl(var(--muted-foreground))]">{generationMessage}</span>}
              </div>
            </div>
          </div>
        </div>
        <label className="relative block w-full md:max-w-[250px]">
          <span className="sr-only">Choose code target</span>
          <select
            value={activeChallenge?.id ?? ''}
            onChange={selectChallenge}
            className="w-full appearance-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)] px-3.5 py-3 pr-10 text-xs text-[hsl(var(--foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))]"
            data-testid="select-live-challenge"
          >
            {tierChallenges.length ? tierChallenges.map(challenge => <option key={challenge.id} value={challenge.id}>{challenge.title} · {challenge.language}</option>) : <option value="">No targets in this tier</option>}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-3.5 text-[hsl(var(--muted-foreground))]" />
        </label>
      </section>

      <section className="rise rise-delay-2 relative mb-7 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.32)] p-4 md:p-5" data-testid="live-curated-library">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">
              <Search size={13} />
              Curated code library
            </div>
            <p className="mt-2 max-w-xl text-xs leading-5 text-[hsl(var(--muted-foreground))]">
              Browse reviewed targets that work locally, with or without AI or a generator connection.
            </p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--primary)/.22)] bg-[hsl(var(--primary)/.06)] px-3 py-2 font-mono text-[10px] text-[hsl(var(--primary))]" data-testid="text-live-library-count">
            {filteredLibrary.length} / {librarySource.length} targets
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
          <label className="relative">
            <span className="sr-only">Search curated targets</span>
            <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
            <input
              value={libraryQuery}
              onChange={event => setLibraryQuery(event.target.value)}
              placeholder="Search title, objective, or code"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.55)] py-2.5 pl-9 pr-3 text-xs text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary)/.7)]"
              data-testid="input-live-library-search"
            />
          </label>
          <label>
            <span className="sr-only">Filter curated targets by tier</span>
            <select value={libraryTier} onChange={event => setLibraryTier(event.target.value as LiveStudioTier | 'All')} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.55)] px-3 py-2.5 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary)/.7)]" data-testid="select-live-library-tier">
              <option value="All">All tiers</option>
              {(Object.keys(tierMeta) as LiveStudioTier[]).map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter curated targets by language</span>
            <select value={libraryLanguage} onChange={event => setLibraryLanguage(event.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.55)] px-3 py-2.5 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary)/.7)]" data-testid="select-live-library-language">
              {libraryLanguages.map(option => <option key={option} value={option}>{option === 'All' ? 'All languages' : option}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter curated targets by visualizer</span>
            <select value={libraryVisualizer} onChange={event => setLibraryVisualizer(event.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.55)] px-3 py-2.5 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary)/.7)]" data-testid="select-live-library-visualizer">
              {libraryVisualizers.map(option => <option key={option} value={option}>{option === 'All' ? 'All visualizers' : `${option[0].toUpperCase()}${option.slice(1)}`}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filteredLibrary.map(challenge => {
            const unlocked = unlockedTiers.includes(challenge.tier);
            const selected = activeChallenge?.id === challenge.id;
            return (
              <button
                key={challenge.id}
                type="button"
                disabled={!unlocked}
                onClick={() => onLibrarySelect ? onLibrarySelect(challenge.id, challenge.tier) : onChallengeChange?.(challenge.id)}
                className={cn('rounded-xl border p-3.5 text-left transition-all', selected ? 'border-[hsl(var(--primary)/.7)] bg-[hsl(var(--primary)/.09)]' : unlocked ? 'border-[hsl(var(--border))] bg-[hsl(var(--background)/.35)] hover:-translate-y-0.5 hover:border-[hsl(var(--foreground)/.28)]' : 'cursor-not-allowed border-[hsl(var(--border)/.5)] bg-[hsl(var(--background)/.18)] opacity-50')}
                data-testid={`button-live-library-${challenge.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{challenge.title}</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))]">{challenge.language} <span className="mx-1 text-[hsl(var(--border))]">/</span> {challenge.visualizer ?? 'terminal'}</div>
                  </div>
                  <span className={cn('shrink-0 rounded-md px-2 py-1 font-mono text-[9px]', selected ? 'bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]')}>{challenge.tier}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[11px] leading-4 text-[hsl(var(--muted-foreground))]">{challenge.objective ?? challenge.description}</p>
                <div className="mt-3 flex items-center justify-between font-mono text-[9px] text-[hsl(var(--muted-foreground))]">
                  <span>{challenge.estimatedSeconds ?? 30}s target</span>
                  <span>{unlocked ? (selected ? 'selected' : 'choose target') : 'locked'}</span>
                </div>
              </button>
            );
          })}
        </div>
        {!filteredLibrary.length && <div className="mt-4 rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">No curated targets match these filters.</div>}
      </section>

      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(330px,.82fr)]">
        <section className="glass-line panel-glow rise rise-delay-2 overflow-hidden rounded-2xl border" data-testid="live-typing-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--border))] px-4 py-3.5 md:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <span className="size-2 rounded-full bg-[hsl(var(--destructive)/.75)]" />
                <span className="size-2 rounded-full bg-[hsl(var(--accent)/.75)]" />
                <span className="size-2 rounded-full bg-[hsl(var(--primary)/.75)]" />
              </div>
              <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{activeChallenge?.language.toLowerCase() ?? 'target'}.live</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
              <span className="font-mono text-[hsl(var(--primary))]">{Math.round(progress)}%</span>
              <span>{typed.length} / {target.length} chars</span>
            </div>
          </div>
          <div className="h-1 bg-[hsl(var(--muted))]"><div className="progress-fill h-full bg-[hsl(var(--primary))]" style={{ width: `${progress}%` }} /></div>
          <div className="relative p-4 md:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">
                <Keyboard size={13} className="text-[hsl(var(--primary))]" />
                Type exactly as shown
              </div>
              <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">line {currentLine}</span>
            </div>
            <div className="min-h-[265px] rounded-xl border border-[hsl(var(--border)/.8)] bg-[hsl(var(--background)/.5)] p-4 md:p-5">
              <div className="pointer-events-none whitespace-pre-wrap break-words font-mono text-[12px] leading-[2] md:text-[13px]" aria-label="Code target">
                {target.split('').map((char, index) => {
                  const typedChar = typed[index];
                  const wrong = Boolean(typedChar && typedChar !== char);
                  const current = index === typed.length;
                  return (
                    <span key={`${index}-${char}`} className={cn(typedChar && !wrong ? 'code-correct' : wrong ? 'code-wrong rounded-sm' : 'code-pending', current && 'border-l-2 border-[hsl(var(--primary))] pl-0.5')}>
                      {char === '\n' ? '↵\n' : char}
                    </span>
                  );
                })}
              </div>
              <textarea
                ref={textareaRef}
                value={typedValue}
                onChange={handleTypedChange}
                disabled={!isRunning || Boolean(result)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className="absolute left-4 right-4 top-[72px] h-[240px] resize-none cursor-text rounded-lg border border-transparent bg-transparent p-4 font-mono text-[12px] leading-[2] text-transparent caret-[hsl(var(--primary))] outline-none selection:bg-[hsl(var(--primary)/.18)] md:left-7 md:right-7 md:top-[72px] md:p-5 md:text-[13px]"
                aria-label="Type the code target"
                data-testid="input-live-code"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1.5"><CircleHelp size={12} /> Your input stays in this browser.</span>
              <span className={cn('flex items-center gap-1.5 font-mono', errorCount ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--muted-foreground))]')}><Zap size={11} /> {errorCount} {errorCount === 1 ? 'correction' : 'corrections'}</span>
            </div>
          </div>
          <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/.24)] px-4 py-4 md:px-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-[.17em] text-[hsl(var(--muted-foreground))]">Next key</div>
              <div className={cn('font-mono text-[10px] font-bold uppercase', expected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--accent))]')}>{complete ? 'Target complete' : expected ? displayKey(expected) : 'Waiting'}</div>
            </div>
            <div className="space-y-1.5 opacity-90" aria-label="Keyboard feedback">
              {keyboardRows.map((row, rowIndex) => (
                <div className="flex justify-center gap-1.5" key={rowIndex}>
                  {row.map(key => {
                    const expectedLabel = displayKey(expected);
                    const isExpected = expected && (key === expected.toUpperCase() || (key === 'Tab' && expectedLabel === 'TAB'));
                    return <span key={key} className={cn('grid h-7 min-w-7 flex-1 place-items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)] px-1 font-mono text-[9px] text-[hsl(var(--muted-foreground))] transition-all duration-200', key === 'Shift' || key === 'Caps' ? 'max-w-14' : '', isExpected && 'border-[hsl(var(--primary)/.7)] bg-[hsl(var(--primary)/.15)] text-[hsl(var(--primary))] shadow-[0_0_0_2px_hsl(var(--primary)/.06)]')}>{key}</span>;
                  })}
                </div>
              ))}
              <div className="mx-auto mt-1.5 grid h-7 max-w-[75%] place-items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)] font-mono text-[9px] text-[hsl(var(--muted-foreground))]">SPACE</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] px-4 py-4 md:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onReset} className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:border-[hsl(var(--foreground)/.35)] hover:text-[hsl(var(--foreground))]" data-testid="button-live-reset">
                <RotateCcw size={14} /> Reset target
              </button>
              {!isRunning && !result && onStart && (
                <button type="button" onClick={onStart} className="flex items-center gap-2 rounded-lg border border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.08)] px-3 py-2 text-xs font-semibold text-[hsl(var(--primary))] transition-transform hover:-translate-y-0.5" data-testid="button-live-start">
                  <Play size={13} fill="currentColor" /> Start session
                </button>
              )}
            </div>
            {result ? (
              <div className="flex w-full flex-wrap items-center justify-end gap-2">
                {shareStatus && <span className="mr-auto text-[10px] text-[hsl(var(--primary))]" role="status" data-testid="status-live-share">{shareStatus}</span>}
                <button type="button" onClick={() => onCopyShare?.()} className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="button-live-copy-share">
                  <Code2 size={13} /> Copy link
                </button>
                {shareUrl && <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText ?? '')}&url=${encodeURIComponent(shareUrl)}`} onClick={() => onExternalShare?.('x')} target="_blank" rel="noreferrer" className="rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-live-share-x">Post to X</a>}
                {shareUrl && <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} onClick={() => onExternalShare?.('linkedin')} target="_blank" rel="noreferrer" className="rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-live-share-linkedin">LinkedIn</a>}
                <button type="button" onClick={() => onShare?.(derivedResult)} className="flex items-center gap-2 rounded-lg bg-[hsl(var(--accent))] px-4 py-2.5 text-xs font-bold text-[hsl(var(--accent-foreground))] transition-transform hover:-translate-y-0.5" data-testid="button-live-share">
                  <Share2 size={14} /> Share result
                </button>
              </div>
            ) : (
              <button type="button" disabled={!complete} onClick={() => onComplete?.(derivedResult)} className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35" data-testid="button-live-complete">
                <Check size={14} /> Create result
              </button>
            )}
          </div>
        </section>

        <aside className="rise rise-delay-3 flex flex-col gap-5">
          <div className="glass-line panel-glow overflow-hidden rounded-2xl border" data-testid="live-preview-panel">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3.5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]"><Terminal size={13} className="text-[hsl(var(--accent))]" /> Safe projection</div>
              <span className="flex items-center gap-1.5 font-mono text-[9px] text-[hsl(var(--primary))]"><span className="blink size-1.5 rounded-full bg-[hsl(var(--primary))]" /> LIVE</span>
            </div>
            <div className="p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Projection state</div>
                  <h3 className="mt-1 text-lg font-bold tracking-tight">{safePreview?.title ?? 'A quiet workspace'}</h3>
                </div>
                <div className={cn('grid size-9 place-items-center rounded-lg', complete ? 'bg-[hsl(var(--accent)/.13)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]')}><Layers3 size={17} /></div>
              </div>
              <div className="relative min-h-[170px] overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.72)] p-4">
                <div className="mb-3 flex items-center gap-1.5 border-b border-[hsl(var(--border)/.7)] pb-3">
                  <span className="size-1.5 rounded-full bg-[hsl(var(--destructive)/.65)]" /><span className="size-1.5 rounded-full bg-[hsl(var(--accent)/.65)]" /><span className="size-1.5 rounded-full bg-[hsl(var(--primary)/.65)]" />
                  <span className="ml-2 font-mono text-[8px] text-[hsl(var(--muted-foreground))]">preview.safe</span>
                </div>
                <SafeProjection preview={safePreview} />
                <div className="pointer-events-none absolute -bottom-8 -right-8 size-28 rounded-full border border-[hsl(var(--primary)/.12)]" />
                <div className="pointer-events-none absolute -bottom-4 -right-4 size-16 rounded-full border border-[hsl(var(--primary)/.1)]" />
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px]">
                <span className="text-[hsl(var(--muted-foreground))]">{safePreview?.status ?? 'No code is executed here.'}</span>
                <span className="flex items-center gap-1.5 font-mono text-[hsl(var(--primary))]"><Check size={11} /> sandboxed</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.42)] p-5" data-testid="live-session-stats">
            <div className="mb-5 flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[.17em] text-[hsl(var(--muted-foreground))]">Session signal</div>
              <Gauge size={15} className="text-[hsl(var(--accent))]" />
            </div>
            <div className="grid grid-cols-2 gap-y-5">
              <StatTile icon={Gauge} label="WPM" value={String(result?.wpm ?? wpm)} detail="words / minute" />
              <StatTile icon={Activity} label="Accuracy" value={`${result?.accuracy ?? accuracy}%`} detail={errorCount ? `${errorCount} corrections` : 'clean signal'} tone={errorCount ? 'rose' : 'mint'} />
              <StatTile icon={Clock3} label="Elapsed" value={formatTime(result?.elapsedSeconds ?? elapsedSeconds)} detail="keep your rhythm" tone="amber" />
              <StatTile icon={Zap} label="Potential" value={`+${tierMeta[tier].points}`} detail="base points" tone="amber" />
            </div>
          </div>

          {!result && (
            <div className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--accent)/.2)] bg-[hsl(var(--accent)/.055)] p-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]" data-testid="text-live-safety-note">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" />
              <span><strong className="text-[hsl(var(--foreground))]">A projection, not an executor.</strong> Live Studio renders the safe state you pass in. Your typed target never runs.</span>
            </div>
          )}
        </aside>
      </div>

      <footer className="relative mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-5 text-[10px] text-[hsl(var(--muted-foreground))]">
        <span className="flex items-center gap-2"><Command size={12} className="text-[hsl(var(--primary))]" /> {activeChallenge?.estimatedSeconds ? `A ${activeChallenge.estimatedSeconds}s target` : 'A focused target'} <span className="text-[hsl(var(--border))]">/</span> progress stays local</span>
        <span className="flex items-center gap-2 font-mono"><TimerReset size={12} /> {cadence.toLowerCase()} cadence</span>
      </footer>
    </div>
  );
}
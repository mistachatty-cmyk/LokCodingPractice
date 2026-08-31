import type {
  LiveStudioCadence,
  LiveStudioChallenge,
  LiveStudioSafePreview,
  LiveStudioTier,
} from './LiveStudio';
import { z } from 'zod';

export const liveStudioChallengeCatalog: LiveStudioChallenge[] = [
  {
    id: 'counter-score',
    title: 'Build the score pulse',
    language: 'TypeScript',
    tier: 'Small',
    description: 'Turn a tiny score update into a visible signal.',
    objective: 'Create a bounded progress counter.',
    visualizer: 'counter',
    code: 'const value = Math.min(100, score + 10);\nreturn value;',
    estimatedSeconds: 25,
  },
  {
    id: 'palette-signal',
    title: 'Tune the signal',
    language: 'JavaScript',
    tier: 'Small',
    description: 'Compose two colors for a focused interface.',
    objective: 'Return a two-color palette.',
    visualizer: 'palette',
    visualizerData: { colors: ['#79e3d2', '#f2bd70'] },
    code: "const colors = ['#79e3d2', '#f2bd70'];\nreturn colors;",
    estimatedSeconds: 28,
  },
  {
    id: 'task-triad',
    title: 'Queue the next three',
    language: 'JavaScript',
    tier: 'Small',
    description: 'Give a short task list a visible order.',
    objective: 'Return the next three build steps.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Type target', 'Shape preview', 'Share result'] },
    code: "const tasks = ['type', 'preview', 'share'];\nreturn tasks;",
    estimatedSeconds: 30,
  },
  {
    id: 'ready-records',
    title: 'Surface ready records',
    language: 'TypeScript',
    tier: 'Medium',
    description: 'Filter a stream without losing the readable path.',
    objective: 'Keep only records ready for the next stage.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Read records', 'Filter ready', 'Return rows'] },
    code: 'const rows = records.filter(row => row.ready);\nreturn rows;',
    estimatedSeconds: 35,
  },
  {
    id: 'queue-counter',
    title: 'Drain the queue',
    language: 'TypeScript',
    tier: 'Medium',
    description: 'Make queue pressure legible with one safe calculation.',
    objective: 'Decrement a queue without going below zero.',
    visualizer: 'counter',
    code: 'const count = queue.length;\nreturn Math.max(0, count - 1);',
    estimatedSeconds: 36,
  },
  {
    id: 'accent-token',
    title: 'Name the accent',
    language: 'JavaScript',
    tier: 'Medium',
    description: 'Expose one deliberate color token from a config object.',
    objective: 'Return a reusable accent token.',
    visualizer: 'palette',
    visualizerData: { colors: ['#9ebcf4', '#79e3d2', '#f2bd70'] },
    code: "const accent = '#9ebcf4';\nreturn { accent };",
    estimatedSeconds: 30,
  },
  {
    id: 'regional-ranking',
    title: 'Rank each region',
    language: 'SQL',
    tier: 'Hard',
    description: 'Make a grouped leaderboard tell the whole story.',
    objective: 'Rank each player inside their region.',
    visualizer: 'rankings',
    visualizerData: { labels: ['North / 01', 'East / 02', 'West / 03'] },
    code: 'SELECT DENSE_RANK() OVER (PARTITION BY region ORDER BY score DESC);',
    estimatedSeconds: 42,
  },
  {
    id: 'rollout-terminal',
    title: 'Watch the rollout',
    language: 'Shell',
    tier: 'Hard',
    description: 'Sequence two calm checks for a nervous deploy.',
    objective: 'Apply the rollout and verify the pods.',
    visualizer: 'terminal',
    code: 'kubectl rollout status deployment/api;\nkubectl get pods -l app=api;',
    estimatedSeconds: 38,
  },
  {
    id: 'ready-jobs',
    title: 'Prepare ready jobs',
    language: 'JavaScript',
    tier: 'Hard',
    description: 'Separate actionable work from a noisy job queue.',
    objective: 'Return the jobs that can move now.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Scan jobs', 'Keep ready', 'Send batch'] },
    code: "const tasks = jobs.filter(job => job.state === 'ready');\nreturn tasks;",
    estimatedSeconds: 45,
  },
  {
    id: 'palette-stack',
    title: 'Stack the palette',
    language: 'TypeScript',
    tier: 'Advanced',
    description: 'Build a three-token palette with a clear hierarchy.',
    objective: 'Return the complete visual token stack.',
    visualizer: 'palette',
    visualizerData: { colors: ['#e798a9', '#c6a4ed', '#79e3d2'] },
    code: "const colors = ['#e798a9', '#c6a4ed', '#79e3d2'];\nreturn colors;",
    estimatedSeconds: 48,
  },
  {
    id: 'ranked-rows',
    title: 'Order the rows',
    language: 'TypeScript',
    tier: 'Advanced',
    description: 'Keep a ranked result explicit and easy to inspect.',
    objective: 'Sort the strongest rows to the top.',
    visualizer: 'rankings',
    visualizerData: { labels: ['Atlas', 'Nova', 'Signal'] },
    code: 'const ranked = rows.sort((a, b) => b.score - a.score);\nreturn ranked;',
    estimatedSeconds: 50,
  },
  {
    id: 'sync-retry',
    title: 'Make sync resilient',
    language: 'TypeScript',
    tier: 'Advanced',
    description: 'Give one sync call a measured retry boundary.',
    objective: 'Retry the sync and return a clear status.',
    visualizer: 'terminal',
    code: "await retry(() => sync(), { retries: 3 });\nreturn 'synced';",
    estimatedSeconds: 46,
  },
  {
    id: 'production-rollout',
    title: 'Conduct the production rollout',
    language: 'Shell',
    tier: 'Legendary',
    description: 'Move a release from apply to verified health.',
    objective: 'Apply the release and watch it settle.',
    visualizer: 'terminal',
    code: 'kubectl -n prod apply -f rollout.yaml;\nkubectl -n prod rollout status deploy/api;',
    estimatedSeconds: 58,
  },
  {
    id: 'team-leaderboard',
    title: 'Partition the leaderboard',
    language: 'SQL',
    tier: 'Legendary',
    description: 'Build a ranked view that respects team boundaries.',
    objective: 'Assign a rank inside every team.',
    visualizer: 'rankings',
    visualizerData: { labels: ['Platform / 01', 'Product / 02', 'Infra / 03', 'Data / 04'] },
    code: 'SELECT *, ROW_NUMBER() OVER (\n  PARTITION BY team ORDER BY score DESC\n) AS rank\nFROM leaderboard;',
    estimatedSeconds: 65,
  },
  {
    id: 'ready-board',
    title: 'Shape the ready board',
    language: 'TypeScript',
    tier: 'Legendary',
    description: 'Turn every task in a board into an explicit state.',
    objective: 'Project a board where every task is ready.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Collect tasks', 'Mark ready', 'Publish board', 'Open share'] },
    code: 'const board = tasks.map(task => ({ ...task, ready: true }));\nreturn board;',
    estimatedSeconds: 60,
  },
  {
    id: 'small-python-directory',
    title: 'List the workspace',
    language: 'Python',
    tier: 'Small',
    description: 'Turn a local directory into a readable list.',
    objective: 'Return the visible names in a workspace.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Open workspace', 'Read entries', 'Return names'] },
    code: `from pathlib import Path
names = [entry.name for entry in Path('src').iterdir()]
return names`,
    estimatedSeconds: 32,
  },
  {
    id: 'small-react-badge',
    title: 'Render the badge',
    language: 'React',
    tier: 'Small',
    description: 'Give a small status value a clear visual home.',
    objective: 'Return a focused status badge component.',
    visualizer: 'palette',
    visualizerData: { colors: ['#79e3d2', '#9ebcf4'] },
    code: `const badge = <span className="tag">{label}</span>;
return badge;`,
    estimatedSeconds: 30,
  },
  {
    id: 'small-sql-count',
    title: 'Count the ready tasks',
    language: 'SQL',
    tier: 'Small',
    description: 'Make a queue count explicit and bounded.',
    objective: 'Return the number of ready tasks.',
    visualizer: 'counter',
    code: `SELECT COUNT(*) AS ready_count
FROM tasks
WHERE status = 'ready';`,
    estimatedSeconds: 30,
  },
  {
    id: 'medium-python-ready',
    title: 'Filter ready jobs',
    language: 'Python',
    tier: 'Medium',
    description: 'Keep a job queue focused on work that can move.',
    objective: 'Return only jobs in the ready state.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Read jobs', 'Keep ready', 'Return queue'] },
    code: `ready = [job for job in jobs if job['state'] == 'ready']
return ready`,
    estimatedSeconds: 36,
  },
  {
    id: 'medium-react-list',
    title: 'Filter the visible list',
    language: 'React',
    tier: 'Medium',
    description: 'Shape visible items before handing them to a list.',
    objective: 'Render only items marked visible.',
    visualizer: 'palette',
    visualizerData: { colors: ['#9ebcf4', '#79e3d2', '#c6a4ed'] },
    code: `const visible = items.filter(item => item.visible);
return <List items={visible} />;`,
    estimatedSeconds: 38,
  },
  {
    id: 'medium-sql-team-average',
    title: 'Order team averages',
    language: 'SQL',
    tier: 'Medium',
    description: 'Turn a grouped score table into a useful ranking.',
    objective: 'Return teams ordered by their average score.',
    visualizer: 'rankings',
    visualizerData: { labels: ['Platform', 'Product', 'Infra', 'Data'] },
    code: `SELECT team, AVG(score) AS mean_score
FROM leaderboard
GROUP BY team
ORDER BY mean_score DESC;`,
    estimatedSeconds: 42,
  },
  {
    id: 'hard-python-lines',
    title: 'Read the useful lines',
    language: 'Python',
    tier: 'Hard',
    description: 'Clean a file stream before showing a compact result.',
    objective: 'Return the first ten non-empty lines.',
    visualizer: 'terminal',
    code: `with open(path) as stream:
    lines = [line.strip() for line in stream if line.strip()]
return lines[:10]`,
    estimatedSeconds: 46,
  },
  {
    id: 'hard-react-group',
    title: 'Group the queue',
    language: 'React',
    tier: 'Hard',
    description: 'Turn a flat result into explicit status lanes.',
    objective: 'Group rows by their current status.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Collect rows', 'Group status', 'Render lanes', 'Check empty'] },
    code: `const grouped = rows.reduce((result, row) => {
  (result[row.status] ??= []).push(row);
  return result;
}, {});
return grouped;`,
    estimatedSeconds: 50,
  },
  {
    id: 'hard-sql-week',
    title: 'Sum this week',
    language: 'SQL',
    tier: 'Hard',
    description: 'Make a seven-day revenue signal easy to inspect.',
    objective: 'Return totals by category for the last week.',
    visualizer: 'counter',
    code: `SELECT category, SUM(amount) AS total
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY category;`,
    estimatedSeconds: 48,
  },
  {
    id: 'advanced-python-normalize',
    title: 'Normalize event order',
    language: 'Python',
    tier: 'Advanced',
    description: 'Make a valid event stream deterministic and ready.',
    objective: 'Filter valid events and sort them by creation time.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Filter valid', 'Shape events', 'Sort timeline', 'Return ready'] },
    code: `def normalize(events):
    return sorted(
        ({**event, 'ready': True} for event in events if event.get('valid')),
        key=lambda event: event['created_at'],
    )
return normalize(events)`,
    estimatedSeconds: 58,
  },
  {
    id: 'advanced-react-search',
    title: 'Keep search stable',
    language: 'React',
    tier: 'Advanced',
    description: 'Keep a filtered result responsive without losing the source list.',
    objective: 'Return search results derived from the current query.',
    visualizer: 'palette',
    visualizerData: { colors: ['#e798a9', '#c6a4ed', '#79e3d2'] },
    code: `const [query, setQuery] = useState('');
const filtered = useMemo(
  () => records.filter(record => record.name.includes(query)),
  [records, query],
);
return <SearchResults rows={filtered} />;`,
    estimatedSeconds: 62,
  },
  {
    id: 'advanced-sql-latency',
    title: 'Rank service latency',
    language: 'SQL',
    tier: 'Advanced',
    description: 'Make regional latency differences visible at a glance.',
    objective: 'Rank regions by their median request latency.',
    visualizer: 'rankings',
    visualizerData: { labels: ['East', 'West', 'Central', 'Edge'] },
    code: `SELECT region,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50
FROM request_metrics
GROUP BY region
ORDER BY p50 ASC;`,
    estimatedSeconds: 64,
  },
  {
    id: 'legendary-python-reconcile',
    title: 'Reconcile desired state',
    language: 'Python',
    tier: 'Legendary',
    description: 'Compare desired and actual state before opening the board.',
    objective: 'Return changes and whether the system is ready.',
    visualizer: 'tasks',
    visualizerData: { labels: ['Compare state', 'Collect changes', 'Mark ready', 'Publish result'] },
    code: `def reconcile(desired, actual):
    changes = [item for item in desired if item not in actual]
    return {'changes': changes, 'ready': len(changes) == 0}
return reconcile(desired, actual)`,
    estimatedSeconds: 72,
  },
  {
    id: 'legendary-react-polling',
    title: 'Build stable polling',
    language: 'React',
    tier: 'Legendary',
    description: 'Keep an async status view calm while requests resolve.',
    objective: 'Return a hook that ignores stale responses.',
    visualizer: 'palette',
    visualizerData: { colors: ['#c6a4ed', '#e798a9', '#79e3d2'] },
    code: `function useStablePolling(fetcher, interval = 5000) {
  const [state, setState] = useState('idle');
  useEffect(() => {
    let active = true;
    void fetcher().then(value => active && setState(value));
    return () => { active = false; };
  }, [fetcher]);
  return state;
}`,
    estimatedSeconds: 78,
  },
  {
    id: 'legendary-js-batches',
    title: 'Settle the job batches',
    language: 'JavaScript',
    tier: 'Legendary',
    description: 'Make a batch processor resilient before reporting success.',
    objective: 'Retry every job and flatten the completed batches.',
    visualizer: 'terminal',
    code: `const batches = await Promise.all(
  jobs.map(job => retry(() => process(job), { retries: 3 })),
);
return batches.flat();`,
    estimatedSeconds: 70,
  },
];

export const liveStudioLanguages = ['TypeScript', 'JavaScript', 'SQL', 'Shell', 'Python', 'React'] as const;

export const liveStudioTierTargetLengths: Record<LiveStudioTier, { min: number; max: number }> = {
  Small: { min: 20, max: 180 },
  Medium: { min: 25, max: 240 },
  Hard: { min: 35, max: 320 },
  Advanced: { min: 45, max: 420 },
  Legendary: { min: 55, max: 600 },
};

const liveStudioVisualizerDataSchema = z.object({
  labels: z.array(z.string().trim().min(1).max(48)).max(8).optional(),
  colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).max(8).optional(),
}).strict();

const liveStudioChallengeSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/),
  title: z.string().trim().min(3).max(80),
  language: z.enum(liveStudioLanguages),
  tier: z.enum(['Small', 'Medium', 'Hard', 'Advanced', 'Legendary']),
  code: z.string().min(1).max(600),
  description: z.string().trim().min(3).max(180).optional(),
  objective: z.string().trim().min(3).max(180).optional(),
  visualizer: z.enum(['counter', 'palette', 'tasks', 'terminal', 'rankings']),
  visualizerData: liveStudioVisualizerDataSchema.optional(),
  estimatedSeconds: z.number().int().min(10).max(900).optional(),
}).strict();

function assertVisualizerMetadata(challenge: LiveStudioChallenge) {
  const data = challenge.visualizerData;
  if (challenge.visualizer === 'palette' && (!data?.colors || data.colors.length < 2 || data.colors.length > 5)) {
    throw new Error('challenge contract validation failed: palette visualizers require 2 to 5 color metadata values');
  }
  if ((challenge.visualizer === 'tasks' || challenge.visualizer === 'rankings') && (!data?.labels || data.labels.length < 2 || data.labels.length > 6)) {
    throw new Error(`challenge contract validation failed: ${challenge.visualizer} visualizers require 2 to 6 label metadata values`);
  }
}

export function validateLiveStudioChallenge(input: unknown, expectedTier?: LiveStudioTier): LiveStudioChallenge {
  const parsed = liveStudioChallengeSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`challenge contract validation failed: ${parsed.error.issues[0]?.message ?? 'invalid shape'}`);
  }

  const challenge = parsed.data as LiveStudioChallenge;
  if (expectedTier && challenge.tier !== expectedTier) {
    throw new Error(`challenge tier must be ${expectedTier}`);
  }
  const bounds = liveStudioTierTargetLengths[challenge.tier];
  if (challenge.code.length < bounds.min || challenge.code.length > bounds.max) {
    throw new Error(`challenge contract validation failed: target must be ${bounds.min}-${bounds.max} characters for ${challenge.tier}`);
  }
  if (challenge.code.trim().length === 0 || challenge.code.includes('\0') || /[\u0001-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(challenge.code)) {
    throw new Error('challenge contract validation failed: target contains unsupported control characters');
  }
  assertVisualizerMetadata(challenge);
  return challenge;
}

export const curatedLiveStudioChallengeCatalog = liveStudioChallengeCatalog.map(challenge => validateLiveStudioChallenge(challenge));

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function getLiveStudioPeriodKey(cadence: LiveStudioCadence, date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (cadence === 'Daily') return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
  if (cadence === 'Monthly') return `${local.getFullYear()}-${pad(local.getMonth() + 1)}`;
  const daysSinceMonday = (local.getDay() + 6) % 7;
  local.setDate(local.getDate() - daysSinceMonday);
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function selectLiveStudioChallenge(cadence: LiveStudioCadence, tier: LiveStudioTier, date = new Date()) {
  const choices = curatedLiveStudioChallengeCatalog.filter(challenge => challenge.tier === tier);
  if (!choices.length) return curatedLiveStudioChallengeCatalog[0];
  const period = getLiveStudioPeriodKey(cadence, date);
  return choices[hash(`${cadence}:${tier}:${period}`) % choices.length];
}

export type LiveStudioChallengeSelection = {
  challenge: LiveStudioChallenge;
  source: 'generated' | 'curated-fallback';
  message?: string;
};

function generationFailureMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('contract validation')) {
    return 'Generated target failed contract validation. Using the curated catalog.';
  }
  return 'Generated target is unavailable. Using the curated catalog.';
}

export async function resolveLiveStudioChallenge(
  cadence: LiveStudioCadence,
  tier: LiveStudioTier,
  date = new Date(),
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): Promise<LiveStudioChallengeSelection> {
  const fallback = selectLiveStudioChallenge(cadence, tier, date);
  try {
    const response = await fetcher('/api/live-studio/challenge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cadence, tier, periodKey: getLiveStudioPeriodKey(cadence, date) }),
    });
    if (!response.ok) throw new Error(`generator responded with ${response.status}`);
    const payload = await response.json() as { challenge?: unknown } | unknown;
    const candidate = payload && typeof payload === 'object' && 'challenge' in payload ? payload.challenge : payload;
    return { challenge: validateLiveStudioChallenge(candidate, tier), source: 'generated' };
  } catch (error) {
    return { challenge: fallback, source: 'curated-fallback', message: generationFailureMessage(error) };
  }
}

function progressFor(challenge: LiveStudioChallenge, typed: string) {
  return challenge.code ? Math.min(1, typed.length / challenge.code.length) : 0;
}

export function projectLiveStudioPreview(challenge: LiveStudioChallenge, typed: string): LiveStudioSafePreview {
  const ratio = progressFor(challenge, typed);
  const complete = typed === challenge.code;
  const kind = challenge.visualizer ?? 'terminal';
  const labels = challenge.visualizerData?.labels ?? ['Read target', 'Project state', 'Create result'];

  if (kind === 'counter') {
    const value = Math.round(ratio * 100);
    return {
      kind,
      title: 'Progress pulse',
      status: complete ? 'Counter reached its target.' : `${value}% of the safe state is shaped.`,
      progress: value,
      metrics: [{ label: 'VALUE', value: `${value}%` }, { label: 'STEP', value: complete ? 'complete' : `${Math.max(1, Math.ceil(ratio * 3))} / 3` }, { label: 'MODE', value: complete ? 'ready' : 'building' }],
      output: [`counter.value = ${value}`, `counter.status = '${complete ? 'ready' : 'building'}'`],
    };
  }

  if (kind === 'palette') {
    const colors = challenge.visualizerData?.colors ?? ['#79e3d2', '#f2bd70', '#c6a4ed'];
    const visible = Math.max(0, Math.min(colors.length, Math.ceil(ratio * colors.length)));
    return {
      kind,
      title: 'Signal palette',
      status: complete ? 'Palette is ready to share.' : `${visible} of ${colors.length} color tokens are visible.`,
      items: colors.map((color, index) => ({ label: `token-${index + 1}`, value: index < visible ? color : 'hsl(var(--muted))' })),
    };
  }

  if (kind === 'tasks') {
    const done = complete ? labels.length : Math.floor(ratio * labels.length);
    return {
      kind,
      title: 'Build queue',
      status: complete ? 'Every projected step is ready.' : `${done} of ${labels.length} steps are ready.`,
      items: labels.map((label, index) => ({ label, value: index < done ? 'done' : 'queued' })),
    };
  }

  if (kind === 'rankings') {
    const visible = Math.max(1, Math.ceil(ratio * labels.length));
    return {
      kind,
      title: 'Ranked output',
      status: complete ? 'Ranking is ready to inspect.' : `${visible} rows are readable so far.`,
      items: labels.slice(0, visible).map((label, index) => ({ label, value: complete ? `#${index + 1}` : 'pending' })),
    };
  }

  const lines = challenge.code.split('\n');
  const visibleLines = Math.max(1, Math.ceil(ratio * lines.length));
  return {
    kind,
    title: 'Command output',
    status: complete ? 'Command sequence is ready.' : `${visibleLines} of ${lines.length} command lines are staged.`,
    output: lines.slice(0, visibleLines).map((line, index) => `${index === visibleLines - 1 && !complete ? '>' : '$'} ${line}`),
  };
}

export type LiveStudioBuild = {
  id: string;
  challengeId: string;
  title: string;
  tier: LiveStudioTier;
  cadence: LiveStudioCadence;
  wpm: number;
  cpm: number;
  accuracy: number;
  seconds: number;
  points: number;
  date: string;
  preview: LiveStudioSafePreview;
};

export function encodeLiveStudioShare(build: LiveStudioBuild) {
  return encodeURIComponent(JSON.stringify({
    challengeId: build.challengeId,
    title: build.title,
    tier: build.tier,
    cadence: build.cadence,
    wpm: build.wpm,
    accuracy: build.accuracy,
    seconds: build.seconds,
    points: build.points,
    date: build.date,
    preview: build.preview,
  }));
}

export function decodeLiveStudioShare(value: string | null): Partial<LiveStudioBuild> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<LiveStudioBuild>;
    if (!parsed.challengeId || !parsed.title || !parsed.tier || !parsed.cadence) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function liveStudioShareUrl(build: LiveStudioBuild, baseUrl: string) {
  const url = new URL(baseUrl);
  url.search = '';
  url.searchParams.set('share', encodeLiveStudioShare(build));
  return url.toString();
}
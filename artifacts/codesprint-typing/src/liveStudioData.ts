import type {
  LiveStudioCadence,
  LiveStudioChallenge,
  LiveStudioSafePreview,
  LiveStudioTier,
} from './LiveStudio';

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
];

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
  const choices = liveStudioChallengeCatalog.filter(challenge => challenge.tier === tier);
  if (!choices.length) return liveStudioChallengeCatalog[0];
  const period = getLiveStudioPeriodKey(cadence, date);
  return choices[hash(`${cadence}:${tier}:${period}`) % choices.length];
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
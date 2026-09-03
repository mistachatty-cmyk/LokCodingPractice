export type RecommendationTier = 'Small' | 'Medium' | 'Hard' | 'Advanced' | 'Legendary';

export type RecommendationSnippet = {
  id: string;
  title: string;
  language: string;
  tier: RecommendationTier;
  description: string;
  code: string;
  custom?: boolean;
};

export type RecommendationRun = {
  snippetTitle: string;
  tier: RecommendationTier;
  accuracy: number;
  date: string;
};

export type RecommendationReasonKey =
  | 'starter'
  | 'strengthen_accuracy'
  | 'continue_rhythm'
  | 'try_new_language'
  | 'approach_unlock'
  | 'keep_exploring';

export type PracticeRecommendation = {
  snippet: RecommendationSnippet;
  reasonKey: RecommendationReasonKey;
  reason: string;
  objective: string;
  estimateSeconds: number;
  rewardPoints: number;
};

type TierMeta = { points: number; unlock: number };

function validDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function pickAvailable(
  snippets: readonly RecommendationSnippet[],
  availableTiers: readonly RecommendationTier[],
  recentTitles: ReadonlySet<string> = new Set<string>(),
  preferredTier?: RecommendationTier,
) {
  const candidates = snippets.filter(snippet =>
    availableTiers.includes(snippet.tier)
    && (!preferredTier || snippet.tier === preferredTier),
  );
  const fresh = candidates.filter(snippet => !recentTitles.has(snippet.title));
  return (fresh.length ? fresh : candidates).slice().sort((a, b) => {
    const lengthDelta = a.code.length - b.code.length;
    return lengthDelta || a.id.localeCompare(b.id);
  })[0];
}

function buildRecommendation(
  snippet: RecommendationSnippet,
  reasonKey: RecommendationReasonKey,
  reason: string,
  rewardPoints: number,
): PracticeRecommendation {
  return {
    snippet,
    reasonKey,
    reason,
    objective: `Type the ${snippet.language} pattern exactly, then let the signal settle.`,
    estimateSeconds: Math.max(20, Math.min(120, Math.round(snippet.code.length / 4))),
    rewardPoints,
  };
}

export function recommendPractice({
  snippets,
  runs,
  totalPoints,
  tierMeta,
}: {
  snippets: readonly RecommendationSnippet[];
  runs: readonly RecommendationRun[];
  totalPoints: number;
  tierMeta: Record<RecommendationTier, TierMeta>;
}): PracticeRecommendation | null {
  const usableSnippets = snippets.filter(snippet =>
    snippet.id && snippet.title && snippet.code && tierMeta[snippet.tier],
  );
  if (!usableSnippets.length) return null;

  const availableTiers = (Object.keys(tierMeta) as RecommendationTier[])
    .filter(tier => totalPoints >= tierMeta[tier].unlock);
  const orderedRuns = runs
    .filter(run => run?.snippetTitle && tierMeta[run.tier])
    .slice()
    .sort((a, b) => validDate(b.date) - validDate(a.date));
  const recentRuns = orderedRuns.slice(0, 6);
  const recentTitles = new Set(recentRuns.slice(0, 3).map(run => run.snippetTitle));
  const latestRun = recentRuns[0];

  if (!latestRun) {
    const starter = pickAvailable(usableSnippets, availableTiers);
    return starter
      ? buildRecommendation(starter, 'starter', 'A short first win with no setup required.', tierMeta[starter.tier].points)
      : null;
  }

  if (latestRun.accuracy < 95) {
    const accuracyDrill = pickAvailable(usableSnippets, availableTiers, recentTitles, latestRun.tier);
    if (accuracyDrill) {
      return buildRecommendation(accuracyDrill, 'strengthen_accuracy', 'Your last run left room for cleaner keystrokes, so this keeps the pressure kind.', tierMeta[accuracyDrill.tier].points);
    }
  }

  const mostRecentLanguage = new Set(recentRuns.map(run => {
    const match = usableSnippets.find(snippet => snippet.title === run.snippetTitle);
    return match?.language;
  }));
  const newLanguage = usableSnippets
    .filter(snippet => availableTiers.includes(snippet.tier) && !mostRecentLanguage.has(snippet.language) && !recentTitles.has(snippet.title))
    .slice()
    .sort((a, b) => a.code.length - b.code.length || a.id.localeCompare(b.id))[0];
  if (newLanguage) {
    return buildRecommendation(newLanguage, 'try_new_language', `You have been practicing consistently; try ${newLanguage.language} to widen your range.`, tierMeta[newLanguage.tier].points);
  }

  const nextLockedTier = (Object.keys(tierMeta) as RecommendationTier[])
    .filter(tier => tierMeta[tier].unlock > totalPoints)
    .sort((a, b) => tierMeta[a].unlock - tierMeta[b].unlock)[0];
  if (nextLockedTier && tierMeta[nextLockedTier].unlock - totalPoints <= 120) {
    const progressionDrill = pickAvailable(usableSnippets, availableTiers, recentTitles);
    if (progressionDrill) {
      return buildRecommendation(progressionDrill, 'approach_unlock', `${tierMeta[nextLockedTier].unlock - totalPoints} more points brings the ${nextLockedTier} tier within reach.`, tierMeta[progressionDrill.tier].points);
    }
  }

  const sameDay = latestRun.date && validDate(latestRun.date)
    ? new Date(latestRun.date).toDateString() === new Date().toDateString()
    : false;
  const rhythmDrill = pickAvailable(usableSnippets, availableTiers, recentTitles, latestRun.tier);
  if (rhythmDrill) {
    return buildRecommendation(
      rhythmDrill,
      sameDay ? 'continue_rhythm' : 'keep_exploring',
      sameDay ? 'Keep today’s rhythm with one more calm repetition.' : 'A small return is enough; this is the next useful pattern in your room.',
      tierMeta[rhythmDrill.tier].points,
    );
  }

  const fallback = pickAvailable(usableSnippets, availableTiers, recentTitles);
  return fallback
    ? buildRecommendation(fallback, 'keep_exploring', 'Your local library is ready for another useful repetition.', tierMeta[fallback.tier].points)
    : null;
}
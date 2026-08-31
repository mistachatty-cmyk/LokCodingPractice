import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const tiers = ["Small", "Medium", "Hard", "Advanced", "Legendary"] as const;
const cadences = ["Daily", "Weekly", "Monthly"] as const;
const languages = ["TypeScript", "JavaScript", "SQL", "Shell", "Python", "React"] as const;
const visualizers = ["counter", "palette", "tasks", "terminal", "rankings"] as const;
const targetLengths: Record<(typeof tiers)[number], { min: number; max: number }> = {
  Small: { min: 20, max: 180 },
  Medium: { min: 25, max: 240 },
  Hard: { min: 35, max: 320 },
  Advanced: { min: 45, max: 420 },
  Legendary: { min: 55, max: 600 },
};

const challengeRequestSchema = z.object({
  cadence: z.enum(cadences),
  tier: z.enum(tiers),
  periodKey: z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?$/),
}).strict();

const challengeSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/),
  title: z.string().trim().min(3).max(80),
  language: z.enum(languages),
  tier: z.enum(tiers),
  code: z.string().min(1).max(600),
  description: z.string().trim().min(3).max(180).optional(),
  objective: z.string().trim().min(3).max(180).optional(),
  visualizer: z.enum(visualizers),
  visualizerData: z.object({
    labels: z.array(z.string().trim().min(1).max(48)).max(8).optional(),
    colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).max(8).optional(),
  }).strict().optional(),
  estimatedSeconds: z.number().int().min(10).max(900).optional(),
}).strict();

type DraftRequest = z.infer<typeof challengeRequestSchema>;
type Draft = z.infer<typeof challengeSchema>;

const draftRecipes: Record<(typeof tiers)[number], Draft[]> = {
  Small: [
    {
      id: "generated-small-counter",
      title: "Shape the score pulse",
      language: "TypeScript",
      tier: "Small",
      description: "Turn one bounded score update into a readable signal.",
      objective: "Return a score that never exceeds the safe ceiling.",
      visualizer: "counter",
      code: "const nextScore = Math.min(100, score + 10);\nreturn nextScore;",
      estimatedSeconds: 25,
    },
    {
      id: "generated-small-tasks",
      title: "Queue the handoff",
      language: "JavaScript",
      tier: "Small",
      description: "Keep a short build handoff visible and ordered.",
      objective: "Return the next three steps in the handoff.",
      visualizer: "tasks",
      visualizerData: { labels: ["Type target", "Shape preview", "Share result"] },
      code: "const handoff = ['type', 'preview', 'share'];\nreturn handoff;",
      estimatedSeconds: 28,
    },
  ],
  Medium: [
    {
      id: "generated-medium-palette",
      title: "Name the signal",
      language: "TypeScript",
      tier: "Medium",
      description: "Expose a small, deliberate color system from configuration.",
      objective: "Return the accent token and its supporting colors.",
      visualizer: "palette",
      visualizerData: { colors: ["#9ebcf4", "#79e3d2", "#f2bd70"] },
      code: "const palette = { accent: '#9ebcf4', support: ['#79e3d2', '#f2bd70'] };\nreturn palette;",
      estimatedSeconds: 32,
    },
    {
      id: "generated-medium-queue",
      title: "Drain the queue",
      language: "JavaScript",
      tier: "Medium",
      description: "Make queue pressure legible with one safe calculation.",
      objective: "Decrement a queue without going below zero.",
      visualizer: "counter",
      code: "const remaining = Math.max(0, queue.length - 1);\nreturn remaining;",
      estimatedSeconds: 34,
    },
  ],
  Hard: [
    {
      id: "generated-hard-ranking",
      title: "Rank the ready rows",
      language: "SQL",
      tier: "Hard",
      description: "Give a grouped leaderboard a readable order.",
      objective: "Rank each player inside their region.",
      visualizer: "rankings",
      visualizerData: { labels: ["North / 01", "East / 02", "West / 03"] },
      code: "SELECT player_id, region,\n  DENSE_RANK() OVER (PARTITION BY region ORDER BY score DESC) AS rank\nFROM leaderboard;",
      estimatedSeconds: 42,
    },
    {
      id: "generated-hard-terminal",
      title: "Watch the rollout",
      language: "Shell",
      tier: "Hard",
      description: "Sequence two calm checks for a nervous deploy.",
      objective: "Apply the rollout and verify the pods.",
      visualizer: "terminal",
      code: "kubectl rollout status deployment/api;\nkubectl get pods -l app=api;",
      estimatedSeconds: 38,
    },
  ],
  Advanced: [
    {
      id: "generated-advanced-tasks",
      title: "Prepare ready jobs",
      language: "TypeScript",
      tier: "Advanced",
      description: "Separate actionable work from a noisy job queue.",
      objective: "Return the jobs that can move now.",
      visualizer: "tasks",
      visualizerData: { labels: ["Scan jobs", "Keep ready", "Send batch"] },
      code: "const ready = jobs\n  .filter(job => job.state === 'ready')\n  .map(job => ({ id: job.id, ready: true }));\nreturn ready;",
      estimatedSeconds: 48,
    },
    {
      id: "generated-advanced-palette",
      title: "Stack the palette",
      language: "JavaScript",
      tier: "Advanced",
      description: "Build a three-token palette with a clear hierarchy.",
      objective: "Return the complete visual token stack.",
      visualizer: "palette",
      visualizerData: { colors: ["#e798a9", "#c6a4ed", "#79e3d2"] },
      code: "const colors = ['#e798a9', '#c6a4ed', '#79e3d2'];\nreturn colors;",
      estimatedSeconds: 46,
    },
  ],
  Legendary: [
    {
      id: "generated-legendary-terminal",
      title: "Conduct the rollout",
      language: "Shell",
      tier: "Legendary",
      description: "Move a release from apply to verified health.",
      objective: "Apply the release and watch it settle.",
      visualizer: "terminal",
      code: "kubectl -n prod apply -f rollout.yaml;\nkubectl -n prod rollout status deploy/api;\nkubectl -n prod get pods -l app=api -o wide;",
      estimatedSeconds: 58,
    },
    {
      id: "generated-legendary-ranking",
      title: "Partition the leaderboard",
      language: "SQL",
      tier: "Legendary",
      description: "Build a ranked view that respects team boundaries.",
      objective: "Assign a rank inside every team.",
      visualizer: "rankings",
      visualizerData: { labels: ["Platform / 01", "Product / 02", "Infra / 03", "Data / 04"] },
      code: "SELECT *, ROW_NUMBER() OVER (\n  PARTITION BY team ORDER BY score DESC\n) AS rank\nFROM leaderboard\nWHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days';",
      estimatedSeconds: 65,
    },
  ],
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function validateDraft(draft: Draft, expectedTier: DraftRequest["tier"]) {
  const parsed = challengeSchema.safeParse(draft);
  if (!parsed.success) throw new Error("generated draft did not match the challenge contract");
  const challenge = parsed.data;
  const bounds = targetLengths[challenge.tier];
  if (challenge.tier !== expectedTier || challenge.code.length < bounds.min || challenge.code.length > bounds.max) {
    throw new Error("generated draft failed tier or target length validation");
  }
  if (challenge.code.trim().length === 0 || challenge.code.includes("\0") || /[\u0001-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(challenge.code)) {
    throw new Error("generated draft contains unsupported control characters");
  }
  if (challenge.visualizer === "palette" && (!challenge.visualizerData?.colors || challenge.visualizerData.colors.length < 2 || challenge.visualizerData.colors.length > 5)) {
    throw new Error("generated palette draft is missing color metadata");
  }
  if ((challenge.visualizer === "tasks" || challenge.visualizer === "rankings") && (!challenge.visualizerData?.labels || challenge.visualizerData.labels.length < 2 || challenge.visualizerData.labels.length > 6)) {
    throw new Error("generated list draft is missing label metadata");
  }
  return challenge;
}

function generateDraft(request: DraftRequest) {
  const recipes = draftRecipes[request.tier];
  const recipe = recipes[hash(`${request.cadence}:${request.tier}:${request.periodKey}`) % recipes.length];
  return validateDraft({
    ...recipe,
    id: `${recipe.id}-${request.periodKey.replaceAll("-", "")}`,
  }, request.tier);
}

router.post("/live-studio/challenge", (req, res) => {
  const parsed = challengeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid Live Studio challenge request." });
    return;
  }
  if (process.env.LIVE_STUDIO_GENERATOR_DISABLED === "true") {
    res.status(503).json({ error: "Live Studio challenge generation is unavailable." });
    return;
  }
  try {
    const challenge = generateDraft(parsed.data);
    res.json({ challenge, source: "generated" });
  } catch (error) {
    logger.warn({ err: error }, "Live Studio challenge generation failed validation");
    res.status(503).json({ error: "Generated challenge failed validation." });
  }
});

export default router;
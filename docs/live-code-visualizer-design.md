# Live Code Visualizer Studio

## Product intent

Live Studio turns a typing drill into a small creation loop. A learner chooses a cadence and difficulty, types an exact generated target, watches a safe projection evolve, and leaves with a result that can be shared.

The first release is intentionally local-first and deterministic. The current challenge is selected from a catalog using the cadence, tier, and local calendar period. This keeps the experience useful without an account, backend, AI key, or social API credential while leaving a clear boundary for future generation.

## Experience

1. Open **Live Studio** from the main navigation.
2. Choose **Daily**, **Weekly**, or **Monthly**.
3. Choose an unlocked tier: **Small**, **Medium**, **Hard**, **Advanced**, or **Legendary**.
4. Receive a stable challenge for that cadence, tier, and calendar period. The target includes a title, language, objective, code, and visualizer kind.
5. Start the session and type the target. Correct characters turn mint, incorrect characters remain marked, backspace removes the last character, and timing/accuracy update live.
6. Watch the safe projection update from the typed prefix. The projection can be a counter, palette, task queue, ranking, or terminal output.
7. Create the result when the exact target is complete. The result shows the finished projection, metrics, points, and share actions.

## Challenge contract

```ts
type LiveStudioChallenge = {
  id: string;
  title: string;
  language: string;
  tier: "Small" | "Medium" | "Hard" | "Advanced" | "Legendary";
  code: string;
  description?: string;
  objective?: string;
  visualizer?: "counter" | "palette" | "tasks" | "terminal" | "rankings";
  visualizerData?: {
    labels?: string[];
    colors?: string[];
  };
  estimatedSeconds?: number;
};
```

`getLiveStudioPeriodKey()` creates the stable period key. Daily uses the local date, Weekly uses the Monday that starts the local week, and Monthly uses the local year/month. A small deterministic hash of cadence, tier, and period chooses one catalog entry, so the same selection is reproducible while future periods can rotate content.

## Safe visualizer architecture

The visualizer is a projection, not an executor. The typed source is never passed to `eval`, `Function`, an iframe, a shell, a network request, or any other runtime. `projectLiveStudioPreview()` receives only the known challenge and typed length, then returns a constrained `LiveStudioSafePreview` object.

The presentation layer renders only the object fields:

- **Counter**: progress ring, percentage, step, and mode.
- **Palette**: whitelisted color swatches from challenge metadata.
- **Tasks**: labeled queue items with `queued` or `done` states.
- **Rankings**: labeled rows with pending or ranked values.
- **Terminal**: a limited set of challenge-owned command lines with staged prefixes.

This approach makes partial typing feel live without turning learner input into executable code. New visualizers should be added as a new discriminated kind plus a pure projection branch and a presentational renderer.

## Rotating generated challenges

Live Studio requests a server-owned draft for the selected cadence, tier, and local period. The server rotates among safe recipes, validates the draft against the challenge contract, and returns it only after checking:

- supported language and visualizer kind;
- tier-specific target length;
- bounded title, description, objective, and estimate fields;
- visualizer metadata (2–5 colors for palettes and 2–6 labels for task/ranking projections);
- absence of unsupported control characters in the typing target.

The browser validates the response again before replacing the deterministic catalog selection. A rejected, malformed, timed-out, or unavailable response returns the same curated selection that would have been shown without a server. The UI labels the source and announces the fallback. A request that finishes after a learner starts typing cannot replace the active target, so learner input is never executed or discarded by rotation.

## Persistence

Live completions are stored in `codesprint_live_builds`, separate from the existing `codesprint_runs`, `codesprint_custom_snippets`, and `codesprint_theme` records. Each build stores its challenge identity, cadence, tier, metrics, points, completion timestamp, and final safe preview.

Live build points and credits contribute to the existing progress totals and tier unlocking. Existing practice run and snippet formats remain unchanged.

## Sharing

The result share payload contains the challenge identity, cadence, tier, title, metrics, points, timestamp, and safe preview. It is URL-encoded into the `share` query parameter so a shared URL can reopen a completed local result without an account or server.

Sharing order:

1. Use `navigator.share()` when the device provides the Web Share API.
2. Offer a copy-link action using the Clipboard API with a hidden-textarea fallback.
3. Offer public intent links for X and LinkedIn.

No social platform API or credential is required. Because the payload is local and URL-based, a future hosted gallery can replace the deep link with a server-owned result URL without changing the challenge or visualizer contracts.

## Future improvements

- Add an AI generation adapter behind the existing server draft boundary, then keep the same contract validation before publishing.
- Add more visualizer kinds such as JSON inspector, form builder, chart, and component preview.
- Add challenge authoring tools for curated lessons and team-specific code patterns.
- Add hosted result snapshots so shared links remain small and discoverable.
- Add a daily/weekly streak calendar and completion history grouped by cadence.
- Add accessibility narration for visualizer state changes and reduced-motion presentation.

## Verification checklist

- The same cadence/tier/date selects the same challenge.
- An incomplete target produces a partial preview and never executes typed code.
- Correct, incorrect, and backspace input update the code surface and metrics.
- Completion persists locally and appears in Progress.
- Share controls work with native share, clipboard fallback, and public intent links.
- Existing Practice, Progress, Snippet library, Workspace, themes, and storage keys continue to work.
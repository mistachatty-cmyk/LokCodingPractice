# Live Code Visualizer Studio

## Product intent

Live Studio turns a typing drill into a small creation loop. A learner chooses a cadence and difficulty, types an exact generated target, watches a safe projection evolve, and leaves with a result that can be shared.

The first release is intentionally local-first and deterministic. The current challenge is selected from a catalog using the cadence, tier, and local calendar period. This keeps the experience useful without an account, backend, AI key, or social API credential while leaving a clear boundary for future generation.

## Experience

1. Open **Live Studio** from the main navigation.
2. Choose **Daily**, **Weekly**, or **Monthly**.
   - Daily includes a horizontal day rail for days 1–31 of the current month; changing the day is an explicit target selection.
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

## Palette progression

Workspace palettes are a local catalog of 32 deterministic definitions with two new themed choices added to each of the five practice tiers. Small and Medium are available immediately; Hard, Advanced, and Legendary unlock at the same point thresholds used by practice and Live Studio. The browser supports tier, level, and Static/Animated filters and preserves those selections in local storage.

Twenty-four of the 32 palette definitions offer animated variants, using low-amplitude drift, pulse, or orbit motion across background gradients, preview surfaces, and the selected room-level motif. Eight palettes remain intentionally static for a quieter option. The catalog now includes Matrix rain, CRT afterglow, Toxic garden, Deep-sea biolume, Neon shrine, VHS ghost, Fungal network, Solar cult, Black-hole karaoke, and Glitch cathedral for more distinctive analog, bioluminescent, occult, organic, cosmic, and glitch moods. Palette quality progresses by tier: Small and Medium establish a clear, approachable visual language, while Hard, Advanced, and Legendary add more material depth, layered atmosphere, and richer motion without making earlier tiers feel unfinished. Code text, caret, layout, and projection content do not animate. Motion defaults to the browser's `prefers-reduced-motion` setting and can be explicitly enabled or disabled in Workspace. The legacy `midnight`, `ember`, and `mint` IDs remain valid in `codesprint_theme`.

Animated palette motifs are rendered in three coordinated places: the palette card preview, the Workspace editor visualizer, and the selected palette's ambient room treatment around the application UI. Static palettes reuse their visual motifs but never mount or animate the ambient layer. This keeps the theme identity present after selection without turning the typing surface into a distraction. Matrix additionally uses falling glyph columns and a phosphor grid treatment across its preview and room layers.

## Sharing

The result share payload contains the challenge identity, cadence, tier, title, metrics, points, timestamp, and safe preview. It is URL-encoded into the `share` query parameter so a shared URL can reopen a completed local result without an account or server.

Sharing order:

1. Use `navigator.share()` when the device provides the Web Share API.
2. Offer a copy-link action using the Clipboard API with a hidden-textarea fallback.
3. Offer public intent links for X and LinkedIn.

No social platform API or credential is required. Because the payload is local and URL-based, a future hosted gallery can replace the deep link with a server-owned result URL without changing the challenge or visualizer contracts.

## Product analytics

Live Studio records aggregate outcomes through the Replit-hosted analytics tracker when it is enabled. The shared analytics wrapper is guarded so a missing tracker, tracker load delay, or tracker error never interrupts practice. No typed code, challenge title, challenge ID, share URL, preview data, or other free-form content is sent.

| Description | Event name |
| --- | --- |
| A learner starts a Live Studio session. | `live_studio_session_started` |
| A learner creates a completed Live Studio result. | `live_studio_result_created` |
| A learner completes, cancels, cannot complete, or initiates a Live Studio share action. | `live_studio_share_action` |

The session-started event includes `cadence`, `tier`, `language`, and `visualizer`. Result-created adds `accuracy_bucket`. Share-action includes those same dimensions plus `accuracy_bucket`, `action` (`native`, `clipboard`, `copy_link`, `x`, or `linkedin`), and `outcome` (`success`, `cancelled`, `unavailable`, or `initiated`). Accuracy buckets are `0_79`, `80_94`, and `95_100`.

To collect these events, go to **Publishing settings**, enable analytics, and publish or republish the app. The analytics changes take effect on the next publish.

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
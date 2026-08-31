---
name: React route state preservation
description: A routing pattern that prevents active UI flows from resetting during parent state updates.
---

Prefer stable routed component types or Wouter render-child routes when a route's parent owns state that updates during the route's interaction.

**Why:** Inline component functions can be treated as new component types on each parent render, remounting the active flow and discarding its local state immediately after a save or other parent update.

**How to apply:** When a route both updates parent-owned data and needs to show a local success or completion state, verify the route preserves the child state across that update.
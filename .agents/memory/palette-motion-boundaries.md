---
name: Palette motion boundaries
description: The visual rule that keeps shared palette motifs still unless a palette explicitly enables motion.
---

Shared palette motifs may be reused across static and animated themes, but movement must be scoped to an explicitly animated preview or live ambient layer. Static themes should keep the same visual identity without running keyframes.

**Why:** Reusing motif markup makes it easy for a keyframe attached to a motif element to animate a static palette accidentally, which breaks the quiet option and reduced-motion expectations.

**How to apply:** When adding a new motif animation, make its default state still and opt it into motion only through the animated preview/editor or selected-room layer; keep reduced-motion overrides authoritative.
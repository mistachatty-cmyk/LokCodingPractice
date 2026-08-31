---
name: Local browser checks
description: Environment constraints and portability guidance for real-browser checks in this workspace.
---

Real-browser checks should resolve Chromium from the environment when available and retain a fallback to Playwright's bundled browser. Replit's minimal Nix environment may require the system Chromium package and its shared libraries before a bundled browser can launch.

**Why:** A browser test that depends on a developer's preinstalled browser is not repeatable, while Playwright's headless shell may fail before the test starts when required Nix libraries are absent.

**How to apply:** Add the browser runtime to the workspace environment, resolve it through PATH rather than hardcoding a Nix store path, and intercept third-party requests in checks intended to verify a local-first app.
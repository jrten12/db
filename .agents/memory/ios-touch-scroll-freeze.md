---
name: iOS touch-scroll freeze
description: Why the page can freeze for touch users while mouse wheel scrolling works, and the fix pattern used in this app.
---

# iOS touch-scroll freeze

**Rule:** Never put `overflow-x: hidden` on `body` or full-page wrappers in this app — use `overflow-x: clip` instead. Also avoid unscoped `touch-action: none` and global scroll-lock hacks (a slider scroll-lock IIFE in main.tsx was removed for this reason).

**Why:** Per CSS spec, `overflow-x: hidden` forces `overflow-y` to compute to `auto`, making the element a scroll container. On iOS, touch scrolling latches onto that non-scrollable container, and `overscroll-behavior: none` (set on body) blocks chaining to the viewport — page appears completely frozen for touch users while desktop mouse-wheel works fine. `clip` clips without creating a scroll container.

**How to apply:** When users report "page won't scroll" (especially from the iOS Replit app), check computed `overflow-y` on body/wrappers (`hidden`/`auto` when you expected `visible` is the tell). Note: headless Chromium's `Input.synthesizeScrollGesture` with touch does NOT work in this environment — you cannot verify touch scrolling in emulation; verify by root-cause analysis + user confirmation.

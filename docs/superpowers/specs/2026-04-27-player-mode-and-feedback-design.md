# Player Mode Toggle, No-Repeats, and Feedback — Design

**Date:** 2026-04-27
**Status:** Approved
**Scope:** Add a settings panel for player count, no-repeats coordinate tracking, and tactile feedback (vibration + sound + enhanced visuals) to the existing static web app.

## Background

`Plunder: A Pirates Life` is a small static web app (HTML + CSS + JS, no build step) with two spinning wheels: letters A–L and numbers 1–18. Each spin produces a coordinate (e.g. `B7`) used as a grid reference in the board game.

Currently the number range is hardcoded 1–18 in [script.js](../../script.js) line 37. The two-player variant of the game uses 1–12 only. There is no settings UI, no history, and no spin-stop feedback beyond a CSS pulse animation.

## Goals

1. Let users switch between 2-player (1–12) and 3+ player (1–18) number ranges via a UI toggle.
2. Optionally avoid duplicate coordinates within a game session.
3. Reset the no-repeats history automatically each day (local timezone), with a manual "New Game" override.
4. Give the user feedback when each wheel stops, including on iPhone where `navigator.vibrate` is unsupported.

## Non-Goals

- No backend, accounts, or sync across devices.
- No PWA / native packaging (out of scope; would unlock real iOS haptics, but adds deployment complexity).
- No changes to the letter wheel range or the visual style of the spinners.
- No multi-game-state tracking beyond a single shared "today's history".

## Design

### Settings Panel

A gear icon (⚙) is fixed to the top-right of the viewport, gold-coloured to match the existing theme. Tapping it opens a modal overlay with a dimmed background; tapping outside the modal or pressing a Close button dismisses it. The gear icon is disabled while a spin is in progress.

The modal contains:

- **Players:** segmented control with two options — `2` and `3+`.
- **No repeats:** on/off toggle.
- **Sound:** on/off toggle.
- **New Game** button — clears today's used-combos history immediately. No confirmation prompt (the cost of an accidental tap is low).
- **Close** button.

### Player Mode and Number Range

- `playerMode = "two"` → number wheel shows 1–12.
- `playerMode = "many"` → number wheel shows 1–18 (current behavior).
- Default: `"many"` so existing users see no change.
- Toggling rebuilds the number wheel: clears the existing `<g id="number-wheel-content">` content, re-runs the `createSpinnerContent` helper with the new array, and resets `numberWheelRotation.value` to 0.
- The letter wheel is never rebuilt.

### No-Repeats Logic

When `noRepeats === "on"`:

- Before each spin, compute the **remaining combos** by filtering the full Cartesian product of the current letter and number arrays against `usedCombos`.
- Pick uniformly from remaining combos using `getSecureRandom`. The chosen combo's letter and number indices are passed to the existing `spinWheel` machinery as the target — i.e. we still spin both wheels visually to land on those values.
- After the spin completes, append `"<letter><number>"` (e.g. `"B7"`) to `usedCombos` and persist.
- **Exhaustion:** when remaining combos is empty before a spin, clear `usedCombos` and recompute remaining (which is now the full set), then proceed normally with the spin. The user does not see an error or block — the auto-reset is silent.

When `noRepeats === "off"`:

- Behaviour is identical to current: each wheel picks independently with `getSecureRandom`.
- `usedCombos` is preserved (not appended to, not cleared) so toggling on later resumes filtering with the prior history intact.

### Daily Auto-Reset

On app load (and on settings-modal open as a backstop), call `checkDailyReset()`:

- Compute today's local-timezone date as `YYYY-MM-DD`.
- If `lastResetDate` is unset or differs, clear `usedCombos` and write the new `lastResetDate`.

Manual "New Game" simply clears `usedCombos`. It does not change `lastResetDate`.

### Feedback When Wheels Stop

Three independent mechanisms fire when each wheel snaps to its final position (inside the existing `setTimeout` in `spinWheel`):

1. **Vibration:** `navigator.vibrate(50)` if the API exists. Silent no-op on iOS.
2. **Sound:** when `soundEnabled === "on"`, play a synthesized "thunk" via Web Audio API. Implementation: a single `OscillatorNode` (sine, ~80 Hz) routed through a `GainNode` with a fast attack and ~120 ms exponential decay. No audio asset files. The `AudioContext` is created lazily on first user gesture (the SPIN button click) to satisfy iOS Safari's autoplay policy, then reused.
3. **Visual punch:** the existing `.rolling` pulse animation on `.result-display` is enhanced — briefly increase `text-shadow` glow and bump the scale slightly higher (e.g. `scale(1.3)` instead of `1.2`).

The visual punch and vibration always fire (regardless of the Sound toggle, which only gates audio). Both wheels stop simultaneously, so vibration and sound fire twice in close succession — perceived as a single "double tap".

### Storage

All persisted state lives in `localStorage`. Keys are namespaced with `plunder.`:

| Key | Type | Values | Default |
|---|---|---|---|
| `plunder.playerMode` | string | `"two"` / `"many"` | `"many"` |
| `plunder.noRepeats` | string | `"on"` / `"off"` | `"off"` |
| `plunder.soundEnabled` | string | `"on"` / `"off"` | `"on"` |
| `plunder.usedCombos` | JSON array | e.g. `["A1","B7"]` | `[]` |
| `plunder.lastResetDate` | string | `"YYYY-MM-DD"` (local TZ) | unset |

Reads are wrapped in a `loadSettings()` function that returns a single settings object with defaults applied. Writes go through `saveSettings()` (whole-object) or per-key helpers for `usedCombos` / `lastResetDate` to avoid stringifying large state on every change.

### Code Organization

All logic stays in [script.js](../../script.js). New helpers:

- `getNumberRange()` — returns `[1..12]` or `[1..18]` based on current `playerMode`.
- `rebuildNumberWheel()` — clears `numberContentGroup`, re-runs `createSpinnerContent`, resets `numberWheelRotation`.
- `loadSettings()` / `saveSettings(partial)` — localStorage wrapper.
- `checkDailyReset()` — compares `lastResetDate` to today, clears `usedCombos` if stale.
- `getRemainingCombos(letters, numbers, used)` — pure function, returns array of unused combo strings.
- `markComboUsed(letter, number)` — appends and persists.
- `playThunk()` — synthesized stop-sound via Web Audio.
- `vibrate()` — small wrapper around `navigator.vibrate?.(50)`.
- `openSettings()` / `closeSettings()` — modal show/hide, handles outside-tap and disabled-during-spin.

The settings modal markup goes in [index.html](../../index.html). Styles for the gear, modal, segmented control, and toggles go in [styles.css](../../styles.css), reusing existing CSS variables.

The existing `handleRoll()` is the integration point. It:

1. Checks no-repeats. If on, computes remaining combos (running auto-reset if exhausted), picks a target combo, and passes its indices into both `spinWheel` calls (replacing the per-wheel `getSecureRandom` target picks for that spin only).
2. After both wheels stop, if no-repeats is on, marks the combo used.
3. Each wheel-stop triggers vibration + sound + (existing) visual pulse.

To pass a forced target into `spinWheel`, add an optional `forcedIndex` parameter. When supplied, skip the internal `getSecureRandom(items.length)` call and use the forced value.

### Edge Cases

- **Toggle player mode mid-history:** combos with numbers 13–18 already in `usedCombos` stay there; in 2-player mode they are simply unreachable, so they don't affect filtering.
- **Toggle no-repeats off → on mid-game:** existing history is honoured; filtering resumes immediately.
- **Spin in progress when settings opened:** gear is disabled; can't be opened.
- **localStorage unavailable** (private browsing on some browsers): `loadSettings` falls back to in-memory defaults; writes are best-effort wrapped in try/catch. Settings just don't persist.
- **AudioContext not available** (very old browsers): `playThunk` is a try/catch no-op.
- **Day boundary crossed mid-game session:** auto-reset only fires on app load and on settings-modal open; an active session continues with its history until the user reloads or opens settings the next day. This is acceptable — the "day" concept is a convenience, not a contract.

### Defaults Preserve Current UX

A user with no stored settings on their first load after this change sees:

- Player mode = `3+` (1–18 range — unchanged).
- No-repeats = off (independent picks — unchanged).
- Sound = on (new behavior — soft thunk on stop).

Only the sound is a behavioral change for existing users, and it's gateable via the new toggle.

## Testing

Manual testing on:

- Desktop browser (Chrome/Firefox): all features work, vibration silently no-ops.
- Android Chrome: vibration fires.
- iOS Safari: vibration silently no-ops; sound and visual feedback work.

Sanity checks:

- Toggle player mode → number wheel rebuilds with correct range, spins land correctly.
- No-repeats on → never get the same combo twice until exhaustion.
- Force exhaustion (small range, many spins) → history clears silently and spinning continues.
- Reload after midnight (or manually edit `lastResetDate`) → history clears.
- New Game button → history clears immediately.
- Sound toggle off → no audio; vibration and visuals still fire.
- Spin-in-progress → gear disabled.
